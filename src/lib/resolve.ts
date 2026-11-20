import type { ContactKey, Layout, Master, Version } from "../types";
import { CONTACT_KEYS, CONTACT_LABEL } from "../types";
import { joinNonEmpty } from "./util";

export interface RBullet {
  id: string;
  text: string;
  overridden: boolean;
}
export interface RExperience {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  tags: string[];
  bullets: RBullet[];
}
export interface RProject {
  id: string;
  name: string;
  role: string;
  period: string;
  tags: string[];
  summary: string;
  results: string;
  link: string;
  linkNote: string;
}
export interface RSkill {
  id: string;
  category: string;
  items: string[];
}
export interface REdu {
  id: string;
  kind: "education" | "certification";
  school: string;
  degree: string;
  period: string;
  note: string;
}
export interface Resolved {
  name: string;
  title: string;
  titleOverridden: boolean;
  summary: string;
  summaryOverridden: boolean;
  contacts: { key: ContactKey; label: string; value: string }[];
  experiences: RExperience[];
  projects: RProject[];
  skills: RSkill[];
  education: REdu[];
  layout: Layout;
}

export const HEADINGS = {
  zh: {
    summary: "個人簡介",
    experience: "工作經驗",
    projects: "項目與作品",
    skills: "技能",
    education: "學歷與證書",
    results: "成果",
    link: "連結",
  },
  en: {
    summary: "Summary",
    experience: "Experience",
    projects: "Projects",
    skills: "Skills",
    education: "Education & Certifications",
    results: "Results",
    link: "Link",
  },
};

