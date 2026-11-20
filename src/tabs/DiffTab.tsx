import { useMemo, useState } from "react";
import { useStore } from "../store";
import { Badge, EmptyState, Select, SectionTitle } from "../components/ui";
import { diffVersions, type DiffLine, type Seg } from "../lib/diff";
import { masterBaseline } from "../lib/versions";
import { cn } from "../utils/cn";

const KIND = {
  added: { label: "新增", tone: "green" as const, box: "border-emerald-200 bg-emerald-50/50" },
  removed: { label: "移除", tone: "rose" as const, box: "border-rose-200 bg-rose-50/50" },
  changed: { label: "修改", tone: "amber" as const, box: "border-amber-200 bg-amber-50/40" },
  moved: { label: "順序", tone: "sky" as const, box: "border-sky-200 bg-sky-50/50" },
};

export default function DiffTab() {
  const { data, master, version } = useStore();
  const [baseId, setBaseId] = useState("__master__");
  const [targetId, setTargetId] = useState<string>("");

  const baseline = useMemo(() => masterBaseline(master), [master]);
  const all = useMemo(() => [baseline, ...data.versions], [baseline, data.versions]);
  const target = all.find((v) => v.id === (targetId || version.id)) ?? version;
  const base = all.find((v) => v.id === baseId) ?? baseline;

  const lines = useMemo(() => diffVersions(master, base, target), [master, base, target]);
  const counts = useMemo(() => {
    const c = { added: 0, removed: 0, changed: 0, moved: 0 };
    for (const l of lines) c[l.kind]++;
    return c;
  }, [lines]);

  const grouped = useMemo(() => {
    const m = new Map<string, DiffLine[]>();
    for (const l of lines) m.set(l.section, [...(m.get(l.section) ?? []), l]);
    return Array.from(m.entries());
  }, [lines]);

  return (
    <div className="space-y-4">
      <SectionTitle title="版本差異對比" desc="比較兩個版本（或母版）在啟用區塊、Bullet 內容、摘要與求職信段落上的差異。" />
      <div className="grid items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto_1fr]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">基準（舊）</span>
          <Select value={base.id} onChange={(e) => setBaseId(e.target.value)}>
            {all.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id === "__master__" ? "📚 母版（全部素材、無覆寫）" : v.name}
              </option>
            ))}
          </Select>
        </label>
        <div className="hidden pb-2 text-center text-slate-400 sm:block">→</div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">對比（新）</span>
          <Select value={target.id} onChange={(e) => setTargetId(e.target.value)}>
            {all.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id === "__master__" ? "📚 母版（全部素材、無覆寫）" : v.id === version.id ? `${v.name}（目前）` : v.name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {base.id === target.id ? (
        <EmptyState>請選擇兩個不同的版本。</EmptyState>
      ) : lines.length === 0 ? (
        <EmptyState>✅ 兩者內容完全一致。</EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge tone="green">新增 {counts.added}</Badge>
            <Badge tone="rose">移除 {counts.removed}</Badge>
            <Badge tone="amber">修改 {counts.changed}</Badge>
            <Badge tone="sky">順序調整 {counts.moved}</Badge>
            <span className="text-xs text-slate-400">以「{base.name}」為基準，「{target.name}」相對多了／少了什麼</span>
          </div>
          {grouped.map(([section, items]) => (
            <section key={section}>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">
                {section} <span className="text-xs font-normal text-slate-400">{items.length}</span>
              </h3>
              <div className="space-y-2">
                {items.map((l) => (
                  <DiffCard key={l.key} line={l} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

function DiffCard({ line }: { line: DiffLine }) {
  const k = KIND[line.kind];
  return (
    <div className={cn("rounded-lg border p-3", k.box)}>
      <div className="mb-1.5 flex items-center gap-2">
        <Badge tone={k.tone}>{k.label}</Badge>
        <span className="min-w-0 truncate text-xs font-medium text-slate-700">{line.label}</span>
      </div>
      {line.kind === "added" && <p className="whitespace-pre-wrap break-words text-sm text-emerald-900">＋ {line.after}</p>}
      {line.kind === "removed" && <p className="whitespace-pre-wrap break-words text-sm text-rose-900 line-through decoration-rose-300">－ {line.before}</p>}
      {line.kind === "changed" && line.segs && <Inline segs={line.segs} />}
      {line.kind === "moved" && (
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <div>
            <div className="mb-0.5 font-medium text-slate-500">之前</div>
            <pre className="whitespace-pre-wrap break-words font-sans text-slate-700">{line.before}</pre>
          </div>
          <div>
            <div className="mb-0.5 font-medium text-slate-500">之後</div>
            <pre className="whitespace-pre-wrap break-words font-sans text-slate-700">{line.after}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function Inline({ segs }: { segs: Seg[] }) {
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
      {segs.map((s, i) =>
        s.type === "eq" ? (
          <span key={i}>{s.t}</span>
        ) : s.type === "del" ? (
          <del key={i} className="rounded bg-rose-100 px-0.5 text-rose-800">
            {s.t}
          </del>
        ) : (
          <ins key={i} className="rounded bg-emerald-100 px-0.5 text-emerald-900 no-underline">
            {s.t}
          </ins>
        ),
      )}
    </p>
  );
}
