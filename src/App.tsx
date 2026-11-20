import { StoreProvider, useStore } from "./store";
import { FeedbackProvider, useFeedback } from "./components/feedback";
import Header from "./components/Header";
import { Btn } from "./components/ui";
import VersionsTab from "./tabs/VersionsTab";
import MasterTab from "./tabs/MasterTab";
import ComposeTab from "./tabs/ComposeTab";
import TailorTab from "./tabs/TailorTab";
import ResumeTab from "./tabs/ResumeTab";
import CoverTab from "./tabs/CoverTab";
import PortfolioTab from "./tabs/PortfolioTab";
import DiffTab from "./tabs/DiffTab";
import DataTab from "./tabs/DataTab";

function SampleBanner() {
  const { data, resetToBlank, mutate } = useStore();
  const { confirm, toast } = useFeedback();
  if (!data.isSample) return null;
  return (
    <div className="no-print border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm text-amber-900">
        <span>
          📋 目前載入的是<b>示範資料</b>（虛構人物），可自由試玩版本切換、JD 比對與匯出。
        </span>
        <div className="flex gap-2">
          <Btn
            size="sm"
            variant="primary"
            onClick={async () => {
              if (await confirm({ title: "切換至空白個人資料？", message: "示範資料會被清除，從空白母版開始建立你自己的內容。", confirmText: "切換至空白", danger: true })) {
                resetToBlank();
                toast("已切換至空白資料，請先填寫母版基本資料");
              }
            }}
          >
            切換至空白個人資料
          </Btn>
          <Btn size="sm" onClick={() => mutate((d) => void (d.isSample = false))}>
            保留並關閉提示
          </Btn>
        </div>
      </div>
    </div>
  );
}

function Shell() {
  const { tab } = useStore();
  return (
    <div className="min-h-screen">
      <Header />
      <SampleBanner />
      <main className="mx-auto max-w-[1500px] px-4 py-5">
        {tab === "versions" && <VersionsTab />}
        {tab === "master" && <MasterTab />}
        {tab === "compose" && <ComposeTab />}
        {tab === "tailor" && <TailorTab />}
        {tab === "resume" && <ResumeTab />}
        {tab === "cover" && <CoverTab />}
        {tab === "portfolio" && <PortfolioTab />}
        {tab === "diff" && <DiffTab />}
        {tab === "data" && <DataTab />}
      </main>
      <footer className="no-print mx-auto max-w-[1500px] px-4 pb-8 text-center text-xs text-slate-400">
        純前端本地處理 · 無伺服器 · 無外部 API · 資料只儲存在此瀏覽器
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <FeedbackProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </FeedbackProvider>
  );
}
