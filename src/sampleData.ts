import type { AppData, Master, Version } from "./types";
import { cloneVersion, versionFromMaster } from "./lib/versions";

const b = (id: string, text: string) => ({ id, text });

export function buildSampleMaster(): Master {
  return {
    profile: {
      name: "陳大文 Chan Tai Man",
      title: "Senior Frontend Engineer 高級前端工程師",
      email: "taiman.chan@example.com",
      phone: "+852 9123 4567",
      location: "香港 Hong Kong",
      linkedin: "linkedin.com/in/taiman-chan",
      github: "github.com/taiman-chan",
      portfolio: "taiman.dev",
      summary:
        "擁有 8 年 Web 產品開發經驗，專注 React / TypeScript 與設計系統，曾於金融科技及數碼代理公司帶領前端團隊。熟悉 B2B 產品從 0 到 1 及效能優化，亦具備產品分析與跨部門協作背景。",
    },
    experiences: [
      {
        id: "e1",
        company: "Nova Fintech Ltd. 新星金融科技",
        role: "Senior Frontend Engineer",
        start: "2022-03",
        end: "現在 Present",
        location: "香港 Hong Kong",
        tags: ["Frontend", "React", "B2B", "Management"],
        bullets: [
          b("e1b1", "主導企業客戶 B2B 交易後台以 React + TypeScript 重構，首屏載入時間由 4.2s 降至 1.6s（-62%），客戶投訴減少 35%。"),
          b("e1b2", "Built a reusable design system with Storybook (60+ components) adopted by 5 product squads, cutting UI delivery time by 30%."),
          b("e1b3", "建立 CI/CD 管線（GitHub Actions + Docker），部署頻率由每週 1 次提升至每日多次，回滾時間 < 5 分鐘。"),
          b("e1b4", "帶領 4 人前端小組，推行 code review 與 mentoring，新人上手時間縮短 40%。"),
          b("e1b5", "與產品、設計及後端跨部門協作，以 Agile / Scrum 管理雙週迭代，準時交付率達 95%。"),
          b("e1b6", "導入 Jest + Playwright 自動化測試，核心流程測試覆蓋率提升至 85%，上線後嚴重缺陷下降 50%。"),
          b("e1b7", "推動 Web Accessibility（WCAG 2.1 AA）改善，通過第三方審核並取得銀行客戶合規認可。"),
        ],
      },
      {
        id: "e2",
        company: "Bluewave Digital Agency 藍浪數碼",
        role: "Frontend Developer",
        start: "2019-07",
        end: "2022-02",
        location: "香港 Hong Kong",
        tags: ["Frontend", "Vue", "Agency", "E-commerce"],
        bullets: [
          b("e2b1", "為零售及餐飲客戶開發 12 個品牌網站與電商平台（Vue / Nuxt），平均 Lighthouse Performance 分數 90+。"),
          b("e2b2", "設計並維護內部 UI component library，將新專案啟動時間由 2 週縮短至 3 日。"),
          b("e2b3", "與設計師以 Figma 協作，落實 responsive 與多語系（繁中 / 簡中 / English）介面。"),
          b("e2b4", "串接 REST API 與第三方支付（Stripe、PayMe），處理金額精度、特殊符號與多幣種顯示問題。"),
          b("e2b5", "指導 2 名實習生完成首個上線項目，並建立入職文件與 coding guideline。"),
        ],
      },
      {
        id: "e3",
        company: "Harbor Retail Group 海港零售集團",
        role: "Associate Product Manager 助理產品經理",
        start: "2017-09",
        end: "2019-06",
        location: "香港 Hong Kong",
        tags: ["Product", "Data", "Management", "B2C"],
        bullets: [
          b("e3b1", "負責會員 App 產品路線圖（Roadmap），訪談 40+ 位用戶並整理需求，推動 3 項核心功能上線。"),
          b("e3b2", "使用 SQL 及 Tableau 進行數據分析，找出結帳流失關鍵步驟，轉化率提升 18%。"),
          b("e3b3", "規劃並執行 A/B Testing 12 次，其中 7 次成為正式版本，月活躍用戶增長 22%。"),
          b("e3b4", "撰寫 PRD 與 user story，協調工程、設計及營運等 stakeholders，專案按時交付。"),
        ],
      },
    ],
    projects: [
      {
        id: "p1",
        name: "OpenChart — 開源圖表儀表板",
        role: "Maintainer",
        period: "2023 – 現在",
        tags: ["Frontend", "Data Viz", "Open Source", "React"],
        summary: "以 React + TypeScript + D3 製作的輕量圖表元件庫，支援深色模式、鍵盤操作及大量資料虛擬化渲染。",
        results: "GitHub 1.2k stars；npm 月下載 8k+；10 位外部貢獻者。",
        link: "github.com/taiman-chan/openchart",
        linkNote: "含線上 Demo 與 Storybook",
      },
      {
        id: "p2",
        name: "A11y Lens 無障礙檢查工具",
        role: "Creator",
        period: "2024",
        tags: ["Frontend", "Accessibility", "Chrome Extension", "TypeScript"],
        summary: "Chrome 擴充功能，即時偵測頁面對比度、ARIA 與鍵盤焦點問題，並產生可分享的修正清單。全部本地運行。",
        results: "Chrome Web Store 2,000+ 用戶，評分 4.7/5。",
        link: "a11ylens.example.com",
        linkNote: "Chrome Web Store 上架",
      },
      {
        id: "p3",
        name: "Realtime Whiteboard 即時協作白板",
        role: "Full-stack Developer",
        period: "2022",
        tags: ["Frontend", "Realtime", "Node.js", "WebSocket"],
        summary: "以 WebSocket + CRDT 實現多人即時白板，支援離線編輯與衝突自動合併。",
        results: "支援 50 人同時編輯，平均同步延遲 < 120ms。",
        link: "",
        linkNote: "內部示範，可提供錄影",
      },
      {
        id: "p4",
        name: "海港會員 App 產品重設計",
        role: "Product Owner",
        period: "2018 – 2019",
        tags: ["Product", "UX", "Data", "B2C"],
        summary: "重新設計會員積分與優惠券流程，整合用戶訪談與漏斗分析，建立 OKR 與指標儀表板。",
        results: "會員留存率 +15%，客服來電量 -20%。",
        link: "",
        linkNote: "Case study 簡報（PDF）",
      },
    ],
    skillGroups: [
      { id: "s1", category: "Frontend", items: ["React", "TypeScript", "JavaScript", "Vue", "Next.js", "HTML/CSS", "Tailwind CSS", "Vite", "Webpack", "Redux"] },
      { id: "s2", category: "Backend & Cloud", items: ["Node.js", "GraphQL", "REST API", "PostgreSQL", "Docker", "AWS", "CI/CD"] },
      { id: "s3", category: "Testing & Quality", items: ["Jest", "Playwright", "Cypress", "Storybook", "Accessibility", "Code Review"] },
      { id: "s4", category: "Product & Data", items: ["SQL", "A/B Testing", "Roadmap", "Figma", "Jira", "數據分析", "用戶訪談", "PRD"] },
      { id: "s5", category: "Management & Soft Skills", items: ["團隊管理", "Mentoring", "Agile", "Scrum", "跨部門協作", "溝通"] },
      { id: "s6", category: "Languages 語言", items: ["廣東話（母語）", "English (Fluent)", "普通話（流利）"] },
    ],
    education: [
      {
        id: "d1",
        kind: "education",
        school: "香港科技大學 HKUST",
        degree: "BEng Computer Science 計算機科學學士",
        period: "2013 – 2017",
        note: "Second Class Honours (Upper Division)",
      },
      {
        id: "d2",
        kind: "certification",
        school: "Amazon Web Services",
        degree: "AWS Certified Developer – Associate",
        period: "2023",
        note: "",
      },
      {
        id: "d3",
        kind: "certification",
        school: "Scrum.org",
        degree: "Professional Scrum Master I (PSM I)",
        period: "2022",
        note: "",
      },
      {
        id: "d4",
        kind: "certification",
        school: "Google / Coursera",
        degree: "Google UX Design Professional Certificate",
        period: "2021",
        note: "",
      },
    ],
    coverBlocks: [
      {
        id: "c1",
        kind: "opening",
        title: "開場：產品使命共鳴",
        text: "我是 {{name}}，現為 {{title}}。看到 {{company}} 正在招聘 {{role}}，我對貴司以產品驅動成長的方向深感共鳴，亦希望以過去 8 年的經驗為團隊帶來具體貢獻。",
      },
      {
        id: "c2",
        kind: "opening",
        title: "開場：簡短直接（English）",
        text: "Dear {{manager}}, I am writing to apply for the {{role}} position at {{company}}. With 8 years of experience shipping B2B web products, I am excited about the chance to contribute to your team.",
      },
      {
        id: "c3",
        kind: "strengths",
        title: "優勢：前端效能與設計系統",
        text: "在 Nova Fintech，我主導交易後台以 React 與 TypeScript 重構，把首屏載入時間降低 62%，並建立服務 5 個產品小組的設計系統。我相信這些經驗能直接協助 {{company}} 提升產品體驗與開發效率。",
      },
      {
        id: "c4",
        kind: "strengths",
        title: "優勢：領導與跨部門協作",
        text: "我曾帶領 4 人前端小組，並與產品、設計及後端緊密合作，以 Agile 方式穩定交付。我重視清晰溝通與數據驅動決策，亦享受培養新人。",
      },
      {
        id: "c5",
        kind: "fit",
        title: "契合度：產品與數據背景",
        text: "我早年曾擔任產品經理助理，熟悉用戶訪談、A/B Testing 與 SQL 數據分析，所以能站在用戶及商業角度思考 {{role}} 的每個決定，與 {{company}} 的團隊溝通會更順暢。",
      },
      {
        id: "c6",
        kind: "closing",
        title: "結尾：期待面談",
        text: "感謝您抽空閱讀我的申請。我很期待有機會進一步介紹自己，並了解 {{company}} 對 {{role}} 的期望。如需作品或參考資料，我樂意隨時提供。",
      },
    ],
  };
}

