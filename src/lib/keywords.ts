import type { Master, Version } from "../types";
import { uniq } from "./util";

/* ------------------------------------------------------------------ *
 * Pure local keyword analysis. No network, no AI — just dictionaries,
 * word counting and string matching.
 * ------------------------------------------------------------------ */

/** Each entry: first item is the display term, the rest are aliases. */
const DICT: string[][] = [
  // Frontend
  ["React", "reactjs", "react.js"],
  ["Vue", "vuejs", "vue.js"],
  ["Angular"],
  ["Next.js", "nextjs"],
  ["Svelte"],
  ["TypeScript", "ts"],
  ["JavaScript", "js", "ecmascript", "es6"],
  ["HTML"],
  ["CSS", "css3", "scss", "sass"],
  ["Tailwind CSS", "tailwind"],
  ["Redux"],
  ["Webpack"],
  ["Vite"],
  ["Storybook"],
  ["Design System", "設計系統", "设计系统"],
  ["Responsive", "響應式", "rwd"],
  ["Accessibility", "a11y", "wcag", "無障礙", "无障碍"],
  ["Performance", "web performance", "效能優化", "性能優化", "性能优化", "效能"],
  ["Frontend", "front-end", "front end", "前端"],
  ["Backend", "back-end", "back end", "後端", "后端"],
  ["Full Stack", "full-stack", "fullstack", "全端"],
  // Backend / infra
  ["Node.js", "nodejs", "node js"],
  ["Python"],
  ["Java"],
  ["Go", "golang"],
  ["C++"],
  ["C#"],
  [".NET", "dotnet"],
  ["PHP"],
  ["Ruby"],
  ["Rust"],
  ["Kotlin"],
  ["Swift"],
  ["GraphQL"],
  ["REST API", "restful", "rest api", "rest apis"],
  ["API"],
  ["Microservices", "微服務", "微服务"],
  ["SQL"],
  ["PostgreSQL", "postgres"],
  ["MySQL"],
  ["MongoDB"],
  ["Redis"],
  ["Docker"],
  ["Kubernetes", "k8s"],
  ["AWS", "amazon web services"],
  ["Azure"],
  ["GCP", "google cloud"],
  ["CI/CD", "ci cd", "cicd", "持續整合", "持续集成"],
  ["Git"],
  ["Linux"],
  ["WebSocket", "websockets"],
  // Quality
  ["Testing", "測試", "测试", "unit test", "unit testing"],
  ["Jest"],
  ["Cypress"],
  ["Playwright"],
  ["TDD"],
  ["Code Review", "代碼審查", "代码审查", "程式碼審查"],
  // Data / AI
  ["Data Analysis", "數據分析", "数据分析", "data analytics", "資料分析"],
  ["A/B Testing", "ab testing", "a/b test", "ab test", "a/b 測試"],
  ["Machine Learning", "機器學習", "机器学习", "ml"],
  ["AI", "artificial intelligence", "人工智能", "人工智慧"],
  ["LLM", "large language model", "大語言模型"],
  ["Tableau"],
  ["Power BI", "powerbi"],
  ["Excel"],
  ["Google Analytics", "ga4"],
  ["KPI"],
  ["OKR"],
  // Product / design
  ["Product Management", "產品管理", "产品管理", "product manager", "產品經理", "产品经理"],
  ["Roadmap", "產品路線圖", "路線圖", "产品路线图"],
  ["User Research", "用戶研究", "用户研究", "用戶訪談", "user interview", "用戶調研"],
  ["UX", "user experience", "用戶體驗", "用户体验"],
  ["UI", "user interface", "介面設計", "界面設計"],
  ["Figma"],
  ["Wireframe", "wireframing", "線框圖", "原型", "prototype", "prototyping"],
  ["Jira"],
  ["Confluence"],
  ["Stakeholder", "持份者", "利益相關者", "stakeholders"],
  ["PRD", "product requirement", "需求文檔", "需求文件"],
  ["Go-to-Market", "gtm", "go to market"],
  ["B2B"],
  ["B2C"],
  ["SaaS"],
  ["Fintech", "金融科技"],
  ["E-commerce", "ecommerce", "電商", "电商", "電子商務"],
  // Process / soft
  ["Agile", "敏捷"],
  ["Scrum"],
  ["Kanban"],
  ["Project Management", "項目管理", "專案管理", "项目管理", "project manager"],
  ["Leadership", "領導", "领导力", "領導力"],
  ["Mentoring", "mentor", "coaching", "指導", "輔導新人"],
  ["Team Management", "團隊管理", "团队管理", "people management", "帶領團隊", "带领团队"],
  ["Cross-functional", "cross functional", "跨部門", "跨部门", "跨團隊", "跨职能"],
  ["Communication", "溝通", "沟通", "communication skills"],
  ["Collaboration", "協作", "协作", "團隊合作", "团队合作", "teamwork"],
  ["Problem Solving", "問題解決", "解決問題", "问题解决"],
  ["Ownership", "責任感", "owner"],
  ["Presentation", "簡報", "演講"],
  ["English", "英文", "英語"],
  ["Mandarin", "普通話", "國語"],
  ["Cantonese", "廣東話", "粵語"],
  // marketing / ops
  ["SEO"],
  ["Content Marketing", "內容營銷", "內容行銷"],
  ["Digital Marketing", "數碼營銷", "數位行銷", "digital marketing"],
  ["CRM"],
  ["Budget", "預算", "预算"],
];

