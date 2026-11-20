import { useState } from "react";
import { useStore } from "../store";
import { useFeedback } from "../components/feedback";
import { ItemCard } from "../components/ItemCard";
import { Badge, Btn, EmptyState, Field, IconBtn, SectionTitle, Select, TagInput, TextArea, TextInput } from "../components/ui";
import { COVER_KIND_LABEL, CONTACT_KEYS, CONTACT_LABEL, type CoverKind } from "../types";
import { moveItem, uid } from "../lib/util";
import { cn } from "../utils/cn";

type Sub = "profile" | "exp" | "proj" | "skills" | "edu" | "cover";

const SUBS: { key: Sub; label: string }[] = [
  { key: "profile", label: "基本資料" },
  { key: "exp", label: "工作經驗" },
  { key: "proj", label: "項目／作品集" },
  { key: "skills", label: "技能" },
  { key: "edu", label: "學歷／證書" },
  { key: "cover", label: "求職信段落庫" },
];

export default function MasterTab() {
  const [sub, setSub] = useState<Sub>("profile");
  const { master } = useStore();
  const count: Record<Sub, number | null> = {
    profile: null,
    exp: master.experiences.length,
    proj: master.projects.length,
    skills: master.skillGroups.length,
    edu: master.education.length,
    cover: master.coverBlocks.length,
  };
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-900">
        <b>母版素材庫</b>：在這裡集中維護所有可重用內容。各求職版本只會「引用」這些素材（勾選／排序／局部覆寫），修改版本不會影響母版；但修改母版文字會同步到所有未覆寫該段的版本。
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SUBS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSub(s.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              sub === s.key ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
            )}
          >
            {s.label}
            {count[s.key] !== null && <span className="ml-1.5 text-xs opacity-60">{count[s.key]}</span>}
          </button>
        ))}
      </div>
      {sub === "profile" && <ProfilePanel />}
      {sub === "exp" && <ExperiencePanel />}
      {sub === "proj" && <ProjectPanel />}
      {sub === "skills" && <SkillPanel />}
      {sub === "edu" && <EducationPanel />}
      {sub === "cover" && <CoverPanel />}
    </div>
  );
}

/* ---------------------------- Profile ---------------------------- */

function ProfilePanel() {
  const { master, mutateMaster } = useStore();
  const p = master.profile;
  const set = (k: keyof typeof p, v: string) => mutateMaster((m) => void (m.profile[k] = v));
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <SectionTitle title="個人基本資料" desc="各版本可獨立選擇顯示哪些聯絡方式（在「版本內容」設定）。" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="姓名">
          <TextInput value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="例：陳大文 Chan Tai Man" />
        </Field>
        <Field label="職銜（預設）">
          <TextInput value={p.title} onChange={(e) => set("title", e.target.value)} placeholder="例：Senior Frontend Engineer" />
        </Field>
        {CONTACT_KEYS.map((k) => (
          <Field key={k} label={CONTACT_LABEL[k]}>
            <TextInput
              value={p[k]}
              onChange={(e) => set(k, e.target.value)}
              placeholder={k === "email" ? "name@example.com" : k === "phone" ? "+852 ..." : k === "location" ? "香港 Hong Kong" : "https://"}
            />
          </Field>
        ))}
      </div>
      <Field label="個人簡介（預設）" hint={`${p.summary.length} 字`}>
        <TextArea rows={5} value={p.summary} onChange={(e) => set("summary", e.target.value)} placeholder="2–4 句總結你的年資、強項與代表成就。" />
      </Field>
    </div>
  );
}

/* ---------------------------- Experience ---------------------------- */

