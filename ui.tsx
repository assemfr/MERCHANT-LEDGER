"use client";

import { useEffect, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-4xl" };
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`modal ${widths[size]}`} role="dialog" aria-modal="true">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#edf1ef] bg-white px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-[#172c27]">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-[#7b8c84]">{subtitle}</p>}
          </div>
          <button className="btn btn-icon btn-outline" onClick={onClose} aria-label="إغلاق"><X size={17} /></button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#eef5f2] text-[#0f766e]">{icon}</div>
      <h3 className="mt-4 font-bold text-[#243a33]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-6 text-[#84938c]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Toast({ message, kind }: { message: string; kind: "success" | "error" | null }) {
  if (!message) return null;
  return (
    <div className="no-print fixed bottom-6 left-6 z-[80] flex max-w-sm items-center gap-2 rounded-2xl border border-[#e0e9e4] bg-white px-4 py-3 text-sm font-semibold shadow-[0_12px_40px_rgba(12,45,35,.16)]">
      {kind === "error" ? <AlertCircle className="text-rose-600" size={18} /> : <CheckCircle2 className="text-[#0f766e]" size={18} />}
      <span className={kind === "error" ? "text-rose-700" : "text-[#243a33]"}>{message}</span>
    </div>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <LoaderCircle className="animate-spin" size={size} />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <div className="skeleton h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-2/5" />
            <div className="skeleton h-2.5 w-1/4" />
          </div>
          <div className="skeleton h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="skeleton h-9 w-52" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <div key={item} className="skeleton h-32 rounded-2xl" />)}
      </div>
      <div className="skeleton h-80 rounded-2xl" />
    </div>
  );
}