const EN_STOP = new Set(
  (
    "the and for are but not you your our with that this from have has had will would can could should may might " +
    "all any each other more most such than then them they their there these those into onto over under about above " +
    "who whom whose which what when where why how also able been being were was its it's a an as at by in is it of on or to be do does did so if we us " +
    "experience experiences work working works team teams role roles job position positions candidate candidates ability abilities skill skills " +
    "strong good great excellent knowledge understanding including include includes etc plus required requirements requirement responsibilities responsibility " +
    "years year least minimum preferred preferably looking join company companies business well new use using used within across while " +
    "must need needs needed help helping make making build building like get gets high based related relevant ideal opportunity benefits salary " +
    "apply application applicants hiring employer equal position seeking responsible develop developing development ensure support supporting " +
    "provide providing drive driving deliver delivering across internal external day daily time full part day-to-day one two three four five " +
    "both either via per own same just only very much many some every being their deep proven demonstrated familiarity familiar proficiency proficient " +
    "degree bachelor master related field equivalent"
  ).split(/\s+/),
);

const ZH_STOP_CHARS = "的了和及與与在是有等或之為为於于並并能可我你您們们以對对要會会到從从其中者將将由已被把給给該该此這这那不人也都就而又更很最";
const ZH_STOP_WORDS = [
  "負責", "负责", "職責", "职责", "要求", "崗位", "岗位", "職位", "职位", "工作", "經驗", "经验", "以上", "相關", "相关",
  "優先", "优先", "熟悉", "具備", "具备", "良好", "公司", "我們", "我们", "加分", "條件", "条件", "學歷", "学历", "畢業", "毕业",
  "具有", "擁有", "拥有", "能夠", "能够", "進行", "进行", "包括", "以及", "提供", "參與", "参与", "團隊", "团队", "能力", "優秀", "优秀",
  "福利", "薪酬", "薪資", "待遇", "任職", "任职", "年以", "年經", "年以上", "歡迎", "欢迎", "工作經", "了解", "瞭解", "理解", "掌握",
];

const isAlnum = (ch: string | undefined) => !!ch && /[a-z0-9]/i.test(ch);

/** Count occurrences with word-boundary awareness for latin edges. */
export function countTerm(textLower: string, aliasLower: string): number {
  if (!aliasLower) return 0;
  let count = 0;
  let from = 0;
  const first = aliasLower[0];
  const last = aliasLower[aliasLower.length - 1];
  for (;;) {
    const i = textLower.indexOf(aliasLower, from);
    if (i === -1) break;
    const before = textLower[i - 1];
    const after = textLower[i + aliasLower.length];
    const okBefore = !(isAlnum(first) && isAlnum(before));
    const okAfter = !(isAlnum(last) && isAlnum(after));
    // "c++" / ".net": symbols attached to letters are fine, but "js" inside "node.js" is guarded by alnum rule.
    if (okBefore && okAfter) count++;
    from = i + Math.max(1, aliasLower.length);
  }
  return count;
}

