import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Btn } from "./ui";

interface ConfirmOpts {
  title: string;
  message?: ReactNode;
  confirmText?: string;
  danger?: boolean;
}

interface Toast {
  id: number;
  msg: string;
  kind: "ok" | "err" | "info";
}

interface Ctx {
  toast: (msg: string, kind?: Toast["kind"]) => void;
  confirm: (opts: ConfirmOpts) => Promise<boolean>;
}

const FeedbackCtx = createContext<Ctx | null>(null);

export function useFeedback(): Ctx {
  const c = useContext(FeedbackCtx);
  if (!c) throw new Error("FeedbackProvider missing");
  return c;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dlg, setDlg] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const idRef = useRef(1);

  const toast = useCallback((msg: string, kind: Toast["kind"] = "ok") => {
    const id = idRef.current++;
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOpts) => new Promise<boolean>((resolve) => setDlg({ ...opts, resolve })),
    [],
  );

  const close = (v: boolean) => {
    dlg?.resolve(v);
    setDlg(null);
  };

  useEffect(() => {
    if (!dlg) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dlg.resolve(false);
        setDlg(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dlg]);

  return (
    <FeedbackCtx.Provider value={{ toast, confirm }}>
      {children}
      <div className="no-print pointer-events-none fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg ${
              t.kind === "err" ? "bg-rose-600" : t.kind === "info" ? "bg-slate-700" : "bg-emerald-600"
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
      {dlg && (
        <div className="no-print fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => close(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3 className="text-base font-semibold text-slate-900">{dlg.title}</h3>
            {dlg.message && <div className="mt-2 text-sm leading-relaxed text-slate-600">{dlg.message}</div>}
            <div className="mt-5 flex justify-end gap-2">
              <Btn onClick={() => close(false)}>取消</Btn>
              <Btn variant={dlg.danger ? "danger" : "primary"} onClick={() => close(true)} autoFocus>
                {dlg.confirmText ?? "確定"}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </FeedbackCtx.Provider>
  );
}
