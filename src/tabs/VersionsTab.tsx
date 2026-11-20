import { useMemo, useState } from "react";
import { useStore } from "../store";
import { useFeedback } from "../components/feedback";
import { Badge, Btn, Card, EmptyState, Field, SectionTitle, Select, TextArea, TextInput } from "../components/ui";
import { analyzeJD } from "../lib/keywords";
import { countActive, resolveResume, resumeToText } from "../lib/resolve";
import { formatDate } from "../lib/util";
import { STATUS_LABEL, STATUS_ORDER, type Status } from "../types";
import { cn } from "../utils/cn";

const STATUS_TONE: Record<Status, "slate" | "sky" | "amber" | "green" | "rose" | "indigo"> = {
  draft: "slate",
  applied: "sky",
  interview: "amber",
  offer: "green",
  rejected: "rose",
  archived: "slate",
};

export default function VersionsTab() {
  const { data, master, version, mutate, mutateVersion, setActive, addVersion, duplicateVersion, deleteVersion, setTab } = useStore();
  const { confirm, toast } = useFeedback();
  const [filter, setFilter] = useState<Status | "all">("all");
  const [q, setQ] = useState("");

  const stats = useMemo(
    () =>
      data.versions.map((v) => {
        const r = resolveResume(master, v);
        const a = analyzeJD(v.jd, master, resumeToText(r));
        return { id: v.id, counts: countActive(r), coverage: a.coverage };
      }),
    [data.versions, master],
  );

  const statusCount = (s: Status) => data.versions.filter((v) => v.status === s).length;
  const shown = data.versions.filter(
    (v) =>
      (filter === "all" || v.status === filter) &&
      (!q.trim() || [v.name, v.note, v.cover.company, v.cover.role].join(" ").toLowerCase().includes(q.trim().toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle title="目前編輯中的版本" desc="修改名稱、申請狀態與備註。其他頁面的編輯都會套用在這個版本。" />
        <Card className="space-y-3 p-4">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <Field label="版本名稱">
              <TextInput value={version.name} onChange={(e) => mutateVersion((v) => void (v.name = e.target.value))} placeholder="2026-前端工程師-A公司" />
            </Field>
            <Field label="申請狀態">
              <Select value={version.status} onChange={(e) => mutateVersion((v) => void (v.status = e.target.value as Status))}>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="目標公司">
              <TextInput value={version.cover.company} onChange={(e) => mutateVersion((v) => void (v.cover.company = e.target.value))} />
            </Field>
            <Field label="目標職位">
              <TextInput value={version.cover.role} onChange={(e) => mutateVersion((v) => void (v.cover.role = e.target.value))} />
            </Field>
          </div>
          <Field label="備註" hint="投遞日期、聯絡人、面試提醒…">
            <TextArea rows={2} value={version.note} onChange={(e) => mutateVersion((v) => void (v.note = e.target.value))} />
          </Field>
        </Card>
      </section>

      <section>
        <SectionTitle
          title={`所有版本（${data.versions.length}）`}
          actions={
            <>
              <Btn
                variant="primary"
                size="sm"
                onClick={() => {
                  addVersion("master");
                  toast("已基於母版建立新版本（所有素材已啟用）");
                }}
              >
                ＋ 基於母版新增
              </Btn>
              <Btn
                size="sm"
                onClick={() => {
                  addVersion("blank");
                  toast("已建立空白版本，請到「版本內容」勾選素材");
                }}
              >
                ＋ 空白版本
              </Btn>
            </>
          }
        />
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <TextInput className="max-w-56" placeholder="搜尋名稱／公司／備註" value={q} onChange={(e) => setQ(e.target.value)} />
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            全部 {data.versions.length}
          </FilterChip>
          {STATUS_ORDER.map((s) => (
            <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)} disabled={statusCount(s) === 0 && filter !== s}>
              {STATUS_LABEL[s]} {statusCount(s)}
            </FilterChip>
          ))}
        </div>
        {shown.length === 0 && <EmptyState>沒有符合條件的版本。</EmptyState>}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((v) => {
            const st = stats.find((s) => s.id === v.id);
            const isActive = v.id === data.activeId;
            const pct = st?.coverage == null ? null : Math.round(st.coverage * 100);
            return (
              <div
                key={v.id}
                className={cn("flex flex-col rounded-xl border bg-white p-4 shadow-sm", isActive ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900" title={v.name}>
                      {v.name || "（未命名）"}
                    </div>
                    <div className="truncate text-xs text-slate-500">
                      {[v.cover.company, v.cover.role].filter(Boolean).join(" · ") || "未設定目標公司／職位"}
                    </div>
                  </div>
                  {isActive && <Badge tone="indigo">編輯中</Badge>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Select
                    className="!w-auto !py-0.5 text-xs"
                    value={v.status}
                    onChange={(e) =>
                      mutate((d) => {
                        const t = d.versions.find((x) => x.id === v.id);
                        if (t) {
                          t.status = e.target.value as Status;
                          t.updatedAt = Date.now();
                        }
                      })
                    }
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </Select>
                  <Badge tone={STATUS_TONE[v.status]}>{STATUS_LABEL[v.status]}</Badge>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-center text-xs">
                  <Stat label="經驗" value={st?.counts.experiences ?? 0} />
                  <Stat label="項目" value={st?.counts.projects ?? 0} />
                  <Stat label="JD 覆蓋" value={pct === null ? "—" : `${pct}%`} tone={pct === null ? undefined : pct >= 70 ? "g" : pct >= 40 ? "a" : "r"} />
                </div>
                {v.note && <p className="mt-2 line-clamp-2 text-xs text-slate-500">{v.note}</p>}
                <div className="mt-2 text-[11px] text-slate-400">更新 {formatDate(v.updatedAt)} · 建立 {formatDate(v.createdAt)}</div>
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                  {!isActive ? (
                    <Btn size="sm" variant="soft" onClick={() => setActive(v.id)}>
                      切換編輯
                    </Btn>
                  ) : (
                    <Btn size="sm" variant="soft" onClick={() => setTab("compose")}>
                      調整內容 →
                    </Btn>
                  )}
                  <Btn
                    size="sm"
                    onClick={() => {
                      duplicateVersion(v.id);
                      toast("已複製版本，並切換到複本");
                    }}
                  >
                    複製
                  </Btn>
                  <Btn
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-rose-600 hover:bg-rose-50"
                    onClick={async () => {
                      if (await confirm({ title: `刪除版本「${v.name}」？`, message: "此操作無法復原（母版資料不受影響）。建議先匯出備份。", confirmText: "刪除", danger: true })) {
                        deleteVersion(v.id);
                        toast("已刪除版本", "info");
                      }
                    }}
                  >
                    刪除
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function FilterChip({ active, onClick, children, disabled }: { active: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full border px-3 py-1 text-xs disabled:opacity-40",
        active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "g" | "a" | "r" }) {
  return (
    <div className="rounded-lg bg-slate-50 py-1.5">
      <div className={cn("text-sm font-semibold", tone === "g" && "text-emerald-700", tone === "a" && "text-amber-700", tone === "r" && "text-rose-700", !tone && "text-slate-800")}>{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}
