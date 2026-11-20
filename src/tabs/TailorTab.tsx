import { useMemo } from "react";
import { useStore } from "../store";
import { Badge, Btn, Card, EmptyState, Field, SectionTitle, TextArea, TextInput } from "../components/ui";
import { buildSuggestions, type KeywordHit, type Suggestion } from "../lib/keywords";
import { cn } from "../utils/cn";

const KIND_LABEL = { dict: "常見技能詞", bank: "你的素材庫詞彙", freq: "JD 高頻詞" } as const;

export default function TailorTab() {
  const { version: v, master, analysis, mutateVersion, setTab } = useStore();
  const suggestions = useMemo(() => buildSuggestions(analysis.missing, master, v), [analysis.missing, master, v]);

  const grouped = useMemo(() => {
    const m = new Map<string, Suggestion[]>();
    for (const s of suggestions) m.set(s.keyword, [...(m.get(s.keyword) ?? []), s]);
    return Array.from(m.entries());
  }, [suggestions]);

  const apply = (s: Suggestion) =>
    mutateVersion((ver, m) => {
      if (s.type === "bullet") {
        if (!ver.expIds.includes(s.expId)) {
          ver.expIds.push(s.expId);
          ver.bulletSel[s.expId] = [];
        }
        const cur = ver.bulletSel[s.expId] ?? [];
        if (!cur.includes(s.bulletId)) ver.bulletSel[s.expId] = [...cur, s.bulletId];
      } else if (s.type === "project") {
        if (!ver.projIds.includes(s.projId)) ver.projIds.push(s.projId);
      } else if (s.type === "skill") {
        const g = m.skillGroups.find((x) => x.id === s.groupId);
        if (!g) return;
        const cur = ver.skillSel[s.groupId] ?? [];
        if (!cur.includes(s.item)) ver.skillSel[s.groupId] = [...cur, s.item];
      }
    });

  const pct = analysis.coverage === null ? null : Math.round(analysis.coverage * 100);
  const tone = pct === null ? "slate" : pct >= 70 ? "emerald" : pct >= 40 ? "amber" : "rose";

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="space-y-4">
        <SectionTitle title="目標職位描述（JD）" desc="全部在瀏覽器本地比對，不會上傳或經過任何 AI／API。" />
        <Card className="space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="目標公司" hint="同步到求職信變數">
              <TextInput value={v.cover.company} onChange={(e) => mutateVersion((ver) => void (ver.cover.company = e.target.value))} placeholder="例：Aurora Cloud" />
            </Field>
            <Field label="目標職位">
              <TextInput value={v.cover.role} onChange={(e) => mutateVersion((ver) => void (ver.cover.role = e.target.value))} placeholder="例：Senior Frontend Engineer" />
            </Field>
          </div>
          <Field label="貼上 JD（中英文混排皆可）" hint={`${v.jd.length} 字`}>
            <TextArea
              rows={16}
              value={v.jd}
              onChange={(e) => mutateVersion((ver) => void (ver.jd = e.target.value))}
              placeholder={"把職位描述貼在這裡…\n例如：Responsibilities / Requirements / 工作內容 / 職位要求"}
            />
          </Field>
          <div className="flex justify-between">
            <Btn size="sm" variant="ghost" disabled={!v.jd} onClick={() => mutateVersion((ver) => void (ver.jd = ""))}>
              清除 JD
            </Btn>
            <Btn size="sm" variant="primary" onClick={() => setTab("compose")}>
              前往調整版本內容 →
            </Btn>
          </div>
        </Card>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-500">
          <b className="text-slate-700">比對原理：</b>
          內置技能／工具／軟技能詞典（含中英別名，例如 前端＝Frontend、k8s＝Kubernetes），加上你素材庫內的技能與標籤，再統計 JD 中重複出現的詞語。覆蓋率＝JD 關鍵字中，已出現在目前版本（職銜、簡介、Bullet、項目、技能、學歷）的比例。
        </div>
      </div>

      <div className="space-y-4">
        <SectionTitle title="關鍵字覆蓋分析" desc={analysis.hasJD ? `針對版本「${v.name}」` : "貼上 JD 後即時顯示"} />
        {!analysis.hasJD ? (
          <EmptyState>尚未貼上 JD。貼上後會在這裡顯示 JD 關鍵字、已涵蓋項目及可補強建議。</EmptyState>
        ) : analysis.keywords.length === 0 ? (
          <EmptyState>在 JD 中找不到可辨識的關鍵字。請確認內容是否完整，或把技能名稱加入母版技能庫。</EmptyState>
        ) : (
          <>
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4",
                    tone === "emerald" && "border-emerald-400 text-emerald-700",
                    tone === "amber" && "border-amber-400 text-amber-700",
                    tone === "rose" && "border-rose-400 text-rose-700",
                  )}
                >
                  <span className="text-2xl font-bold leading-none">{pct}%</span>
                  <span className="mt-0.5 text-[10px]">覆蓋率</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn("h-full rounded-full transition-all", tone === "emerald" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : "bg-rose-500")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    JD 共辨識 <b>{analysis.keywords.length}</b> 個關鍵字：已涵蓋 <b className="text-emerald-700">{analysis.covered.length}</b>，尚未提及 <b className="text-amber-700">{analysis.missing.length}</b>。
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-4">
                <h3 className="mb-2 text-sm font-semibold text-emerald-800">✓ 已涵蓋（{analysis.covered.length}）</h3>
                <Chips list={analysis.covered} tone="green" />
              </Card>
              <Card className="p-4">
                <h3 className="mb-2 text-sm font-semibold text-amber-800">△ 尚未提及／可補強（{analysis.missing.length}）</h3>
                <Chips list={analysis.missing} tone="amber" />
              </Card>
            </div>

            <div>
              <SectionTitle title="補強建議（來自你的母版素材庫）" desc="一鍵把相關 Bullet／項目／技能加入此版本。" />
              {grouped.length === 0 ? (
                <EmptyState>🎉 沒有需要補強的關鍵字。</EmptyState>
              ) : (
                <div className="space-y-2">
                  {grouped.map(([kw, items]) => (
                    <Card key={kw} className="p-3">
                      <div className="mb-1.5 flex items-center gap-2">
                        <Badge tone="amber">{kw}</Badge>
                        <span className="text-xs text-slate-400">JD 出現 {analysis.missing.find((m) => m.term === kw)?.count ?? 0} 次</span>
                      </div>
                      <div className="space-y-1.5">
                        {items.map((s, i) =>
                          s.type === "none" ? (
                            <div key={i} className="flex items-center justify-between gap-2 text-xs text-slate-500">
                              <span>母版中找不到相關素材。若你確實具備，請補充到素材庫或在簡介／Bullet 中加入。</span>
                              <Btn size="xs" variant="ghost" onClick={() => setTab("master")}>到母版</Btn>
                            </div>
                          ) : (
                            <div key={i} className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
                              <div className="min-w-0 text-xs">
                                <div className="font-medium text-slate-700">{s.type === "skill" ? s.label : s.label}</div>
                                {s.type !== "skill" && s.text && <div className="mt-0.5 line-clamp-2 text-slate-500">{s.text}</div>}
                                {s.type === "bullet" && !s.expActive && <div className="mt-0.5 text-amber-700">※ 該經驗目前未啟用，加入時會一併啟用</div>}
                              </div>
                              <Btn size="xs" variant="soft" onClick={() => apply(s)}>
                                ＋ 加入
                              </Btn>
                            </div>
                          ),
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Chips({ list, tone }: { list: KeywordHit[]; tone: "green" | "amber" }) {
  if (!list.length) return <p className="text-xs text-slate-400">—</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {list.map((k) => (
        <span
          key={k.term}
          title={`${KIND_LABEL[k.kind]}｜JD 出現 ${k.count} 次`}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
            tone === "green" ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
            k.kind === "freq" && "italic",
          )}
        >
          {k.term}
          <span className="text-[10px] opacity-60">×{k.count}</span>
        </span>
      ))}
    </div>
  );
}
