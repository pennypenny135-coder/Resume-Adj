import type { Master, Version } from "../types";
import { CONTACT_LABEL } from "../types";
import { resolveResume, resolveCover, periodOf, type Resolved } from "./resolve";
import { joinNonEmpty } from "./util";

export interface Seg {
  t: string;
  type: "eq" | "del" | "ins";
}

export interface DiffLine {
  key: string;
  section: string;
  label: string;
  kind: "added" | "removed" | "changed" | "moved";
  before?: string;
  after?: string;
  segs?: Seg[];
}

interface FlatItem {
  section: string;
  label: string;
  text: string;
}

interface Flat {
  items: Map<string, FlatItem>;
  orders: Map<string, { label: string; keys: string[]; names: Map<string, string> }>;
}

function flatten(master: Master, v: Version, r: Resolved): Flat {
  const items = new Map<string, FlatItem>();
  const orders: Flat["orders"] = new Map();
  const put = (key: string, section: string, label: string, text: string) => items.set(key, { section, label, text });

  put("meta:title", "基本資料", "職銜", r.title);
  put("meta:summary", "基本資料", "個人簡介", r.summary);
  for (const k of Object.keys(CONTACT_LABEL) as (keyof typeof CONTACT_LABEL)[]) {
    const c = r.contacts.find((x) => x.key === k);
    put(`contact:${k}`, "聯絡資訊", CONTACT_LABEL[k], c ? c.value : "");
  }
  // layout/section toggles
  const sectionNames: Record<string, string> = {
    summary: "個人簡介",
    experience: "工作經驗",
    projects: "項目",
    skills: "技能",
    education: "學歷與證書",
  };
  for (const [k, on] of Object.entries(r.layout.sections)) {
    put(`layout:section:${k}`, "版面", `顯示「${sectionNames[k]}」區塊`, on ? "顯示" : "隱藏");
  }
  put("layout:columns", "版面", "欄數", `${r.layout.columns} 欄`);

  const expNames = new Map<string, string>();
  for (const e of r.experiences) {
    const name = joinNonEmpty([e.role, e.company], " @ ") || "（未命名經驗）";
    expNames.set(e.id, name);
    put(`exp:${e.id}`, "工作經驗", name, joinNonEmpty([name, e.period, e.location], " | "));
    const bNames = new Map<string, string>();
    e.bullets.forEach((b, i) => {
      bNames.set(b.id, b.text.slice(0, 30));
      const snippet = b.text.replace(/\s+/g, " ").slice(0, 28);
      put(`exp:${e.id}:b:${b.id}`, "工作經驗", `${e.company || name} › ${snippet}${b.text.length > 28 ? "…" : ""}`, b.text);
      void i;
    });
    orders.set(`bullets:${e.id}`, { label: `「${name}」Bullet 順序`, keys: e.bullets.map((b) => `exp:${e.id}:b:${b.id}`), names: bNames });
  }
  orders.set("exps", {
    label: "工作經驗順序",
    keys: r.experiences.map((e) => `exp:${e.id}`),
    names: new Map(r.experiences.map((e) => [`exp:${e.id}`, expNames.get(e.id) ?? ""])),
  });

  for (const p of r.projects) {
    put(
      `proj:${p.id}`,
      "項目",
      p.name || "（未命名項目）",
      joinNonEmpty([p.name, p.role, p.period, p.summary, p.results], "\n"),
    );
  }
  orders.set("projs", {
    label: "項目順序",
    keys: r.projects.map((p) => `proj:${p.id}`),
    names: new Map(r.projects.map((p) => [`proj:${p.id}`, p.name])),
  });

  for (const s of r.skills) put(`skill:${s.id}`, "技能", s.category || "（未命名分類）", `${s.category}: ${s.items.join("、")}`);
  for (const e of r.education)
    put(
      `edu:${e.id}`,
      "學歷與證書",
      joinNonEmpty([e.degree, e.school], " · ") || "（未命名）",
      joinNonEmpty([e.degree, e.school, periodOf(e.period, ""), e.note], " | "),
    );

  // cover letter
  const cv = resolveCover(master, v);
  put("cover:greeting", "求職信", "稱呼", cv.greeting);
  put("cover:signoff", "求職信", "結語", cv.signoff);
  const cNames = new Map<string, string>();
  const coverTitle = new Map(master.coverBlocks.map((b) => [b.id, b.title]));
  for (const p of cv.paragraphs) {
    cNames.set(`cover:${p.id}`, coverTitle.get(p.id) ?? "");
    put(`cover:${p.id}`, "求職信", `段落：${coverTitle.get(p.id) || "（未命名）"}`, p.text);
  }
  orders.set("cover", { label: "求職信段落順序", keys: cv.paragraphs.map((p) => `cover:${p.id}`), names: cNames });

  return { items, orders };
}