export function periodOf(start: string, end: string): string {
  const s = start.trim();
  const e = end.trim();
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

export function resolveResume(master: Master, v: Version): Resolved {
  const p = master.profile;
  const titleOverridden = v.overrides.title !== undefined;
  const summaryOverridden = v.overrides.summary !== undefined;

  const contacts = CONTACT_KEYS.filter((k) => v.contactShow[k] && p[k].trim()).map((k) => ({
    key: k,
    label: CONTACT_LABEL[k],
    value: p[k].trim(),
  }));

  const expMap = new Map(master.experiences.map((e) => [e.id, e]));
  const experiences: RExperience[] = [];
  for (const id of v.expIds) {
    const e = expMap.get(id);
    if (!e) continue;
    const sel = new Set(v.bulletSel[id] ?? []);
    const bmap = new Map(e.bullets.map((b) => [b.id, b]));
    const order = (v.bulletSel[id] ?? []).filter((bid) => bmap.has(bid));
    const bullets: RBullet[] = [];
    for (const bid of order) {
      if (!sel.has(bid)) continue;
      const b = bmap.get(bid)!;
      const ov = v.overrides.bulletText[bid];
      const text = (ov !== undefined ? ov : b.text).trim();
      if (!text) continue;
      bullets.push({ id: bid, text, overridden: ov !== undefined && ov !== b.text });
    }
    experiences.push({
      id,
      company: e.company.trim(),
      role: e.role.trim(),
      period: periodOf(e.start, e.end),
      location: e.location.trim(),
      tags: e.tags,
      bullets,
    });
  }

  const projMap = new Map(master.projects.map((x) => [x.id, x]));
  const projects: RProject[] = [];
  for (const id of v.projIds) {
    const x = projMap.get(id);
    if (!x) continue;
    const ov = v.overrides.projectSummary[id];
    projects.push({
      id,
      name: x.name.trim(),
      role: x.role.trim(),
      period: x.period.trim(),
      tags: x.tags,
      summary: (ov !== undefined ? ov : x.summary).trim(),
      results: x.results.trim(),
      link: x.link.trim(),
      linkNote: x.linkNote.trim(),
    });
  }

  const skills: RSkill[] = [];
  for (const g of master.skillGroups) {
    const sel = v.skillSel[g.id];
    if (!sel) continue;
    const set = new Set(sel);
    const items = g.items.filter((i) => set.has(i));
    if (items.length) skills.push({ id: g.id, category: g.category.trim(), items });
  }

  const eduMap = new Map(master.education.map((x) => [x.id, x]));
  const education: REdu[] = [];
  for (const id of v.eduIds) {
    const x = eduMap.get(id);
    if (!x) continue;
    education.push({
      id,
      kind: x.kind,
      school: x.school.trim(),
      degree: x.degree.trim(),
      period: x.period.trim(),
      note: x.note.trim(),
    });
  }

  return {
    name: p.name.trim(),
    title: (v.overrides.title !== undefined ? v.overrides.title : p.title).trim(),
    titleOverridden: titleOverridden && v.overrides.title !== p.title,
    summary: (v.overrides.summary !== undefined ? v.overrides.summary : p.summary).trim(),
    summaryOverridden: summaryOverridden && v.overrides.summary !== p.summary,
    contacts,
    experiences,
    projects,
    skills,
    education,
    layout: v.layout,
  };
}

export function countActive(r: Resolved) {
  return {
    experiences: r.experiences.length,
    bullets: r.experiences.reduce((n, e) => n + e.bullets.length, 0),
    projects: r.projects.length,
    skillGroups: r.skills.length,
    skillItems: r.skills.reduce((n, s) => n + s.items.length, 0),
    education: r.education.length,
  };
}

/* ---------- Resume exporters ---------- */

export function resumeToMarkdown(r: Resolved): string {
  const H = HEADINGS[r.layout.headings];
  const s = r.layout.sections;
  const out: string[] = [];
  out.push(`# ${r.name || "（未填姓名）"}`);
  if (r.title) out.push(`**${r.title}**`);
  if (r.contacts.length) out.push(r.contacts.map((c) => c.value).join(" · "));
  if (s.summary && r.summary) out.push(`## ${H.summary}\n\n${r.summary}`);
  if (s.experience && r.experiences.length) {
    const blocks = r.experiences.map((e) => {
      const head = `### ${joinNonEmpty([e.role, e.company], " · ")}`;
      const meta = joinNonEmpty([e.period, e.location], " | ");
      const lines = e.bullets.map((b) => `- ${b.text.replace(/\n+/g, " ")}`);
      return [head, meta ? `*${meta}*` : "", lines.join("\n")].filter(Boolean).join("\n\n");
    });
    out.push(`## ${H.experience}\n\n${blocks.join("\n\n")}`);
  }
  if (s.projects && r.projects.length) {
    const blocks = r.projects.map((p) => {
      const head = `### ${p.name}${p.role ? ` · ${p.role}` : ""}`;
      const meta = joinNonEmpty([p.period, p.tags.join(", ")], " | ");
      const body: string[] = [];
      if (p.summary) body.push(p.summary);
      if (p.results) body.push(`**${H.results}：** ${p.results}`);
      if (p.link) body.push(`${H.link}：${p.link}${p.linkNote ? `（${p.linkNote}）` : ""}`);
      return [head, meta ? `*${meta}*` : "", body.join("\n\n")].filter(Boolean).join("\n\n");
    });
    out.push(`## ${H.projects}\n\n${blocks.join("\n\n")}`);
  }
  if (s.skills && r.skills.length) {
    out.push(`## ${H.skills}\n\n${r.skills.map((g) => `- **${g.category}：** ${g.items.join("、")}`).join("\n")}`);
  }
  if (s.education && r.education.length) {
    const lines = r.education.map((e) => {
      const main = joinNonEmpty([e.degree, e.school], " · ");
      const meta = joinNonEmpty([e.period, e.note], " | ");
      return `- **${main}**${meta ? ` — ${meta}` : ""}`;
    });
    out.push(`## ${H.education}\n\n${lines.join("\n")}`);
  }
  return out.join("\n\n") + "\n";
}

export function resumeToText(r: Resolved): string {
  const H = HEADINGS[r.layout.headings];
  const s = r.layout.sections;
  const out: string[] = [];
  const top: string[] = [];
  top.push(r.name || "（未填姓名）");
  if (r.title) top.push(r.title);
  if (r.contacts.length) top.push(r.contacts.map((c) => c.value).join(" | "));
  out.push(top.join("\n"));
  const sec = (title: string, body: string) => `${title.toUpperCase()}\n${"-".repeat(Math.min(40, title.length * 2))}\n${body}`;
  if (s.summary && r.summary) out.push(sec(H.summary, r.summary));
  if (s.experience && r.experiences.length) {
    const blocks = r.experiences.map((e) => {
      const head = joinNonEmpty([e.role, e.company], " - ");
      const meta = joinNonEmpty([e.period, e.location], " | ");
      return [head, meta, ...e.bullets.map((b) => `  * ${b.text.replace(/\n+/g, " ")}`)].filter(Boolean).join("\n");
    });
    out.push(sec(H.experience, blocks.join("\n\n")));
  }
  if (s.projects && r.projects.length) {
    const blocks = r.projects.map((p) => {
      const head = joinNonEmpty([p.name, p.role], " - ");
      const meta = joinNonEmpty([p.period, p.tags.join(", ")], " | ");
      const lines = [head, meta];
      if (p.summary) lines.push(p.summary);
      if (p.results) lines.push(`${H.results}: ${p.results}`);
      if (p.link) lines.push(`${H.link}: ${p.link}${p.linkNote ? ` (${p.linkNote})` : ""}`);
      return lines.filter(Boolean).join("\n");
    });
    out.push(sec(H.projects, blocks.join("\n\n")));
  }
  if (s.skills && r.skills.length) {
    out.push(sec(H.skills, r.skills.map((g) => `${g.category}: ${g.items.join(", ")}`).join("\n")));
  }
  if (s.education && r.education.length) {
    out.push(
      sec(
        H.education,
        r.education
          .map((e) => joinNonEmpty([joinNonEmpty([e.degree, e.school], " - "), joinNonEmpty([e.period, e.note], " | ")], "\n"))
          .join("\n"),
      ),
    );
  }
  return out.join("\n\n") + "\n";
}

/* ---------- Cover letter ---------- */

export interface ResolvedCover {
  name: string;
  title: string;
  contacts: string[];
  date: string;
  greeting: string;
  paragraphs: { id: string; text: string }[];
  signoff: string;
}

export function applyVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (m, key: string) => {
    const k = key.toLowerCase();
    if (k in vars) return vars[k];
    return m;
  });
}

