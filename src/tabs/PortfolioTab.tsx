import { useMemo, useState } from "react";
import { useStore } from "../store";
import { Btn, Check, EmptyState, SectionTitle } from "../components/ui";
import { Segmented } from "../components/controls";
import { PaperPreview, PortfolioDocument, PrintPortal } from "../components/documents";
import { allProjectTags, filterProjects, portfolioToJSON, portfolioToMarkdown } from "../lib/portfolio";
import { downloadText, printWithTitle, safeFilename } from "../lib/util";
import { cn } from "../utils/cn";

export default function PortfolioTab() {
  const { master, version: v } = useStore();
  const [tags, setTags] = useState<string[]>([]);
  const [mode, setMode] = useState<"any" | "all">("any");
  const [onlyActive, setOnlyActive] = useState(false);

  const pool = useMemo(
    () => (onlyActive ? master.projects.filter((p) => v.projIds.includes(p.id)) : master.projects),
    [master.projects, onlyActive, v.projIds],
  );
  const tagList = useMemo(() => allProjectTags(pool), [pool]);
  const activeTags = tags.filter((t) => tagList.some((x) => x.tag === t));
  const filtered = useMemo(() => filterProjects(pool, activeTags, mode), [pool, activeTags, mode]);
  const owner = master.profile.name.trim();
  const base = safeFilename(`Portfolio_${owner || "me"}${activeTags.length ? "_" + activeTags.join("-") : ""}`);

  const toggle = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  return (
    <div className="space-y-4">
      <SectionTitle
        title="作品集清單"
        desc="按標籤篩選項目，匯出作品集重點摘要。"
        actions={
          <>
            <Btn variant="primary" size="sm" onClick={() => printWithTitle(base)} disabled={!filtered.length}>
              🖨 列印／PDF
            </Btn>
            <Btn size="sm" disabled={!filtered.length} onClick={() => downloadText(`${base}.md`, portfolioToMarkdown(owner, filtered, activeTags), "text/markdown")}>
              匯出 .md
            </Btn>
            <Btn size="sm" disabled={!filtered.length} onClick={() => downloadText(`${base}.json`, portfolioToJSON(owner, filtered, activeTags), "application/json")}>
              匯出 .json
            </Btn>
          </>
        }
      />
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Check checked={onlyActive} onChange={setOnlyActive} label={`只看目前版本已啟用的項目（${v.projIds.length}）`} />
          <div className="w-48">
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "any", label: "符合任一標籤" },
                { value: "all", label: "同時符合" },
              ]}
            />
          </div>
        </div>
        {tagList.length === 0 ? (
          <p className="text-sm text-slate-400">沒有可用標籤。</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTags([])}
              className={cn("rounded-full border px-3 py-1 text-xs", activeTags.length === 0 ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}
            >
              全部 {pool.length}
            </button>
            {tagList.map(({ tag, count }) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  activeTags.includes(tag) ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50",
                )}
              >
                {tag} <span className="opacity-60">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState>沒有符合條件的項目。</EmptyState>
      ) : (
        <div className="rounded-xl bg-slate-200/70 p-3 sm:p-5">
          <PaperPreview layout={v.layout}>
            <PortfolioDocument owner={owner} projects={filtered} tags={activeTags} layout={v.layout} />
          </PaperPreview>
        </div>
      )}

      <PrintPortal layout={v.layout}>
        <PortfolioDocument owner={owner} projects={filtered} tags={activeTags} layout={v.layout} />
      </PrintPortal>
    </div>
  );
}
