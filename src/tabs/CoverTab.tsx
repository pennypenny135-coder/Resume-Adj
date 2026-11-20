import { useMemo } from "react";
import { useStore } from "../store";
import { useFeedback } from "../components/feedback";
import { Badge, Btn, Check, EmptyState, Field, IconBtn, SectionTitle, TextArea, TextInput } from "../components/ui";
import { CoverDocument, PaperPreview, PrintPortal } from "../components/documents";
import { coverToMarkdown, coverToText, resolveCover } from "../lib/resolve";
import { copyText, downloadText, moveItem, printWithTitle, safeFilename } from "../lib/util";
import { COVER_KIND_LABEL } from "../types";

const VARS = ["{{company}}", "{{role}}", "{{manager}}", "{{name}}", "{{title}}", "{{date}}"];

export default function CoverTab() {
  const { version: v, master, mutateVersion } = useStore();
  const { toast } = useFeedback();
  const c = v.cover;
  const cover = useMemo(() => resolveCover(master, v), [master, v]);
  const base = safeFilename(`CoverLetter_${master.profile.name || "me"}_${c.company || v.name}`);

  const validIds = c.blockIds.filter((id) => master.coverBlocks.some((b) => b.id === id));
  const unselected = master.coverBlocks.filter((b) => !c.blockIds.includes(b.id));
  const setC = (fn: (cv: typeof c) => void) => mutateVersion((ver) => fn(ver.cover));

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="space-y-5">
        <div>
          <SectionTitle title="求職信設定" desc="變數會自動代入段落中的 {{company}}、{{role}} 等標記。" />
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="公司名稱">
                <TextInput value={c.company} onChange={(e) => setC((x) => void (x.company = e.target.value))} placeholder="Aurora Cloud" />
              </Field>
              <Field label="職位名稱">
                <TextInput value={c.role} onChange={(e) => setC((x) => void (x.role = e.target.value))} placeholder="Senior Frontend Engineer" />
              </Field>
              <Field label="收件人／招聘主管" hint="可留空">
                <TextInput value={c.manager} onChange={(e) => setC((x) => void (x.manager = e.target.value))} placeholder="李小姐 / Ms. Lee" />
              </Field>
              <Field label="稱呼（留空＝自動）">
                <TextInput value={c.greeting} onChange={(e) => setC((x) => void (x.greeting = e.target.value))} placeholder="自動：敬啟者：" />
              </Field>
              <Field label="結語">
                <TextInput value={c.signoff} onChange={(e) => setC((x) => void (x.signoff = e.target.value))} />
              </Field>
              <div>
                <Check checked={c.showDate} onChange={(on) => setC((x) => void (x.showDate = on))} label="顯示日期" className="mb-1.5" />
                <TextInput type="text" disabled={!c.showDate} value={c.date} onChange={(e) => setC((x) => void (x.date = e.target.value))} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              可用變數：
              {VARS.map((x) => (
                <code key={x} className="rounded bg-slate-100 px-1.5 py-0.5">
                  {x}
                </code>
              ))}
            </div>
            {(!c.company.trim() || !c.role.trim()) && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">尚未填寫公司或職位，預覽會以「［公司名稱］／［職位名稱］」佔位，匯出前請補齊。</p>
            )}
          </div>
        </div>

        <div>
          <SectionTitle title={`段落組合（已選 ${validIds.length}）`} desc="按順序組成信件；可在此版本內覆寫措辭，母版不會被改動。" />
          {master.coverBlocks.length === 0 && <EmptyState>母版沒有求職信段落，請到「母版資料庫 → 求職信段落庫」新增。</EmptyState>}
          <div className="space-y-2">
            {validIds.map((id, idx) => {
              const b = master.coverBlocks.find((x) => x.id === id)!;
              const ov = c.overrides[id];
              return (
                <div key={id} className="rounded-xl border border-indigo-200 bg-white p-3 shadow-sm">
                  <div className="mb-2 flex items-center gap-2">
                    <Check checked onChange={() => setC((x) => void (x.blockIds = x.blockIds.filter((i) => i !== id)))} />
                    <div className="min-w-0 flex-1 truncate text-sm font-medium">{b.title || "（未命名段落）"}</div>
                    <Badge tone="amber">{COVER_KIND_LABEL[b.kind]}</Badge>
                    <IconBtn title="上移" disabled={idx === 0} onClick={() => setC((x) => void (x.blockIds = moveItem(x.blockIds, x.blockIds.indexOf(id), -1)))}>↑</IconBtn>
                    <IconBtn title="下移" disabled={idx === validIds.length - 1} onClick={() => setC((x) => void (x.blockIds = moveItem(x.blockIds, x.blockIds.indexOf(id), 1)))}>↓</IconBtn>
                  </div>
                  <TextArea
                    rows={4}
                    value={ov ?? b.text}
                    onChange={(e) =>
                      setC((x) => {
                        if (e.target.value === b.text) delete x.overrides[id];
                        else x.overrides[id] = e.target.value;
                      })
                    }
                  />
                  {ov !== undefined && ov !== b.text && (
                    <div className="mt-1 flex items-center gap-2 text-[11px]">
                      <Badge tone="amber">此版本已微調</Badge>
                      <button className="text-indigo-600 hover:underline" onClick={() => setC((x) => void delete x.overrides[id])}>
                        還原母版
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {unselected.length > 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-3">
                <div className="mb-2 text-xs font-medium text-slate-500">可加入的段落</div>
                <div className="space-y-1.5">
                  {unselected.map((b) => (
                    <div key={b.id} className="flex items-start gap-2 rounded-lg bg-slate-50 px-2.5 py-2">
                      <Check checked={false} onChange={() => setC((x) => void x.blockIds.push(b.id))} className="mt-0.5" />
                      <div className="min-w-0 flex-1 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-700">{b.title || "（未命名段落）"}</span>
                          <Badge tone="amber">{COVER_KIND_LABEL[b.kind]}</Badge>
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-slate-500">{b.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle title="求職信預覽" />
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" size="sm" onClick={() => printWithTitle(base)}>
              🖨 列印／PDF
            </Btn>
            <Btn size="sm" onClick={() => downloadText(`${base}.md`, coverToMarkdown(cover), "text/markdown")}>.md</Btn>
            <Btn size="sm" onClick={() => downloadText(`${base}.txt`, coverToText(cover), "text/plain", true)}>.txt</Btn>
            <Btn size="sm" onClick={async () => toast((await copyText(coverToText(cover))) ? "已複製求職信" : "複製失敗，請改用匯出", "ok")}>
              複製全文
            </Btn>
          </div>
        </div>
        <div className="rounded-xl bg-slate-200/70 p-3 sm:p-5">
          <PaperPreview layout={v.layout}>
            <CoverDocument c={cover} layout={v.layout} />
          </PaperPreview>
        </div>
      </section>

      <PrintPortal layout={v.layout}>
        <CoverDocument c={cover} layout={v.layout} />
      </PrintPortal>
    </div>
  );
}
