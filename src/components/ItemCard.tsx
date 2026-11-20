import { useState, type ReactNode } from "react";
import { IconBtn } from "./ui";
import { cn } from "../utils/cn";

export function ItemCard({
  title,
  subtitle,
  badges,
  defaultOpen = false,
  onUp,
  onDown,
  onDuplicate,
  onDelete,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  defaultOpen?: boolean;
  onUp?: () => void;
  onDown?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-1 px-3 py-2">
        <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span className={cn("text-xs text-slate-400 transition-transform", open && "rotate-90")}>▶</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-slate-900">{title}</span>
            {subtitle && <span className="block truncate text-xs text-slate-500">{subtitle}</span>}
          </span>
          {badges && <span className="hidden shrink-0 items-center gap-1 sm:flex">{badges}</span>}
        </button>
        {onUp && <IconBtn title="上移" onClick={onUp}>↑</IconBtn>}
        {onDown && <IconBtn title="下移" onClick={onDown}>↓</IconBtn>}
        {onDuplicate && <IconBtn title="複製" onClick={onDuplicate}>⧉</IconBtn>}
        {onDelete && <IconBtn title="刪除" onClick={onDelete} danger>✕</IconBtn>}
      </div>
      {open && <div className="border-t border-slate-100 p-3">{children}</div>}
    </div>
  );
}
