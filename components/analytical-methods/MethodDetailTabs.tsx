"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { METHODS_NAV, METHOD_VERSION_STATUS_LABELS } from "@/lib/analytical-methods-labels";
import type { AnalyticalMethodDetail } from "@/types/analytical-methods";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "overview", label: "Tổng quan", href: (id: string) => `/analytical-methods/${id}` },
  { key: "documents", label: METHODS_NAV.documents, href: (id: string) => `/analytical-methods/${id}/documents` },
  { key: "workflow", label: METHODS_NAV.workflow, href: (id: string) => `/analytical-methods/${id}/workflow` },
  { key: "checklist", label: METHODS_NAV.checklist, href: (id: string) => `/analytical-methods/${id}/checklist` },
  { key: "qc", label: METHODS_NAV.qc, href: (id: string) => `/analytical-methods/${id}/qc` },
  { key: "reagents", label: METHODS_NAV.reagents, href: (id: string) => `/analytical-methods/${id}/reagents` },
  { key: "equipment", label: METHODS_NAV.equipment, href: (id: string) => `/analytical-methods/${id}/equipment` },
  { key: "approvals", label: METHODS_NAV.approvals, href: (id: string) => `/analytical-methods/${id}/approvals` },
] as const;

type Props = {
  method: AnalyticalMethodDetail;
  children: React.ReactNode;
};

export function MethodDetailTabs({ method, children }: Props) {
  const pathname = usePathname();
  const base = `/analytical-methods/${method.id}`;
  const status = method.currentVersion?.status;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {method.methodCode} — {method.methodName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            v{method.currentVersion?.version ?? "-"} ·{" "}
            {status ? METHOD_VERSION_STATUS_LABELS[status] : "Chưa có phiên bản"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-1">
        {TABS.map((tab) => {
          const href = tab.href(method.id);
          const isActive =
            tab.key === "overview" ? pathname === base : pathname.startsWith(href);
          return (
            <Link
              key={tab.key}
              href={href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm transition-colors",
                isActive ? "bg-cyan-50 font-medium text-cyan-800" : "text-slate-600 hover:bg-slate-50",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
