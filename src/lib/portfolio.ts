import type { Project } from "../types";
import { joinNonEmpty } from "./util";

export function allProjectTags(projects: Project[]): { tag: string; count: number }[] {
  const m = new Map<string, number>();
  for (const p of projects) for (const t of p.tags) m.set(t, (m.get(t) ?? 0) + 1);
  return Array.from(m.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function filterProjects(projects: Project[], tags: string[], mode: "any" | "all"): Project[] {
  if (!tags.length) return projects;
  return projects.filter((p) => (mode === "any" ? tags.some((t) => p.tags.includes(t)) : tags.every((t) => p.tags.includes(t))));
}

export function portfolioToMarkdown(owner: string, projects: Project[], tags: string[]): string {
  const out: string[] = [];
  out.push(`# ${owner ? `${owner} · ` : ""}作品集摘要`);
  if (tags.length) out.push(`篩選標籤：${tags.map((t) => `\`${t}\``).join(" ")}`);
  out.push(`共 ${projects.length} 個項目`);
  for (const p of projects) {
    const body: string[] = [`## ${p.name || "（未命名項目）"}`];
    const meta = joinNonEmpty([p.role, p.period], " · ");
    if (meta) body.push(`*${meta}*`);
    if (p.tags.length) body.push(p.tags.map((t) => `\`${t}\``).join(" "));
    if (p.summary.trim()) body.push(p.summary.trim());
    if (p.results.trim()) body.push(`**成果：** ${p.results.trim()}`);
    if (p.link.trim()) body.push(`**連結：** ${p.link.trim()}${p.linkNote.trim() ? `（${p.linkNote.trim()}）` : ""}`);
    else if (p.linkNote.trim()) body.push(`**展示說明：** ${p.linkNote.trim()}`);
    out.push(body.join("\n\n"));
  }
  return out.join("\n\n") + "\n";
}

export function portfolioToJSON(owner: string, projects: Project[], tags: string[]): string {
  return JSON.stringify(
    {
      owner,
      exportedAt: new Date().toISOString(),
      filterTags: tags,
      count: projects.length,
      projects: projects.map((p) => ({
        name: p.name,
        role: p.role,
        period: p.period,
        tags: p.tags,
        summary: p.summary,
        results: p.results,
        link: p.link,
        linkNote: p.linkNote,
      })),
    },
    null,
    2,
  );
}