export interface Term {
  /** display text */
  term: string;
  /** all lowercase variants to search */
  variants: string[];
}

export interface KeywordHit extends Term {
  count: number; // occurrences in JD
  kind: "dict" | "bank" | "freq";
  covered: boolean;
}

function termFromDict(entry: string[]): Term {
  // "Go" alone is too ambiguous in prose ("go-to-market"); only match its alias "golang".
  const list = entry[0] === "Go" ? entry.slice(1) : entry;
  return { term: entry[0], variants: uniq(list.map((s) => s.toLowerCase())) };
}

export function termCount(textLower: string, t: Term): number {
  return t.variants.reduce((n, v) => n + countTerm(textLower, v), 0);
}

function bankTerms(master: Master): string[] {
  const set: string[] = [];
  for (const g of master.skillGroups) set.push(...g.items);
  for (const e of master.experiences) set.push(...e.tags);
  for (const p of master.projects) set.push(...p.tags);
  return uniq(set.map((s) => s.trim()).filter((s) => s.length >= 2));
}

function chineseGrams(jd: string): { term: string; count: number }[] {
  const segs = jd.match(/[\u4e00-\u9fff]+/g) ?? [];
  const counts = new Map<string, number>();
  for (const seg of segs) {
    for (let n = 2; n <= 4; n++) {
      for (let i = 0; i + n <= seg.length; i++) {
        const g = seg.slice(i, i + n);
        counts.set(g, (counts.get(g) ?? 0) + 1);
      }
    }
  }
  let list = Array.from(counts.entries()).filter(([g, c]) => {
    if (c < 2) return false;
    for (const ch of g) if (ZH_STOP_CHARS.includes(ch)) return false;
    for (const w of ZH_STOP_WORDS) if (g.includes(w)) return false;
    return true;
  });
  // drop grams subsumed by a longer gram with the same (or higher) count
  list = list.filter(([g, c]) => !list.some(([g2, c2]) => g2 !== g && g2.length > g.length && g2.includes(g) && c2 >= c));
  return list.sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).map(([term, count]) => ({ term, count }));
}