const JD_FRONTEND = `Senior Frontend Engineer (Aurora Cloud 極光雲端)

About the role
We are looking for a Senior Frontend Engineer to build our B2B analytics platform. You will own the frontend architecture, collaborate with product and design, and mentor junior engineers.

Responsibilities
- Build and maintain high-performance web apps using React and TypeScript
- Own and evolve our design system and component library (Storybook)
- Improve web performance and accessibility (WCAG)
- Write automated tests (Jest, Playwright) and set up CI/CD pipelines
- Work with GraphQL / REST API and Node.js backend teams
- Lead code review, mentor teammates, and communicate with stakeholders

Requirements
- 5+ years of frontend experience, strong React and TypeScript
- Experience with data visualization is a plus
- Familiar with Docker and AWS
- Agile / Scrum experience; cross-functional collaboration
- Fluent English and Cantonese

職責補充：負責前端架構及效能優化，推動設計系統及無障礙，並與跨部門團隊協作。`;

const JD_PM = `產品經理 Product Manager（海灣零售科技 B2C）

我們正在尋找一位產品經理，負責會員及電商產品的路線圖規劃。

工作內容：
- 負責產品 Roadmap，撰寫 PRD，與工程、設計及營運等 stakeholders 協作
- 透過用戶訪談及數據分析（SQL、Tableau）找出增長機會
- 規劃及執行 A/B Testing，追蹤 KPI 及 OKR
- 以 Agile / Scrum 方式管理迭代，具備良好溝通及跨部門協作能力

要求：
- 3 年以上產品或數據相關經驗，熟悉 Figma、Jira
- 有電商或 B2C 經驗優先，具備數據驅動思維
- 良好英文及廣東話溝通能力`;