export function coverVars(master: Master, v: Version): Record<string, string> {
  const c = v.cover;
  return {
    company: c.company.trim() || "［公司名稱］",
    role: c.role.trim() || "［職位名稱］",
    manager: c.manager.trim() || "招聘主管",
    name: master.profile.name.trim() || "［姓名］",
    title: master.profile.title.trim(),
    date: c.date,
  };
}

export function resolveCover(master: Master, v: Version): ResolvedCover {
  const vars = coverVars(master, v);
  const c = v.cover;
  const map = new Map(master.coverBlocks.map((b) => [b.id, b]));
  const paragraphs: { id: string; text: string }[] = [];
  for (const id of c.blockIds) {
    const b = map.get(id);
    if (!b) continue;
    const raw = c.overrides[id] !== undefined ? c.overrides[id] : b.text;
    const text = applyVars(raw, vars).trim();
    if (text) paragraphs.push({ id, text });
  }
  const greeting = c.greeting.trim()
    ? applyVars(c.greeting, vars)
    : c.manager.trim()
      ? `${c.manager.trim()} 您好：`
      : "敬啟者：";
  const contacts = CONTACT_KEYS.filter((k) => v.contactShow[k] && master.profile[k].trim()).map((k) => master.profile[k].trim());
  return {
    name: master.profile.name.trim(),
    title: (v.overrides.title !== undefined ? v.overrides.title : master.profile.title).trim(),
    contacts,
    date: c.showDate ? c.date : "",
    greeting,
    paragraphs,
    signoff: applyVars(c.signoff, vars).trim(),
  };
}

export function coverToText(c: ResolvedCover): string {
  const out: string[] = [];
  const head = [c.name, c.title, c.contacts.join(" | ")].filter(Boolean).join("\n");
  if (head) out.push(head);
  if (c.date) out.push(c.date);
  out.push(c.greeting);
  for (const p of c.paragraphs) out.push(p.text);
  out.push([c.signoff, c.name].filter(Boolean).join("\n"));
  return out.join("\n\n") + "\n";
}

export function coverToMarkdown(c: ResolvedCover): string {
  const out: string[] = [];
  if (c.name) out.push(`**${c.name}**${c.title ? `  \n${c.title}` : ""}${c.contacts.length ? `  \n${c.contacts.join(" · ")}` : ""}`);
  if (c.date) out.push(c.date);
  out.push(c.greeting);
  for (const p of c.paragraphs) out.push(p.text);
  out.push([c.signoff, c.name ? `**${c.name}**` : ""].filter(Boolean).join("  \n"));
  return out.join("\n\n") + "\n";
}
