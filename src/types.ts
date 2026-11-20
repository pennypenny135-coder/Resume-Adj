export type Status = "draft" | "applied" | "interview" | "offer" | "rejected" | "archived";

export const STATUS_LABEL: Record<Status, string> = {
  draft: "草稿",
  applied: "已投遞",
  interview: "面試中",
  offer: "已獲 Offer",
  rejected: "未成功",
  archived: "已封存",
};

export const STATUS_ORDER: Status[] = ["draft", "applied", "interview", "offer", "rejected", "archived"];

export type ContactKey = "email" | "phone" | "location" | "linkedin" | "github" | "portfolio";

export const CONTACT_KEYS: ContactKey[] = ["email", "phone", "location", "linkedin", "github", "portfolio"];

export const CONTACT_LABEL: Record<ContactKey, string> = {
  email: "Email",
  phone: "電話",
  location: "地區",
  linkedin: "LinkedIn",
  github: "GitHub",
  portfolio: "作品集",
};

export interface Profile {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
}

export interface Bullet {
  id: string;
  text: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  start: string;
  end: string;
  location: string;
  tags: string[];
  bullets: Bullet[];
}

export interface Project {
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

export interface SkillGroup {
  id: string;
  category: string;
  items: string[];
}

export interface EduItem {
  id: string;
  kind: "education" | "certification";
  school: string;
  degree: string;
  period: string;
  note: string;
}

export type CoverKind = "opening" | "strengths" | "fit" | "closing" | "other";

export const COVER_KIND_LABEL: Record<CoverKind, string> = {
  opening: "開場動機",
  strengths: "核心優勢",
  fit: "公司契合度",
  closing: "結尾呼籲",
  other: "其他",
};

export interface CoverBlock {
  id: string;
  kind: CoverKind;
  title: string;
  text: string;
}

export interface Master {
  profile: Profile;
  experiences: Experience[];
  projects: Project[];
  skillGroups: SkillGroup[];
  education: EduItem[];
  coverBlocks: CoverBlock[];
}

export interface SectionToggles {
  summary: boolean;
  experience: boolean;
  projects: boolean;
  skills: boolean;
  education: boolean;
}

export interface Layout {
  columns: 1 | 2;
  fontSize: number; // pt
  margin: number; // mm
  paper: "A4" | "Letter";
  font: "sans" | "serif";
  headings: "zh" | "en";
  sections: SectionToggles;
}

export interface CoverSetup {
  company: string;
  role: string;
  manager: string;
  greeting: string; // empty = auto
  signoff: string;
  showDate: boolean;
  date: string;
  blockIds: string[];
  overrides: Record<string, string>;
}

export interface Overrides {
  title?: string;
  summary?: string;
  bulletText: Record<string, string>;
  projectSummary: Record<string, string>;
}

export interface Version {
  id: string;
  name: string;
  note: string;
  status: Status;
  createdAt: number;
  updatedAt: number;
  jd: string;
  contactShow: Record<ContactKey, boolean>;
  expIds: string[];
  bulletSel: Record<string, string[]>;
  projIds: string[];
  skillSel: Record<string, string[]>;
  eduIds: string[];
  overrides: Overrides;
  layout: Layout;
  cover: CoverSetup;
}

export interface AppData {
  schema: 1;
  isSample: boolean;
  master: Master;
  versions: Version[];
  activeId: string;
}

export type TabKey =
  | "versions"
  | "master"
  | "compose"
  | "tailor"
  | "resume"
  | "cover"
  | "portfolio"
  | "diff"
  | "data";