export function buildSampleData(): AppData {
  const master = buildSampleMaster();

  // Version A — frontend, applied
  const A: Version = versionFromMaster(master, "2026-前端工程師-A公司");
  A.id = "v_sample_a";
  A.status = "applied";
  A.note = "投遞日期 2026-01-12；內部推薦人：Kelly。強調 design system、效能及無障礙。";
  A.jd = JD_FRONTEND;
  A.expIds = ["e1", "e2"];
  A.bulletSel = {
    e1: ["e1b1", "e1b2", "e1b7", "e1b6", "e1b3", "e1b4"],
    e2: ["e2b1", "e2b2", "e2b3"],
  };
  A.projIds = ["p1", "p2"];
  A.skillSel = {
    s1: ["React", "TypeScript", "JavaScript", "Vue", "HTML/CSS", "Tailwind CSS", "Vite"],
    s2: ["Node.js", "GraphQL", "REST API", "Docker"],
    s3: ["Jest", "Playwright", "Storybook", "Accessibility", "Code Review"],
    s6: ["廣東話（母語）", "English (Fluent)", "普通話（流利）"],
  };
  A.eduIds = ["d1", "d3"];
  A.overrides = {
    title: "Senior Frontend Engineer｜React · TypeScript · Design System",
    summary:
      "8 年 Web 產品開發經驗，專注 React / TypeScript、設計系統與前端效能。曾將 B2B 交易後台首屏載入時間降低 62%，並建立服務 5 個產品小組的 component library。",
    bulletText: {
      e1b2: "Built and maintained a Storybook-based design system (60+ components) used by 5 product squads; cut UI delivery time by 30% and improved accessibility consistency.",
    },
    projectSummary: {},
  };
  A.layout = { ...A.layout, columns: 1, headings: "en", fontSize: 10, margin: 14 };
  A.cover = {
    ...A.cover,
    company: "Aurora Cloud 極光雲端",
    role: "Senior Frontend Engineer",
    manager: "Hiring Manager",
    blockIds: ["c1", "c3", "c4", "c6"],
    overrides: {},
  };

  // Version B — product manager, interview
  const B: Version = versionFromMaster(master, "2026-產品經理-B公司");
  B.id = "v_sample_b";
  B.status = "interview";
  B.note = "已通過 HR 電話面試；下週二與產品總監二面。需準備 A/B Testing 案例。";
  B.jd = JD_PM;
  B.expIds = ["e3", "e1"];
  B.bulletSel = {
    e3: ["e3b1", "e3b2", "e3b3", "e3b4"],
    e1: ["e1b5", "e1b4", "e1b1"],
  };
  B.projIds = ["p4", "p1"];
  B.skillSel = {
    s4: ["SQL", "A/B Testing", "Roadmap", "Figma", "Jira", "數據分析", "用戶訪談", "PRD"],
    s5: ["團隊管理", "Agile", "Scrum", "跨部門協作", "溝通"],
    s6: ["廣東話（母語）", "English (Fluent)", "普通話（流利）"],
  };
  B.eduIds = ["d1", "d3", "d4"];
  B.overrides = {
    title: "Product Manager 產品經理",
    summary:
      "具備產品、數據與工程三重背景的產品經理。熟悉用戶研究、A/B Testing 與 SQL 數據分析，曾推動會員留存率 +15%，並能與工程團隊深入協作。",
    bulletText: {
      e1b1: "與工程及設計團隊主導 B2B 交易後台重構，將首屏載入時間由 4.2s 降至 1.6s，客戶投訴減少 35%。",
    },
    projectSummary: {},
  };
  B.layout = { ...B.layout, columns: 2, headings: "zh", fontSize: 10, margin: 12 };
  B.cover = {
    ...B.cover,
    company: "海灣零售科技",
    role: "產品經理",
    manager: "李小姐",
    blockIds: ["c1", "c5", "c4", "c6"],
    overrides: {},
  };

  // Version C — a duplicate of A, tweaked for another company
  const C = cloneVersion(A, "2026-前端組長-C公司（複製自 A）");
  C.id = "v_sample_c";
  C.status = "draft";
  C.note = "由 A 公司版本複製；著重帶領團隊及 Management 經驗。";
  C.expIds = ["e1", "e2", "e3"];
  C.bulletSel = {
    e1: ["e1b4", "e1b5", "e1b1", "e1b2", "e1b3"],
    e2: ["e2b1", "e2b5"],
    e3: ["e3b4"],
  };
  C.projIds = ["p1"];
  C.overrides = {
    ...C.overrides,
    title: "Frontend Lead 前端組長",
    summary:
      "8 年 Web 開發經驗，其中 3 年帶領 4 人前端團隊。擅長建立工程規範、培養新人及與產品、設計跨部門協作。",
  };
  C.skillSel = { ...C.skillSel, s5: ["團隊管理", "Mentoring", "Agile", "Scrum", "跨部門協作"] };
  C.cover = {
    ...C.cover,
    company: "Lumina Labs",
    role: "Frontend Lead",
    manager: "",
    blockIds: ["c2", "c4", "c3", "c6"],
  };

  return { schema: 1, isSample: true, master, versions: [A, B, C], activeId: A.id };
}
