import { useRef } from "react";
import { useStore } from "../store";
import { useFeedback } from "../components/feedback";
import { Btn, Card, SectionTitle } from "../components/ui";
import { makeBackup, parseBackup, storageSizeKB } from "../lib/storage";
import { downloadText, formatTime, todayString } from "../lib/util";

export default function DataTab() {
  const { data, savedAt, replaceData, resetToBlank, loadSample, clearAll, flushSave, saveError } = useStore();
  const { confirm, toast } = useFeedback();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    downloadText(`resume-tailorer-backup-${todayString()}.json`, makeBackup(data), "application/json");
    toast("已匯出完整備份 JSON");
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const imported = parseBackup(text);
      const ok = await confirm({
        title: "匯入並還原備份？",
        message: (
          <>
            會以備份內容<b>取代目前所有資料</b>（母版 + {data.versions.length} 個版本）。備份內含 {imported.versions.length} 個版本、{imported.master.experiences.length} 段經驗。
            建議先匯出目前資料作備份。
          </>
        ),
        confirmText: "匯入並取代",
        danger: true,
      });
      if (ok) {
        replaceData(imported);
        toast("已還原備份");
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "匯入失敗", "err");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <SectionTitle title="本地儲存狀態" />
        <Card className="grid gap-4 p-4 sm:grid-cols-4">
          <Info label="儲存位置" value="瀏覽器 localStorage" />
          <Info label="佔用空間" value={`${storageSizeKB()} KB`} />
          <Info label="最後儲存" value={formatTime(savedAt)} />
          <Info label="版本數" value={`${data.versions.length} 個`} />
        </Card>
        {saveError && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">⚠ 儲存失敗：{saveError}。請立即匯出 JSON 備份。</p>}
        <div className="mt-2">
          <Btn size="sm" onClick={() => { flushSave(); toast("已立即儲存"); }}>
            立即儲存
          </Btn>
        </div>
      </section>

      <section>
        <SectionTitle title="備份與還原" desc="JSON 備份包含母版素材庫、所有版本、覆寫、JD 及版面設定。" />
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <Btn variant="primary" onClick={exportBackup}>⬇ 匯出完整 JSON 備份</Btn>
          <Btn onClick={() => fileRef.current?.click()}>⬆ 匯入並還原…</Btn>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </Card>
      </section>

      <section>
        <SectionTitle title="資料來源" />
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <Btn
            onClick={async () => {
              if (await confirm({ title: "載入示範資料？", message: "會取代目前所有資料（母版與版本）。", confirmText: "載入示範", danger: true })) {
                loadSample();
                toast("已載入示範資料");
              }
            }}
          >
            載入示範資料
          </Btn>
          <Btn
            onClick={async () => {
              if (await confirm({ title: "切換至空白個人資料？", message: "會取代目前所有資料，從空白母版開始。建議先匯出備份。", confirmText: "切換至空白", danger: true })) {
                resetToBlank();
                toast("已切換至空白資料");
              }
            }}
          >
            切換至空白個人資料
          </Btn>
        </Card>
      </section>

      <section>
        <SectionTitle title="共用電腦？一鍵清除" />
        <Card className="border-rose-200 bg-rose-50/40 p-4">
          <p className="mb-3 text-sm text-slate-600">會永久刪除此瀏覽器中儲存的所有履歷資料、版本與 JD，並移除 localStorage 內的紀錄。此操作無法復原。</p>
          <Btn
            variant="danger"
            onClick={async () => {
              if (
                await confirm({
                  title: "清空所有資料？",
                  message: "母版素材庫、所有求職版本、JD 與設定都會被永久刪除。如需保留，請先匯出 JSON 備份。",
                  confirmText: "確認清空",
                  danger: true,
                })
              ) {
                clearAll();
                toast("已清空所有本地資料", "info");
              }
            }}
          >
            🗑 一鍵清空所有資料
          </Btn>
        </Card>
      </section>

      <section>
        <SectionTitle title="私隱說明" />
        <Card className="space-y-1.5 p-4 text-sm text-slate-600">
          <p>• 本工具 100% 在瀏覽器本地運行，沒有後端伺服器，也不呼叫任何外部 API／AI 服務。</p>
          <p>• 你的個人資料、經歷、聯絡方法及 JD 只存放於此瀏覽器的 localStorage。</p>
          <p>• 不會自動產生公開連結或上傳雲端；列印、匯出與分享完全由你決定。</p>
          <p>• 使用無痕模式或換瀏覽器時資料不會同步，請定期匯出 JSON 備份。</p>
        </Card>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}
