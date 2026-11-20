import { useStore } from "../store";
import { STATUS_LABEL, type TabKey } from "../types";
import { formatTime } from "../lib/util";
import { cn } from "../utils/cn";
import { Select } from "./ui";

const TABS: { key: TabKey; label: string; group?: string }[] = [
  { key: "versions", label: "版本管理" },
  { key: "master", label: "母版資料庫" },
  { key: "compose", label: "版本內容" },
  { key: "tailor", label: "JD 比對" },
  { key: "resume", label: "履歷排版匯出" },
  { key: "cover", label: "求職信" },
  { key: "portfolio", label: "作品集" },
  { key: "diff", label: "差異對比" },
  { key: "data", label: "資料與備份" },
];

export default function Header() {
  const { data, master, counts, analysis, savedAt, pending, saveError, tab, setTab, setActive } = useStore();
  const pct = analysis.coverage === null ? null : Math.round(analysis.coverage * 100);

  return (
    <header className="no-print z-30 border-b border-slate-200 bg-white lg:sticky lg:top-0">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">R</div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900">履歷調校器</div>
            <div className="text-[10px] text-slate-500">Resume · Cover Letter · Portfolio Tailorer</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-slate-500 sm:inline">目前版本</span>
          <Select className="!w-64 max-w-full !py-1.5 font-medium" value={data.activeId} onChange={(e) => setActive(e.target.value)} aria-label="切換版本">
            {data.versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name || "（未命名）"}［{STATUS_LABEL[v.status]}］
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <Stat label="經驗" value={`${counts.experiences}/${master.experiences.length}`} />
          <Stat label="Bullet" value={counts.bullets} />
          <Stat label="項目" value={`${counts.projects}/${master.projects.length}`} />
          <Stat label="技能" value={`${counts.skillGroups} 組 ${counts.skillItems} 項`} />
          <Stat
            label="JD 覆蓋"
            value={pct === null ? "未貼 JD" : `${pct}%`}
            tone={pct === null ? undefined : pct >= 70 ? "g" : pct >= 40 ? "a" : "r"}
            onClick={() => setTab("tailor")}
          />
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className="hidden rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-700 md:inline">🔒 資料只存於本機</span>
          {saveError ? (
            <button className="rounded-md bg-rose-50 px-2 py-1 font-medium text-rose-700" onClick={() => setTab("data")} title={saveError}>
              ⚠ 儲存失敗
            </button>
          ) : (
            <span className="text-slate-500" title={formatTime(savedAt)}>
              {pending ? "儲存中…" : savedAt ? `已儲存 ${formatTime(savedAt).slice(11)}` : "尚未儲存"}
            </span>
          )}
        </div>
      </div>
      <nav className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-3 thin-scroll" aria-label="主要功能">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "shrink-0 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
              tab === t.key ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-900",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

function Stat({ label, value, tone, onClick }: { label: string; value: string | number; tone?: "g" | "a" | "r"; onClick?: () => void }) {
  const cls = cn(
    "inline-flex items-center gap-1 rounded-md px-2 py-1",
    tone === "g" ? "bg-emerald-50 text-emerald-800" : tone === "a" ? "bg-amber-50 text-amber-800" : tone === "r" ? "bg-rose-50 text-rose-800" : "bg-slate-100 text-slate-700",
    onClick && "cursor-pointer hover:brightness-95",
  );
  const inner = (
    <>
      <span className="opacity-70">{label}</span>
      <b>{value}</b>
    </>
  );
  return onClick ? (
    <button type="button" className={cls} onClick={onClick}>
      {inner}
    </button>
  ) : (
    <span className={cls}>{inner}</span>
  );
}
