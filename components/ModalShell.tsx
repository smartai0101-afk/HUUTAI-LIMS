"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/body-lock";
import { cn } from "@/lib/utils";

type ModalShellProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  zClass?: string;
  align?: "center" | "start";
};

export function ModalShell({
  open,
  onClose,
  children,
  className,
  zClass = "z-[80]",
  align = "center",
}: ModalShellProps) {
  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  if (!open) return null;

  const overlay = (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 flex p-4",
        align === "center" ? "items-center justify-center" : "items-start justify-center sm:p-6",
        zClass,
      )}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Đóng"
        className="pointer-events-auto absolute inset-0 bg-slate-950/50"
        onClick={onClose}
      />
      <div
        className={cn(
          "pointer-events-auto relative z-10 max-h-[90vh] w-full overflow-y-auto",
          className,
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
