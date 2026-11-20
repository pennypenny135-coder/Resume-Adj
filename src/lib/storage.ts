import type {
  AppData,
  Bullet,
  ContactKey,
  CoverBlock,
  CoverKind,
  EduItem,
  Experience,
  Layout,
  Master,
  Project,
  SkillGroup,
  Status,
  Version,
} from "../types";
import { CONTACT_KEYS, STATUS_ORDER } from "../types";
import { buildSampleData } from "../sampleData";
import { DEFAULT_LAYOUT, emptyAppData, emptyMaster, versionFromMaster } from "./versions";
import { todayString, uid } from "./util";

export const STORAGE_KEY = "resume-tailorer:v1";
export const BACKUP_APP_ID = "resume-tailorer";

interface Stored {
  data: AppData;
  savedAt: number;
}

export function loadFromStorage(): { data: AppData; savedAt: number | null; fresh: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Stored;
      const data = sanitizeData(parsed.data);
      if (data) return { data, savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : null, fresh: false };
    }
  } catch {
    /* corrupted or unavailable storage — fall back to sample */
  }
  return { data: buildSampleData(), savedAt: null, fresh: true };
}

export function saveToStorage(data: AppData): number {
  const savedAt = Date.now();
  const payload: Stored = { data, savedAt };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return savedAt;
}

export function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function storageSizeKB(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Math.round((new Blob([raw]).size / 1024) * 10) / 10 : 0;
  } catch {
    return 0;
  }
}

