import type { AppData, ContactKey, CoverSetup, Layout, Master, Version } from "../types";
import { CONTACT_KEYS } from "../types";
import { todayString, uid } from "./util";

export const DEFAULT_LAYOUT: Layout = {
  columns: 1,
  fontSize: 10,
  margin: 14,
  paper: "A4",
  font: "sans",
  headings: "zh",
  sections: { summary: true, experience: true, projects: true, skills: true, education: true },
};

export function emptyMaster(): Master {
  return {
    profile: {
      name: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: "",
      summary: "",
    },
    experiences: [],
    projects: [],
    skillGroups: [],
    education: [],
    coverBlocks: [],
  };
}

function defaultCover(master: Master): CoverSetup {
  return {
    company: "",
    role: "",
    manager: "",
    greeting: "",
    signoff: "此致",
    showDate: true,
    date: todayString(),
    blockIds: master.coverBlocks.map((b) => b.id),
    overrides: {},
  };
}

/** Create a version with everything from the master enabled. */
export function versionFromMaster(master: Master, name: string): Version {
  const now = Date.now();
  const contactShow = {} as Record<ContactKey, boolean>;
  for (const k of CONTACT_KEYS) contactShow[k] = !!master.profile[k].trim();
  const bulletSel: Record<string, string[]> = {};
  for (const e of master.experiences) bulletSel[e.id] = e.bullets.map((b) => b.id);
  const skillSel: Record<string, string[]> = {};
  for (const g of master.skillGroups) skillSel[g.id] = g.items.slice();
  return {
    id: uid("v"),
    name,
    note: "",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    jd: "",
    contactShow,
    expIds: master.experiences.map((e) => e.id),
    bulletSel,
    projIds: master.projects.map((p) => p.id),
    skillSel,
    eduIds: master.education.map((e) => e.id),
    overrides: { bulletText: {}, projectSummary: {} },
    layout: structuredClone(DEFAULT_LAYOUT),
    cover: defaultCover(master),
  };
}

/** Create a version with nothing selected (blank canvas). */
export function blankVersion(master: Master, name: string): Version {
  const v = versionFromMaster(master, name);
  v.expIds = [];
  v.bulletSel = {};
  v.projIds = [];
  v.skillSel = {};
  v.eduIds = [];
  v.cover.blockIds = [];
  return v;
}

export function cloneVersion(src: Version, name: string): Version {
  const now = Date.now();
  const copy = structuredClone(src);
  copy.id = uid("v");
  copy.name = name;
  copy.status = "draft";
  copy.createdAt = now;
  copy.updatedAt = now;
  return copy;
}

export function emptyAppData(): AppData {
  const master = emptyMaster();
  const v = versionFromMaster(master, "我的第一個版本");
  return { schema: 1, isSample: false, master, versions: [v], activeId: v.id };
}

/** Virtual "master baseline" version used in diffs: all enabled, no overrides. */
export function masterBaseline(master: Master): Version {
  const v = versionFromMaster(master, "母版（全部素材）");
  v.id = "__master__";
  return v;
}
