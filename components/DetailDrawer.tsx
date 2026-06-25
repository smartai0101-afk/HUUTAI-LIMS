"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/body-lock";
import { cn } from "@/lib/utils";

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  subtitle?: string;
  title: string;
  actions?: ReactNode;
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  leftPanel?: ReactNode;
  tabContent: ReactNode;
  layout?: "split" | "stacked";
  maxWidth?: "5xl" | "7xl";
}

export function DetailDrawer({
  open,
  onClose,
  subtitle,
  title,
  actions,
  tabs,
  activeTab,
  onTabChange,
  leftPanel,
  tabContent,
  layout = "split",
  maxWidth = "7xl",
}: DetailDrawerProps) {
  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  if (!open) return null;

  const widthClass = maxWidth === "7xl" ? "max-w-7xl" : "max-w-5xl";

  const overlay = (
    <div
      className="pointer-events-none fixed inset-0 z-[70] flex items-start justify-center p-4 sm:p-6"
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
          "pointer-events-auto relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl",
          widthClass,
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {layout === "split" && leftPanel ? (
          <div className="grid gap-6 p-5 xl:grid-cols-[1.2fr_0.9fr]">
            <div className="space-y-4">{leftPanel}</div>
            <div className="rounded-2xl border border-slate-200">
              <TabBar tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
              <div className="p-4">{tabContent}</div>
            </div>
          </div>
        ) : (
          <>
            <TabBar tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} bordered />
            <div className="p-5">{tabContent}</div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

function TabBar({
  tabs,
  activeTab,
  onTabChange,
  bordered = false,
}: {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  bordered?: boolean;
}) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto px-3", bordered && "border-b border-slate-200")}>
      {tabs.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onTabChange(item)}
          className={cn(
            "whitespace-nowrap px-3 py-3 text-sm",
            activeTab === item
              ? "border-b-2 border-cyan-500 font-semibold text-slate-900"
              : "text-slate-500",
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