export function makeBackup(data: AppData): string {
  return JSON.stringify({ app: BACKUP_APP_ID, schema: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}

export function parseBackup(text: string): AppData {
  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error("檔案不是有效的 JSON。");
  }
  const o = obj as { app?: string; data?: unknown };
  const candidate = o && typeof o === "object" && "data" in o ? o.data : obj;
  const data = sanitizeData(candidate);
  if (!data) throw new Error("備份內容格式不正確，找不到母版資料或版本。");
  return data;
}

/* ------------------------- sanitizers ------------------------- */

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const str = (x: unknown, d = ""): string => (typeof x === "string" ? x : typeof x === "number" ? String(x) : d);
const arr = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
const strArr = (x: unknown): string[] => arr(x).filter((s): s is string => typeof s === "string");
const bool = (x: unknown, d: boolean) => (typeof x === "boolean" ? x : d);
const num = (x: unknown, d: number, min: number, max: number) =>
  typeof x === "number" && isFinite(x) ? Math.min(max, Math.max(min, x)) : d;
const rec = (x: unknown): Record<string, string> => {
  const out: Record<string, string> = {};
  if (isObj(x)) for (const [k, v] of Object.entries(x)) if (typeof v === "string") out[k] = v;
  return out;
};
const recArr = (x: unknown): Record<string, string[]> => {
  const out: Record<string, string[]> = {};
  if (isObj(x)) for (const [k, v] of Object.entries(x)) out[k] = strArr(v);
  return out;
};

function sanitizeMaster(x: unknown): Master {
  const m = isObj(x) ? x : {};
  const base = emptyMaster();
  const p = isObj(m.profile) ? m.profile : {};
  const profile = { ...base.profile };
  for (const k of Object.keys(profile) as (keyof typeof profile)[]) profile[k] = str(p[k]);

  const experiences: Experience[] = arr(m.experiences)
    .filter(isObj)
    .map((e) => ({
      id: str(e.id) || uid("exp"),
      company: str(e.company),
      role: str(e.role),
      start: str(e.start),
      end: str(e.end),
      location: str(e.location),
      tags: strArr(e.tags),
      bullets: arr(e.bullets)
        .filter(isObj)
        .map((b): Bullet => ({ id: str(b.id) || uid("b"), text: str(b.text) })),
    }));
  const projects: Project[] = arr(m.projects)
    .filter(isObj)
    .map((e) => ({
      id: str(e.id) || uid("proj"),
      name: str(e.name),
      role: str(e.role),
      period: str(e.period),
      tags: strArr(e.tags),
      summary: str(e.summary),
      results: str(e.results),
      link: str(e.link),
      linkNote: str(e.linkNote),
    }));
  const skillGroups: SkillGroup[] = arr(m.skillGroups)
    .filter(isObj)
    .map((e) => ({ id: str(e.id) || uid("sk"), category: str(e.category), items: strArr(e.items) }));
  const education: EduItem[] = arr(m.education)
    .filter(isObj)
    .map((e) => ({
      id: str(e.id) || uid("edu"),
      kind: e.kind === "certification" ? "certification" : "education",
      school: str(e.school),
      degree: str(e.degree),
      period: str(e.period),
      note: str(e.note),
    }));
  const kinds: CoverKind[] = ["opening", "strengths", "fit", "closing", "other"];
  const coverBlocks: CoverBlock[] = arr(m.coverBlocks)
    .filter(isObj)
    .map((e) => ({
      id: str(e.id) || uid("cb"),
      kind: kinds.includes(e.kind as CoverKind) ? (e.kind as CoverKind) : "other",
      title: str(e.title),
      text: str(e.text),
    }));
  return { profile, experiences, projects, skillGroups, education, coverBlocks };
}

function sanitizeLayout(x: unknown): Layout {
  const l = isObj(x) ? x : {};
  const s = isObj(l.sections) ? l.sections : {};
  const d = DEFAULT_LAYOUT;
  return {
    columns: l.columns === 2 ? 2 : 1,
    fontSize: num(l.fontSize, d.fontSize, 8, 14),
    margin: num(l.margin, d.margin, 5, 30),
    paper: l.paper === "Letter" ? "Letter" : "A4",
    font: l.font === "serif" ? "serif" : "sans",
    headings: l.headings === "en" ? "en" : "zh",
    sections: {
      summary: bool(s.summary, true),
      experience: bool(s.experience, true),
      projects: bool(s.projects, true),
      skills: bool(s.skills, true),
      education: bool(s.education, true),
    },
  };
}

function sanitizeVersion(x: Record<string, unknown>, master: Master): Version {
  const fallback = versionFromMaster(master, "");
  const cs = isObj(x.contactShow) ? x.contactShow : {};
  const contactShow = {} as Record<ContactKey, boolean>;
  for (const k of CONTACT_KEYS) contactShow[k] = bool(cs[k], fallback.contactShow[k]);
  const ov = isObj(x.overrides) ? x.overrides : {};
  const cv = isObj(x.cover) ? x.cover : {};
  const now = Date.now();
  return {
    id: str(x.id) || uid("v"),
    name: str(x.name, "未命名版本") || "未命名版本",
    note: str(x.note),
    status: STATUS_ORDER.includes(x.status as Status) ? (x.status as Status) : "draft",
    createdAt: num(x.createdAt, now, 0, Number.MAX_SAFE_INTEGER),
    updatedAt: num(x.updatedAt, now, 0, Number.MAX_SAFE_INTEGER),
    jd: str(x.jd),
    contactShow,
    expIds: strArr(x.expIds),
    bulletSel: recArr(x.bulletSel),
    projIds: strArr(x.projIds),
    skillSel: recArr(x.skillSel),
    eduIds: strArr(x.eduIds),
    overrides: {
      title: typeof ov.title === "string" ? ov.title : undefined,
      summary: typeof ov.summary === "string" ? ov.summary : undefined,
      bulletText: rec(ov.bulletText),
      projectSummary: rec(ov.projectSummary),
    },
    layout: sanitizeLayout(x.layout),
    cover: {
      company: str(cv.company),
      role: str(cv.role),
      manager: str(cv.manager),
      greeting: str(cv.greeting),
      signoff: str(cv.signoff, "此致"),
      showDate: bool(cv.showDate, true),
      date: str(cv.date) || todayString(),
      blockIds: strArr(cv.blockIds),
      overrides: rec(cv.overrides),
    },
  };
}

export function sanitizeData(x: unknown): AppData | null {
  if (!isObj(x) || !isObj(x.master)) return null;
  const master = sanitizeMaster(x.master);
  let versions = arr(x.versions)
    .filter(isObj)
    .map((v) => sanitizeVersion(v, master));
  // de-duplicate ids
  const seen = new Set<string>();
  versions = versions.map((v) => {
    if (seen.has(v.id)) v.id = uid("v");
    seen.add(v.id);
    return v;
  });
  if (!versions.length) {
    versions = emptyAppData().versions.map(() => versionFromMaster(master, "我的第一個版本"));
  }
  const activeId = versions.some((v) => v.id === x.activeId) ? (x.activeId as string) : versions[0].id;
  return { schema: 1, isSample: bool(x.isSample, false), master, versions, activeId };
}
