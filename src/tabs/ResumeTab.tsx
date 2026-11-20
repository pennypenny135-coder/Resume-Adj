import { useState } from "react";
import { useStore } from "../store";
import { useFeedback } from "../components/feedback";
import { Btn, Check, SectionTitle } from "../components/ui";
import { RangeField, Segmented } from "../components/controls";
import { PaperPreview, PrintPortal, ResumeDocument } from "../components/documents";
import { resumeToMarkdown, resumeToText } from "../lib/resolve";
import { copyText, downloadText, printWithTitle, safeFilename } from "../lib/util";
import type { Layout } from "../types";

const SECTION_LABELS: { key: keyof Layout["sections"]; label: string }[] = [
  { key: "summary", label: "個人簡介" },
  { key: "experience", label: "工作經驗" },
  { key: "projects", label: "項目／作品" },
  { key: "skills", label: "技能" },
  { key: "education", label: "學歷與證書" },
];

export default function ResumeTab() {
  const { version: v, resolved, mutateVersion, master } = useStore();
  const { toast } = useFeedback();
  const [pages, setPages] = useState(1);
  const L = v.layout;
  const setL = (fn: (l: Layout) => void) => mutateVersion((ver) => fn(ver.layout));
  const base = safeFilename(`${master.profile.name || "resume"}_${v.name}`);

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <SectionTitle title="版面設定" desc="設定會儲存在此版本。" />
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">欄位</div>
            <Segmented
              value={L.columns}
              onChange={(c) => setL((l) => void (l.columns = c))}
              options={[
                { value: 1, label: "單欄" },
                { value: 2, label: "雙欄" },
              ]}
            />
          </div>
          <RangeField label="字體大小" value={L.fontSize} min={8} max={13} step={0.5} unit="pt" onChange={(n) => setL((l) => void (l.fontSize = n))} />
          <RangeField label="頁邊距" value={L.margin} min={6} max={25} unit="mm" onChange={(n) => setL((l) => void (l.margin = n))} />
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">紙張</div>
            <Segmented
              value={L.paper}
              onChange={(p) => setL((l) => void (l.paper = p))}
              options={[
                { value: "A4", label: "A4" },
                { value: "Letter", label: "Letter" },
              ]}
            />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">字體風格</div>
            <Segmented
              value={L.font}
              onChange={(f) => setL((l) => void (l.font = f))}
              options={[
                { value: "sans", label: "黑體 Sans" },
                { value: "serif", label: "明體 Serif" },
              ]}
            />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-slate-600">區塊標題語言</div>
            <Segmented
              value={L.headings}
              onChange={(h) => setL((l) => void (l.headings = h))}
              options={[
                { value: "zh", label: "中文" },
                { value: "en", label: "English" },
              ]}
            />
          </div>
          <div>
            <div className="mb-2 text-xs font-medium text-slate-600">顯示區塊</div>
            <div className="space-y-1.5">
              {SECTION_LABELS.map((s) => (
                <Check key={s.key} checked={L.sections[s.key]} onChange={(on) => setL((l) => void (l.sections[s.key] = on))} label={s.label} className="flex" />
              ))}
            </div>
          </div>
        </div>
      </aside>

      <section className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-slate-600">
            預計 <b className={pages > 2 ? "text-rose-600" : "text-slate-900"}>{pages}</b> 頁
            {pages > 2 && <span className="ml-2 text-xs text-rose-600">建議精簡到 1–2 頁</span>}
            <span className="ml-2 text-xs text-slate-400">（虛線為大約分頁位置，實際以列印預覽為準）</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" size="sm" onClick={() => printWithTitle(base)}>
              🖨 列印／另存 PDF
            </Btn>
            <Btn size="sm" onClick={() => downloadText(`${base}.md`, resumeToMarkdown(resolved), "text/markdown")}>
              匯出 .md
            </Btn>
            <Btn size="sm" onClick={() => downloadText(`${base}.txt`, resumeToText(resolved), "text/plain", true)}>
              匯出 .txt
            </Btn>
            <Btn
              size="sm"
              onClick={async () => toast((await copyText(resumeToText(resolved))) ? "已複製純文字履歷" : "複製失敗，請改用匯出", "ok")}
            >
              複製文字
            </Btn>
          </div>
        </div>
        <div className="rounded-xl bg-slate-200/70 p-3 sm:p-5">
          <PaperPreview layout={L} onPages={setPages}>
            <ResumeDocument r={resolved} />
          </PaperPreview>
        </div>
        <p className="text-xs text-slate-400">
          小提示：在瀏覽器列印視窗請取消「頁首及頁尾」、並選擇「另存為 PDF」；邊距已由此處設定，請在列印視窗保持「預設」邊距。
        </p>
      </section>

      <PrintPortal layout={L}>
        <ResumeDocument r={resolved} />
      </PrintPortal>
    </div>
  );
}