const TOKEN = /[\u3400-\u9fff\uf900-\ufaff]|[A-Za-z0-9_.+#\-/]+|\s+|[^\s]/g;

export function diffText(a: string, b: string): Seg[] {
  const A = a.match(TOKEN) ?? [];
  const B = b.match(TOKEN) ?? [];
  if (A.length * B.length > 250_000) {
    return [
      { t: a, type: "del" },
      { t: b, type: "ins" },
    ];
  }
  const n = A.length;
  const m = B.length;
  const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const segs: Seg[] = [];
  const push = (t: string, type: Seg["type"]) => {
    const last = segs[segs.length - 1];
    if (last && last.type === type) last.t += t;
    else segs.push({ t, type });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) {
      push(A[i], "eq");
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push(A[i++], "del");
    } else {
      push(B[j++], "ins");
    }
  }
  while (i < n) push(A[i++], "del");
  while (j < m) push(B[j++], "ins");
  return segs;
}

export function diffVersions(master: Master, base: Version, target: Version): DiffLine[] {
  const fa = flatten(master, base, resolveResume(master, base));
  const fb = flatten(master, target, resolveResume(master, target));
  const lines: DiffLine[] = [];

  const keys = new Set<string>([...fa.items.keys(), ...fb.items.keys()]);
  for (const key of keys) {
    const x = fa.items.get(key);
    const y = fb.items.get(key);
    const xt = x?.text ?? "";
    const yt = y?.text ?? "";
    const section = (y ?? x)!.section;
    const label = (y ?? x)!.label;
    if (xt === yt) continue;
    if (x && y && key.startsWith("exp:") && key.includes(":b:")) {
      lines.push({ key, section, label, kind: "changed", before: xt, after: yt, segs: diffText(xt, yt) });
    } else if (!xt && yt) {
      lines.push({ key, section, label, kind: "added", after: yt });
    } else if (xt && !yt) {
      lines.push({ key, section, label, kind: "removed", before: xt });
    } else {
      lines.push({ key, section, label, kind: "changed", before: xt, after: yt, segs: diffText(xt, yt) });
    }
  }

  // order changes among common keys
  for (const [oKey, oa] of fa.orders) {
    const ob = fb.orders.get(oKey);
    if (!ob) continue;
    const common = oa.keys.filter((k) => ob.keys.includes(k));
    const commonB = ob.keys.filter((k) => oa.keys.includes(k));
    if (common.length > 1 && common.join("|") !== commonB.join("|")) {
      const nm = (o: typeof oa, k: string) => (o.names.get(k) || k).replace(/\s+/g, " ");
      lines.push({
        key: `order:${oKey}`,
        section: oKey.startsWith("bullets") ? "工作經驗" : oKey === "exps" ? "工作經驗" : oKey === "projs" ? "項目" : "求職信",
        label: oa.label,
        kind: "moved",
        before: common.map((k, i) => `${i + 1}. ${nm(oa, k)}`).join("\n"),
        after: commonB.map((k, i) => `${i + 1}. ${nm(ob, k)}`).join("\n"),
      });
    }
  }

  const order = ["基本資料", "聯絡資訊", "工作經驗", "項目", "技能", "學歷與證書", "版面", "求職信"];
  lines.sort((p, q) => order.indexOf(p.section) - order.indexOf(q.section));
  return lines;
}