function englishFreq(jdLower: string): { term: string; count: number }[] {
  const tokens = jdLower.match(/[a-z][a-z0-9+#.\-/]*[a-z0-9+#]|[a-z]/g) ?? [];
  const counts = new Map<string, number>();
  for (const t of tokens) {
    if (t.length < 3 || EN_STOP.has(t)) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([term, count]) => ({ term, count }));
}

export interface Analysis {
  hasJD: boolean;
  keywords: KeywordHit[];
  covered: KeywordHit[];
  missing: KeywordHit[];
  coverage: number | null; // 0..1
}

export const EMPTY_ANALYSIS: Analysis = { hasJD: false, keywords: [], covered: [], missing: [], coverage: null };

const MAX_KEYWORDS = 45;

export function analyzeJD(jd: string, master: Master, resumeText: string): Analysis {
  const text = jd.trim();
  if (!text) return EMPTY_ANALYSIS;
  const jdLower = text.toLowerCase();
  const resumeLower = resumeText.toLowerCase();

  const hits: KeywordHit[] = [];
  const seenVariant = new Set<string>();
  const add = (t: Term, kind: KeywordHit["kind"]) => {
    if (t.variants.some((v) => seenVariant.has(v))) return;
    const count = termCount(jdLower, t);
    if (count <= 0) return;
    t.variants.forEach((v) => seenVariant.add(v));
    hits.push({ ...t, count, kind, covered: termCount(resumeLower, t) > 0 });
  };

  for (const entry of DICT) add(termFromDict(entry), "dict");

  // user's own vocabulary (skills + tags): merge into dictionary groups if they alias one.
  for (const b of bankTerms(master)) {
    const lower = b.toLowerCase();
    if (seenVariant.has(lower)) continue;
    // short latin tokens such as "R" or "Go" would be too noisy
    if (/^[a-z0-9]{1,2}$/i.test(b)) continue;
    add({ term: b, variants: [lower] }, "bank");
  }

  // frequent leftover terms
  const freqs: KeywordHit[] = [];
  for (const { term, count } of englishFreq(jdLower)) {
    if (seenVariant.has(term)) continue;
    // skip fragments of already matched multi-word keywords (e.g. "design" from "design system")
    if (hits.some((h) => h.variants.some((v) => v.includes(term) && v !== term))) continue;
    freqs.push({ term, variants: [term], count, kind: "freq", covered: countTerm(resumeLower, term) > 0 });
  }
  for (const { term, count } of chineseGrams(text)) {
    if (hits.some((h) => h.variants.some((v) => v.includes(term) || term.includes(v)))) continue;
    freqs.push({ term, variants: [term], count, kind: "freq", covered: resumeLower.includes(term) });
  }
  freqs.sort((a, b) => b.count - a.count);
  hits.push(...freqs.slice(0, 14));

  hits.sort((a, b) => b.count - a.count || (a.kind === "freq" ? 1 : 0) - (b.kind === "freq" ? 1 : 0));
  const keywords = hits.slice(0, MAX_KEYWORDS);
  const covered = keywords.filter((k) => k.covered);
  const missing = keywords.filter((k) => !k.covered);
  return {
    hasJD: true,
    keywords,
    covered,
    missing,
    coverage: keywords.length ? covered.length / keywords.length : null,
  };
}

/** How many JD keywords does this piece of text hit? */
export function scoreText(text: string, keywords: KeywordHit[]): { score: number; matched: string[] } {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  let score = 0;
  for (const k of keywords) {
    if (termCount(lower, k) > 0) {
      matched.push(k.term);
      score += Math.min(3, k.count);
    }
  }
  return { score, matched };
}

/* ---------------- Suggestions from the master bank ---------------- */

export type Suggestion =
  | { type: "bullet"; keyword: string; expId: string; bulletId: string; label: string; text: string; expActive: boolean }
  | { type: "project"; keyword: string; projId: string; label: string; text: string }
  | { type: "skill"; keyword: string; groupId: string; item: string; label: string }
  | { type: "none"; keyword: string };

export function buildSuggestions(missing: KeywordHit[], master: Master, v: Version): Suggestion[] {
  const out: Suggestion[] = [];
  for (const k of missing) {
    let found = false;
    for (const g of master.skillGroups) {
      const sel = new Set(v.skillSel[g.id] ?? []);
      for (const item of g.items) {
        if (!sel.has(item) && termCount(item.toLowerCase(), k) > 0) {
          out.push({ type: "skill", keyword: k.term, groupId: g.id, item, label: `技能：${g.category} › ${item}` });
          found = true;
        }
      }
    }
    for (const e of master.experiences) {
      const expActive = v.expIds.includes(e.id);
      const sel = new Set(v.bulletSel[e.id] ?? []);
      for (const b of e.bullets) {
        const active = expActive && sel.has(b.id);
        if (active) continue;
        if (termCount(b.text.toLowerCase(), k) > 0) {
          out.push({
            type: "bullet",
            keyword: k.term,
            expId: e.id,
            bulletId: b.id,
            label: `${e.company || "（未命名公司）"} · ${e.role}`,
            text: b.text,
            expActive,
          });
          found = true;
        }
      }
    }
    for (const p of master.projects) {
      if (v.projIds.includes(p.id)) continue;
      const hay = [p.name, p.summary, p.results, p.tags.join(" "), p.role].join(" ").toLowerCase();
      if (termCount(hay, k) > 0) {
        out.push({ type: "project", keyword: k.term, projId: p.id, label: `項目：${p.name}`, text: p.summary });
        found = true;
      }
    }
    if (!found) out.push({ type: "none", keyword: k.term });
  }
  return out;
}