function ExperiencePanel() {
  const { master, mutateMaster } = useStore();
  const { confirm } = useFeedback();
  const [openId, setOpenId] = useState<string | null>(null);

  const add = () => {
    const id = uid("exp");
    mutateMaster((m) =>
      m.experiences.unshift({
        id,
        company: "",
        role: "",
        start: "",
        end: "",
        location: "",
        tags: [],
        bullets: [{ id: uid("b"), text: "" }],
      }),
    );
    setOpenId(id);
  };

  return (
    <div className="space-y-3">
      <SectionTitle
        title="工作經驗"
        desc="每條 Bullet 可獨立勾選或微調。標籤方便按崗位篩選。"
        actions={<Btn variant="primary" size="sm" onClick={add}>＋ 新增經驗</Btn>}
      />
      {master.experiences.length === 0 && <EmptyState>尚未有工作經驗，按「新增經驗」開始。</EmptyState>}
      {master.experiences.map((e, i) => (
        <ItemCard
          key={e.id}
          defaultOpen={e.id === openId}
          title={`${e.role || "（未填職位）"} · ${e.company || "（未填公司）"}`}
          subtitle={[e.start, e.end].filter(Boolean).join(" – ") || "未填時間"}
          badges={<Badge tone="slate">{e.bullets.length} bullets</Badge>}
          onUp={i > 0 ? () => mutateMaster((m) => void (m.experiences = moveItem(m.experiences, i, -1))) : undefined}
          onDown={i < master.experiences.length - 1 ? () => mutateMaster((m) => void (m.experiences = moveItem(m.experiences, i, 1))) : undefined}
          onDuplicate={() =>
            mutateMaster((m) => {
              const c = structuredClone(m.experiences[i]);
              c.id = uid("exp");
              c.bullets.forEach((b) => (b.id = uid("b")));
              c.role = c.role ? `${c.role}（複本）` : c.role;
              m.experiences.splice(i + 1, 0, c);
            })
          }
          onDelete={async () => {
            if (await confirm({ title: "刪除此工作經驗？", message: "母版中的這段經驗及其所有 Bullet 會被刪除，各版本將不再顯示。", confirmText: "刪除", danger: true }))
              mutateMaster((m) => void (m.experiences = m.experiences.filter((x) => x.id !== e.id)));
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="公司">
              <TextInput value={e.company} onChange={(ev) => mutateMaster((m) => void (m.experiences[i].company = ev.target.value))} />
            </Field>
            <Field label="職位">
              <TextInput value={e.role} onChange={(ev) => mutateMaster((m) => void (m.experiences[i].role = ev.target.value))} />
            </Field>
            <Field label="開始時間">
              <TextInput value={e.start} placeholder="2022-03" onChange={(ev) => mutateMaster((m) => void (m.experiences[i].start = ev.target.value))} />
            </Field>
            <Field label="結束時間">
              <TextInput value={e.end} placeholder="現在 Present" onChange={(ev) => mutateMaster((m) => void (m.experiences[i].end = ev.target.value))} />
            </Field>
            <Field label="地點">
              <TextInput value={e.location} onChange={(ev) => mutateMaster((m) => void (m.experiences[i].location = ev.target.value))} />
            </Field>
            <Field label="標籤（Frontend、Management、B2B…）">
              <TagInput tags={e.tags} onChange={(t) => mutateMaster((m) => void (m.experiences[i].tags = t))} />
            </Field>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Bullet Points（母版措辭）</span>
              <Btn
                size="sm"
                variant="soft"
                onClick={() => mutateMaster((m) => void m.experiences[i].bullets.push({ id: uid("b"), text: "" }))}
              >
                ＋ 新增 Bullet
              </Btn>
            </div>
            <div className="space-y-2">
              {e.bullets.map((b, bi) => (
                <div key={b.id} className="flex items-start gap-1">
                  <span className="mt-2 w-5 shrink-0 text-center text-xs text-slate-400">{bi + 1}</span>
                  <TextArea
                    rows={2}
                    value={b.text}
                    placeholder="動詞開頭 + 做了什麼 + 成果數據"
                    onChange={(ev) => mutateMaster((m) => void (m.experiences[i].bullets[bi].text = ev.target.value))}
                  />
                  <div className="flex flex-col">
                    <IconBtn title="上移" disabled={bi === 0} onClick={() => mutateMaster((m) => void (m.experiences[i].bullets = moveItem(m.experiences[i].bullets, bi, -1)))}>
                      ↑
                    </IconBtn>
                    <IconBtn
                      title="下移"
                      disabled={bi === e.bullets.length - 1}
                      onClick={() => mutateMaster((m) => void (m.experiences[i].bullets = moveItem(m.experiences[i].bullets, bi, 1)))}
                    >
                      ↓
                    </IconBtn>
                  </div>
                  <IconBtn title="刪除此 Bullet" danger onClick={() => mutateMaster((m) => void m.experiences[i].bullets.splice(bi, 1))}>
                    ✕
                  </IconBtn>
                </div>
              ))}
            </div>
          </div>
        </ItemCard>
      ))}
    </div>
  );
}

/* ---------------------------- Projects ---------------------------- */

function ProjectPanel() {
  const { master, mutateMaster } = useStore();
  const { confirm } = useFeedback();
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <SectionTitle
        title="項目／作品集"
        desc="項目可按標籤篩選，並匯出為作品集摘要。"
        actions={
          <Btn
            variant="primary"
            size="sm"
            onClick={() => {
              const id = uid("proj");
              mutateMaster((m) => void m.projects.unshift({ id, name: "", role: "", period: "", tags: [], summary: "", results: "", link: "", linkNote: "" }));
              setOpenId(id);
            }}
          >
            ＋ 新增項目
          </Btn>
        }
      />
      {master.projects.length === 0 && <EmptyState>尚未有項目。</EmptyState>}
      {master.projects.map((p, i) => (
        <ItemCard
          key={p.id}
          defaultOpen={p.id === openId}
          title={p.name || "（未命名項目）"}
          subtitle={[p.role, p.period].filter(Boolean).join(" · ") || "未填角色／時間"}
          badges={p.tags.slice(0, 3).map((t) => (
            <Badge key={t} tone="indigo">
              {t}
            </Badge>
          ))}
          onUp={i > 0 ? () => mutateMaster((m) => void (m.projects = moveItem(m.projects, i, -1))) : undefined}
          onDown={i < master.projects.length - 1 ? () => mutateMaster((m) => void (m.projects = moveItem(m.projects, i, 1))) : undefined}
          onDuplicate={() =>
            mutateMaster((m) => {
              const c = structuredClone(m.projects[i]);
              c.id = uid("proj");
              c.name = c.name ? `${c.name}（複本）` : c.name;
              m.projects.splice(i + 1, 0, c);
            })
          }
          onDelete={async () => {
            if (await confirm({ title: "刪除此項目？", confirmText: "刪除", danger: true }))
              mutateMaster((m) => void (m.projects = m.projects.filter((x) => x.id !== p.id)));
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="項目名稱">
              <TextInput value={p.name} onChange={(e) => mutateMaster((m) => void (m.projects[i].name = e.target.value))} />
            </Field>
            <Field label="角色">
              <TextInput value={p.role} onChange={(e) => mutateMaster((m) => void (m.projects[i].role = e.target.value))} />
            </Field>
            <Field label="時間">
              <TextInput value={p.period} onChange={(e) => mutateMaster((m) => void (m.projects[i].period = e.target.value))} />
            </Field>
            <Field label="技術／能力標籤">
              <TagInput tags={p.tags} onChange={(t) => mutateMaster((m) => void (m.projects[i].tags = t))} />
            </Field>
            <Field label="連結" className="sm:col-span-1">
              <TextInput value={p.link} placeholder="https://" onChange={(e) => mutateMaster((m) => void (m.projects[i].link = e.target.value))} />
            </Field>
            <Field label="展示說明（無公開連結時使用）">
              <TextInput value={p.linkNote} onChange={(e) => mutateMaster((m) => void (m.projects[i].linkNote = e.target.value))} />
            </Field>
            <Field label="摘要" className="sm:col-span-2">
              <TextArea rows={3} value={p.summary} onChange={(e) => mutateMaster((m) => void (m.projects[i].summary = e.target.value))} />
            </Field>
            <Field label="成果數據" className="sm:col-span-2">
              <TextArea rows={2} value={p.results} onChange={(e) => mutateMaster((m) => void (m.projects[i].results = e.target.value))} />
            </Field>
          </div>
        </ItemCard>
      ))}
    </div>
  );
}

/* ---------------------------- Skills ---------------------------- */

function SkillPanel() {
  const { master, mutateMaster } = useStore();
  const { confirm } = useFeedback();
  return (
    <div className="space-y-3">
      <SectionTitle
        title="技能分類"
        desc="按類別整理，方便各版本只展示與崗位相關的技能。"
        actions={
          <Btn variant="primary" size="sm" onClick={() => mutateMaster((m) => void m.skillGroups.push({ id: uid("sk"), category: "", items: [] }))}>
            ＋ 新增分類
          </Btn>
        }
      />
      {master.skillGroups.length === 0 && <EmptyState>尚未有技能分類。</EmptyState>}
      {master.skillGroups.map((g, i) => (
        <div key={g.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-1">
            <TextInput
              className="font-medium"
              value={g.category}
              placeholder="分類名稱，例：Frontend"
              onChange={(e) => mutateMaster((m) => void (m.skillGroups[i].category = e.target.value))}
            />
            <IconBtn title="上移" disabled={i === 0} onClick={() => mutateMaster((m) => void (m.skillGroups = moveItem(m.skillGroups, i, -1)))}>↑</IconBtn>
            <IconBtn title="下移" disabled={i === master.skillGroups.length - 1} onClick={() => mutateMaster((m) => void (m.skillGroups = moveItem(m.skillGroups, i, 1)))}>↓</IconBtn>
            <IconBtn
              title="刪除分類"
              danger
              onClick={async () => {
                if (await confirm({ title: `刪除分類「${g.category || "未命名"}」？`, confirmText: "刪除", danger: true }))
                  mutateMaster((m) => void (m.skillGroups = m.skillGroups.filter((x) => x.id !== g.id)));
              }}
            >
              ✕
            </IconBtn>
          </div>
          <TagInput tags={g.items} placeholder="輸入技能，按 Enter 或逗號新增" onChange={(t) => mutateMaster((m) => void (m.skillGroups[i].items = t))} />
        </div>
      ))}
    </div>
  );
}

/* ---------------------------- Education ---------------------------- */

function EducationPanel() {
  const { master, mutateMaster } = useStore();
  const { confirm } = useFeedback();
  const [openId, setOpenId] = useState<string | null>(null);
  const add = (kind: "education" | "certification") => {
    const id = uid("edu");
    mutateMaster((m) => void m.education.unshift({ id, kind, school: "", degree: "", period: "", note: "" }));
    setOpenId(id);
  };
  return (
    <div className="space-y-3">
      <SectionTitle
        title="學歷與證書"
        actions={
          <>
            <Btn size="sm" variant="primary" onClick={() => add("education")}>＋ 學歷</Btn>
            <Btn size="sm" variant="soft" onClick={() => add("certification")}>＋ 證書</Btn>
          </>
        }
      />
      {master.education.length === 0 && <EmptyState>尚未有學歷或證書。</EmptyState>}
      {master.education.map((e, i) => (
        <ItemCard
          key={e.id}
          defaultOpen={e.id === openId}
          title={e.degree || e.school || "（未命名）"}
          subtitle={[e.school, e.period].filter(Boolean).join(" · ")}
          badges={<Badge tone={e.kind === "education" ? "sky" : "green"}>{e.kind === "education" ? "學歷" : "證書"}</Badge>}
          onUp={i > 0 ? () => mutateMaster((m) => void (m.education = moveItem(m.education, i, -1))) : undefined}
          onDown={i < master.education.length - 1 ? () => mutateMaster((m) => void (m.education = moveItem(m.education, i, 1))) : undefined}
          onDelete={async () => {
            if (await confirm({ title: "刪除此項？", confirmText: "刪除", danger: true }))
              mutateMaster((m) => void (m.education = m.education.filter((x) => x.id !== e.id)));
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="類型">
              <Select value={e.kind} onChange={(ev) => mutateMaster((m) => void (m.education[i].kind = ev.target.value as "education" | "certification"))}>
                <option value="education">學歷</option>
                <option value="certification">證書</option>
              </Select>
            </Field>
            <Field label="學位／證書名稱">
              <TextInput value={e.degree} onChange={(ev) => mutateMaster((m) => void (m.education[i].degree = ev.target.value))} />
            </Field>
            <Field label="學校／頒發機構">
              <TextInput value={e.school} onChange={(ev) => mutateMaster((m) => void (m.education[i].school = ev.target.value))} />
            </Field>
            <Field label="時間">
              <TextInput value={e.period} onChange={(ev) => mutateMaster((m) => void (m.education[i].period = ev.target.value))} />
            </Field>
            <Field label="備註（榮譽、GPA…）" className="sm:col-span-2">
              <TextInput value={e.note} onChange={(ev) => mutateMaster((m) => void (m.education[i].note = ev.target.value))} />
            </Field>
          </div>
        </ItemCard>
      ))}
    </div>
  );
}

/* ---------------------------- Cover blocks ---------------------------- */

function CoverPanel() {
  const { master, mutateMaster } = useStore();
  const { confirm } = useFeedback();
  const [openId, setOpenId] = useState<string | null>(null);
  const kinds = Object.keys(COVER_KIND_LABEL) as CoverKind[];
  return (
    <div className="space-y-3">
      <SectionTitle
        title="求職信段落庫"
        desc="可用變數：{{company}} {{role}} {{manager}} {{name}} {{title}} {{date}}，生成求職信時會自動代入。"
        actions={
          <Btn
            variant="primary"
            size="sm"
            onClick={() => {
              const id = uid("cb");
              mutateMaster((m) => void m.coverBlocks.unshift({ id, kind: "opening", title: "", text: "" }));
              setOpenId(id);
            }}
          >
            ＋ 新增段落
          </Btn>
        }
      />
      {master.coverBlocks.length === 0 && <EmptyState>尚未有求職信段落。</EmptyState>}
      {master.coverBlocks.map((c, i) => (
        <ItemCard
          key={c.id}
          defaultOpen={c.id === openId}
          title={c.title || "（未命名段落）"}
          subtitle={c.text.slice(0, 60)}
          badges={<Badge tone="amber">{COVER_KIND_LABEL[c.kind]}</Badge>}
          onUp={i > 0 ? () => mutateMaster((m) => void (m.coverBlocks = moveItem(m.coverBlocks, i, -1))) : undefined}
          onDown={i < master.coverBlocks.length - 1 ? () => mutateMaster((m) => void (m.coverBlocks = moveItem(m.coverBlocks, i, 1))) : undefined}
          onDuplicate={() =>
            mutateMaster((m) => {
              const x = structuredClone(m.coverBlocks[i]);
              x.id = uid("cb");
              x.title = x.title ? `${x.title}（複本）` : x.title;
              m.coverBlocks.splice(i + 1, 0, x);
            })
          }
          onDelete={async () => {
            if (await confirm({ title: "刪除此段落？", confirmText: "刪除", danger: true }))
              mutateMaster((m) => void (m.coverBlocks = m.coverBlocks.filter((x) => x.id !== c.id)));
          }}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="類型">
              <Select value={c.kind} onChange={(e) => mutateMaster((m) => void (m.coverBlocks[i].kind = e.target.value as CoverKind))}>
                {kinds.map((k) => (
                  <option key={k} value={k}>
                    {COVER_KIND_LABEL[k]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="標題（僅供自己辨識）" className="sm:col-span-2">
              <TextInput value={c.title} onChange={(e) => mutateMaster((m) => void (m.coverBlocks[i].title = e.target.value))} />
            </Field>
            <Field label="內容" className="sm:col-span-3">
              <TextArea rows={5} value={c.text} onChange={(e) => mutateMaster((m) => void (m.coverBlocks[i].text = e.target.value))} />
            </Field>
          </div>
        </ItemCard>
      ))}
    </div>
  );
}
