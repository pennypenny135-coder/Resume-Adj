import { useState } from "react";
import { useStore } from "../store";
import { Badge, Btn, Check, EmptyState, IconBtn, SectionTitle, TextArea } from "../components/ui";
import { PaperPreview, ResumeDocument } from "../components/documents";
import { scoreText } from "../lib/keywords";
import { moveItem } from "../lib/util";
import { CONTACT_KEYS, CONTACT_LABEL } from "../types";
import { cn } from "../utils/cn";

export default function ComposeTab() {
  const { master, version: v, mutateVersion, analysis, resolved, setTab } = useStore();
  const [showPreview, setShowPreview] = useState(true);
  const kws = analysis.keywords;

  const sortByJD = () =>
    mutateVersion((ver, m) => {
      for (const e of m.experiences) {
        const sel = ver.bulletSel[e.id];
        if (!sel || sel.length < 2) continue;
        const text = new Map(e.bullets.map((b) => [b.id, ver.overrides.bulletText[b.id] ?? b.text]));
        const scored = sel.map((id, idx) => ({ id, idx, s: scoreText(text.get(id) ?? "", kws).score }));
        scored.sort((a, b) => b.s - a.s || a.idx - b.idx);
        ver.bulletSel[e.id] = scored.map((x) => x.id);
      }
      const expScore = (id: string) => {
        const e = m.experiences.find((x) => x.id === id);
        if (!e) return 0;
        const sel = new Set(ver.bulletSel[id] ?? []);
        return e.bullets.filter((b) => sel.has(b.id)).reduce((n, b) => n + scoreText(ver.overrides.bulletText[b.id] ?? b.text, kws).score, 0);
      };
      const scored = ver.expIds.map((id, idx) => ({ id, idx, s: expScore(id) }));
      scored.sort((a, b) => b.s - a.s || a.idx - b.idx);
      ver.expIds = scored.map((x) => x.id);
    });

  /* -------- experiences -------- */
  const toggleExp = (id: string, on: boolean) =>
    mutateVersion((ver, m) => {
      if (on) {
        if (!ver.expIds.includes(id)) ver.expIds.push(id);
        if (!ver.bulletSel[id] || ver.bulletSel[id].length === 0) {
          ver.bulletSel[id] = (m.experiences.find((e) => e.id === id)?.bullets ?? []).map((b) => b.id);
        }
      } else ver.expIds = ver.expIds.filter((x) => x !== id);
    });

  const toggleBullet = (expId: string, bid: string, on: boolean) =>
    mutateVersion((ver) => {
      const sel = ver.bulletSel[expId] ?? [];
      ver.bulletSel[expId] = on ? (sel.includes(bid) ? sel : [...sel, bid]) : sel.filter((x) => x !== bid);
      if (on && !ver.expIds.includes(expId)) ver.expIds.push(expId);
    });

  const setBulletText = (bid: string, original: string, text: string) =>
    mutateVersion((ver) => {
      if (text === original) delete ver.overrides.bulletText[bid];
      else ver.overrides.bulletText[bid] = text;
    });

  const expOrder = [...v.expIds.filter((id) => master.experiences.some((e) => e.id === id)), ...master.experiences.filter((e) => !v.expIds.includes(e.id)).map((e) => e.id)];
  const projOrder = [...v.projIds.filter((id) => master.projects.some((e) => e.id === id)), ...master.projects.filter((e) => !v.projIds.includes(e.id)).map((e) => e.id)];

  const masterTitle = master.profile.title;
  const masterSummary = master.profile.summary;
  const titleVal = v.overrides.title ?? masterTitle;
  const summaryVal = v.overrides.summary ?? masterSummary;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-900">
          <span>
            正在編輯版本：<b>{v.name}</b>。這裡的勾選、排序與文字微調<b>只影響此版本</b>，不會改動母版。
          </span>
          <div className="flex gap-2">
            <Btn size="sm" variant="soft" disabled={!analysis.hasJD} onClick={sortByJD} title={analysis.hasJD ? "" : "請先在 JD 比對頁貼上職位描述"}>
              依 JD 相關度重排
            </Btn>
            <Btn size="sm" className="xl:hidden" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? "隱藏預覽" : "顯示預覽"}
            </Btn>
          </div>
        </div>

        {/* contacts */}
        <section>
          <SectionTitle title="聯絡資訊顯示" desc="為此版本選擇顯示哪幾項。留空的欄位請到母版填寫。" />
          <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-white p-3">
            {CONTACT_KEYS.map((k) => {
              const has = !!master.profile[k].trim();
              return (
                <Check
                  key={k}
                  checked={v.contactShow[k] && has}
                  onChange={(on) => mutateVersion((ver) => void (ver.contactShow[k] = on))}
                  className={cn(!has && "opacity-40")}
                  label={
                    <span>
                      {CONTACT_LABEL[k]}
                      {!has && <span className="ml-1 text-xs text-slate-400">（未填）</span>}
                    </span>
                  }
                />
              );
            })}
          </div>
        </section>

        {/* title & summary */}
        <section>
          <SectionTitle title="職銜與簡介（局部覆寫）" desc="只改此版本的顯示文字；母版保持不變。" />
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
            <OverrideField
              label="職銜"
              value={titleVal}
              overridden={v.overrides.title !== undefined && v.overrides.title !== masterTitle}
              original={masterTitle}
              rows={1}
              onChange={(t) =>
                mutateVersion((ver) => {
                  if (t === masterTitle) delete ver.overrides.title;
                  else ver.overrides.title = t;
                })
              }
              onRevert={() => mutateVersion((ver) => void delete ver.overrides.title)}
            />
            <OverrideField
              label="個人簡介"
              value={summaryVal}
              overridden={v.overrides.summary !== undefined && v.overrides.summary !== masterSummary}
              original={masterSummary}
              rows={4}
              onChange={(t) =>
                mutateVersion((ver) => {
                  if (t === masterSummary) delete ver.overrides.summary;
                  else ver.overrides.summary = t;
                })
              }
              onRevert={() => mutateVersion((ver) => void delete ver.overrides.summary)}
            />
          </div>
        </section>

        {/* experiences */}
        <section>
          <SectionTitle
            title={`工作經驗（已啟用 ${resolved.experiences.length} / ${master.experiences.length}）`}
            desc="勾選要放入此版本的經驗與 Bullet；可調整順序或單獨微調措辭。"
            actions={
              <>
                <Btn size="sm" onClick={() => mutateVersion((ver, m) => m.experiences.forEach((e) => { if (!ver.expIds.includes(e.id)) { ver.expIds.push(e.id); ver.bulletSel[e.id] = e.bullets.map((b) => b.id); } }))}>
                  全選
                </Btn>
                <Btn size="sm" onClick={() => mutateVersion((ver) => void (ver.expIds = []))}>
                  全不選
                </Btn>
              </>
            }
          />
          {master.experiences.length === 0 && <EmptyState>母版沒有工作經驗，請先到「母版資料庫」新增。</EmptyState>}
          <div className="space-y-2">
            {expOrder.map((id) => {
              const e = master.experiences.find((x) => x.id === id)!;
              const active = v.expIds.includes(id);
              const posInSel = v.expIds.indexOf(id);
              const sel = v.bulletSel[id] ?? [];
              const bmap = new Map(e.bullets.map((b) => [b.id, b]));
              const selectedBullets = sel.filter((bid) => bmap.has(bid));
              const unselected = e.bullets.filter((b) => !sel.includes(b.id));
              return (
                <div key={id} className={cn("rounded-xl border bg-white", active ? "border-indigo-200 shadow-sm" : "border-slate-200 opacity-80")}>
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <Check checked={active} onChange={(on) => toggleExp(id, on)} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-900">
                        {e.role || "（未填職位）"} · {e.company || "（未填公司）"}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
                        <span>{[e.start, e.end].filter(Boolean).join(" – ")}</span>
                        {e.tags.map((t) => (
                          <Badge key={t}>{t}</Badge>
                        ))}
                      </div>
                    </div>
                    <Badge tone={active ? "indigo" : "slate"}>
                      {selectedBullets.length}/{e.bullets.length}
                    </Badge>
                    {active && (
                      <>
                        <IconBtn title="經驗上移" disabled={posInSel <= 0} onClick={() => mutateVersion((ver) => void (ver.expIds = moveItem(ver.expIds, posInSel, -1)))}>↑</IconBtn>
                        <IconBtn title="經驗下移" disabled={posInSel >= v.expIds.length - 1} onClick={() => mutateVersion((ver) => void (ver.expIds = moveItem(ver.expIds, posInSel, 1)))}>↓</IconBtn>
                      </>
                    )}
                  </div>
                  {(active || unselected.length > 0) && (
                    <div className="space-y-1.5 border-t border-slate-100 px-3 py-2.5">
                      {active &&
                        selectedBullets.map((bid, idx) => {
                          const b = bmap.get(bid)!;
                          const ov = v.overrides.bulletText[bid];
                          const val = ov ?? b.text;
                          const sc = scoreText(val, kws);
                          return (
                            <div key={bid} className="flex items-start gap-1.5">
                              <Check className="mt-2" checked onChange={(on) => toggleBullet(id, bid, on)} />
                              <div className="min-w-0 flex-1">
                                <TextArea rows={2} value={val} onChange={(ev) => setBulletText(bid, b.text, ev.target.value)} />
                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                                  {ov !== undefined && ov !== b.text && (
                                    <>
                                      <Badge tone="amber">已微調</Badge>
                                      <button className="text-indigo-600 hover:underline" onClick={() => mutateVersion((ver) => void delete ver.overrides.bulletText[bid])}>
                                        還原母版
                                      </button>
                                    </>
                                  )}
                                  {analysis.hasJD && (
                                    <span title={sc.matched.join("、")} className={cn("rounded px-1.5 py-0.5", sc.score ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400")}>
                                      JD 命中 {sc.matched.length}
                                      {sc.matched.length > 0 && `：${sc.matched.slice(0, 4).join("、")}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <IconBtn title="上移" disabled={idx === 0} onClick={() => mutateVersion((ver) => void (ver.bulletSel[id] = moveItem(ver.bulletSel[id], idx, -1)))}>↑</IconBtn>
                                <IconBtn title="下移" disabled={idx === selectedBullets.length - 1} onClick={() => mutateVersion((ver) => void (ver.bulletSel[id] = moveItem(ver.bulletSel[id], idx, 1)))}>↓</IconBtn>
                              </div>
                            </div>
                          );
                        })}
                      {unselected.map((b) => {
                        const sc = scoreText(b.text, kws);
                        return (
                          <div key={b.id} className="flex items-start gap-1.5 rounded-lg bg-slate-50 px-2 py-1.5">
                            <Check className="mt-0.5" checked={false} onChange={(on) => toggleBullet(id, b.id, on)} />
                            <div className="min-w-0 flex-1 text-sm text-slate-500">
                              {b.text || <i className="text-slate-300">（空白）</i>}
                              {analysis.hasJD && sc.matched.length > 0 && (
                                <span className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-700">JD 命中：{sc.matched.slice(0, 4).join("、")}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* projects */}
        <section>
          <SectionTitle
            title={`項目／作品集（已啟用 ${resolved.projects.length} / ${master.projects.length}）`}
            actions={
              <>
                <Btn size="sm" onClick={() => mutateVersion((ver, m) => void (ver.projIds = m.projects.map((p) => p.id)))}>全選</Btn>
                <Btn size="sm" onClick={() => mutateVersion((ver) => void (ver.projIds = []))}>全不選</Btn>
              </>
            }
          />
          {master.projects.length === 0 && <EmptyState>母版沒有項目。</EmptyState>}
          <div className="space-y-2">
            {projOrder.map((id) => {
              const p = master.projects.find((x) => x.id === id)!;
              const active = v.projIds.includes(id);
              const pos = v.projIds.indexOf(id);
              const ov = v.overrides.projectSummary[id];
              const val = ov ?? p.summary;
              const sc = scoreText([p.name, val, p.results, p.tags.join(" ")].join(" "), kws);
              return (
                <div key={id} className={cn("rounded-xl border bg-white p-3", active ? "border-indigo-200 shadow-sm" : "border-slate-200 opacity-80")}>
                  <div className="flex items-center gap-2">
                    <Check
                      checked={active}
                      onChange={(on) => mutateVersion((ver) => void (ver.projIds = on ? [...ver.projIds.filter((x) => x !== id), id] : ver.projIds.filter((x) => x !== id)))}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-900">{p.name || "（未命名項目）"}</div>
                      <div className="flex flex-wrap gap-1">
                        {p.tags.map((t) => (
                          <Badge key={t} tone="indigo">
                            {t}
                          </Badge>
                        ))}
                        {analysis.hasJD && sc.matched.length > 0 && <Badge tone="green">JD 命中：{sc.matched.slice(0, 4).join("、")}</Badge>}
                      </div>
                    </div>
                    {active && (
                      <>
                        <IconBtn title="上移" disabled={pos <= 0} onClick={() => mutateVersion((ver) => void (ver.projIds = moveItem(ver.projIds, pos, -1)))}>↑</IconBtn>
                        <IconBtn title="下移" disabled={pos >= v.projIds.length - 1} onClick={() => mutateVersion((ver) => void (ver.projIds = moveItem(ver.projIds, pos, 1)))}>↓</IconBtn>
                      </>
                    )}
                  </div>
                  {active && (
                    <div className="mt-2">
                      <TextArea
                        rows={2}
                        value={val}
                        onChange={(ev) =>
                          mutateVersion((ver) => {
                            if (ev.target.value === p.summary) delete ver.overrides.projectSummary[id];
                            else ver.overrides.projectSummary[id] = ev.target.value;
                          })
                        }
                      />
                      {ov !== undefined && ov !== p.summary && (
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                          <Badge tone="amber">摘要已微調</Badge>
                          <button className="text-indigo-600 hover:underline" onClick={() => mutateVersion((ver) => void delete ver.overrides.projectSummary[id])}>
                            還原母版
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* skills */}
        <section>
          <SectionTitle
            title={`技能（已啟用 ${resolved.skills.length} 個分類 / ${resolved.skills.reduce((n, g) => n + g.items.length, 0)} 項）`}
            desc="點選技能標籤切換；綠色表示在 JD 中出現。"
            actions={
              <>
                <Btn
                  size="sm"
                  onClick={() =>
                    mutateVersion((ver, m) => {
                      ver.skillSel = {};
                      m.skillGroups.forEach((g) => (ver.skillSel[g.id] = g.items.slice()));
                    })
                  }
                >
                  全選
                </Btn>
                <Btn size="sm" onClick={() => mutateVersion((ver) => void (ver.skillSel = {}))}>全不選</Btn>
              </>
            }
          />
          {master.skillGroups.length === 0 && <EmptyState>母版沒有技能分類。</EmptyState>}
          <div className="space-y-2">
            {master.skillGroups.map((g) => {
              const sel = new Set(v.skillSel[g.id] ?? []);
              return (
                <div key={g.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">
                      {g.category || "（未命名分類）"} <span className="text-xs font-normal text-slate-400">{sel.size}/{g.items.length}</span>
                    </span>
                    <div className="flex gap-1">
                      <Btn size="xs" variant="ghost" onClick={() => mutateVersion((ver) => void (ver.skillSel[g.id] = g.items.slice()))}>全選</Btn>
                      <Btn size="xs" variant="ghost" onClick={() => mutateVersion((ver) => void delete ver.skillSel[g.id])}>清除</Btn>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.items.map((item) => {
                      const on = sel.has(item);
                      const inJD = analysis.hasJD && analysis.keywords.some((k) => k.variants.some((x) => x === item.toLowerCase()) || scoreText(item, [k]).score > 0);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            mutateVersion((ver) => {
                              const cur = ver.skillSel[g.id] ?? [];
                              ver.skillSel[g.id] = on ? cur.filter((x) => x !== item) : [...cur, item];
                            })
                          }
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs transition-colors",
                            on ? "border-indigo-300 bg-indigo-50 text-indigo-800" : "border-slate-200 bg-white text-slate-400 line-through decoration-slate-300 hover:text-slate-600",
                            inJD && "ring-2 ring-emerald-300",
                          )}
                          title={inJD ? "JD 有提及" : undefined}
                        >
                          {item}
                        </button>
                      );
                    })}
                    {g.items.length === 0 && <span className="text-xs text-slate-400">此分類沒有技能</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* education */}
        <section>
          <SectionTitle
            title={`學歷與證書（已啟用 ${resolved.education.length} / ${master.education.length}）`}
            actions={
              <>
                <Btn size="sm" onClick={() => mutateVersion((ver, m) => void (ver.eduIds = m.education.map((e) => e.id)))}>全選</Btn>
                <Btn size="sm" onClick={() => mutateVersion((ver) => void (ver.eduIds = []))}>全不選</Btn>
              </>
            }
          />
          {master.education.length === 0 && <EmptyState>母版沒有學歷或證書。</EmptyState>}
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {master.education.map((e) => (
              <div key={e.id} className="flex items-center gap-2 px-3 py-2">
                <Check
                  checked={v.eduIds.includes(e.id)}
                  onChange={(on) => mutateVersion((ver) => void (ver.eduIds = on ? [...ver.eduIds, e.id] : ver.eduIds.filter((x) => x !== e.id)))}
                />
                <div className="min-w-0 flex-1 text-sm">
                  <span className="font-medium text-slate-900">{e.degree || e.school || "（未命名）"}</span>
                  <span className="ml-2 text-xs text-slate-500">{[e.degree ? e.school : "", e.period].filter(Boolean).join(" · ")}</span>
                </div>
                <Badge tone={e.kind === "education" ? "sky" : "green"}>{e.kind === "education" ? "學歷" : "證書"}</Badge>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-2 pb-4">
          <Btn onClick={() => setTab("tailor")}>← JD 比對</Btn>
          <Btn variant="primary" onClick={() => setTab("resume")}>前往排版與匯出 →</Btn>
        </div>
      </div>

      <aside className={cn("min-w-0 xl:block", showPreview ? "block" : "hidden")}>
        <div className="sticky top-[132px] max-h-[calc(100vh-148px)] overflow-auto rounded-xl border border-slate-200 bg-slate-200/60 p-3 thin-scroll">
          <div className="mb-2 text-xs font-medium text-slate-500">即時預覽</div>
          <PaperPreview layout={v.layout}>
            <ResumeDocument r={resolved} />
          </PaperPreview>
        </div>
      </aside>
    </div>
  );
}

function OverrideField({
  label,
  value,
  original,
  overridden,
  rows,
  onChange,
  onRevert,
}: {
  label: string;
  value: string;
  original: string;
  overridden: boolean;
  rows: number;
  onChange: (t: string) => void;
  onRevert: () => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
        <span>
          {label} {overridden && <Badge tone="amber">此版本已覆寫</Badge>}
        </span>
        {overridden && (
          <button className="font-normal text-indigo-600 hover:underline" onClick={onRevert}>
            還原為母版
          </button>
        )}
      </div>
      <TextArea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      {overridden && <div className="mt-1 text-[11px] text-slate-400">母版原文：{original || "（空白）"}</div>}
    </div>
  );
}
