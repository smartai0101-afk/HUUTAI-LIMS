"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PreparationHistoryTimeline } from "@/components/preparation/PreparationHistoryTimeline";
import { PreparationTraceTree } from "@/components/preparation/PreparationTraceTree";
import { WorkflowStatusBadge } from "@/components/preparation/WorkflowStatusBadge";
import { useRole } from "@/components/RoleProvider";
import type { PreparationSummaryView } from "@/lib/services/preparation-traceability";
import { formatDate } from "@/lib/utils";

const TYPE_LABELS = {
  CHEMICAL: "Hóa chất pha chế",
  STANDARD: "Chuẩn pha chế",
  STRAIN: "Chủng pha chế",
} as const;

type Props = {
  summary: PreparationSummaryView;
};

export function PreparationDetailClient({ summary }: Props) {
  const { role } = useRole();
  const [tab, setTab] = useState<"Chi tiết" | "Lịch sử" | "Truy xuất">("Chi tiết");
  const tabs = ["Chi tiết", "Lịch sử", "Truy xuất"] as const;

  return (
    <AppShell>
      <div className="space-y-4">
        <Link
          href={summary.listHref}
          className="inline-flex items-center gap-2 text-sm text-sky-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">{TYPE_LABELS[summary.type]}</p>
              <h1 className="text-xl font-semibold text-slate-900">{summary.name}</h1>
              <p className="text-sm text-slate-600">{summary.code}</p>
            </div>
            <WorkflowStatusBadge status={summary.workflowStatus} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  tab === t
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {tab === "Lịch sử" ? (
              <PreparationHistoryTimeline
                preparationType={summary.type}
                preparationId={summary.id}
                role={role}
              />
            ) : tab === "Truy xuất" ? (
              <PreparationTraceTree
                preparationType={summary.type}
                preparationId={summary.id}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Phiên bản</p>
                  <p className="font-medium">v{summary.version}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Người pha</p>
                  <p className="font-medium">{summary.preparedBy || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Ngày pha chế</p>
                  <p className="font-medium">{formatDate(summary.preparedDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Ngày hết hạn</p>
                  <p className="font-medium">{formatDate(summary.expiryDate)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
