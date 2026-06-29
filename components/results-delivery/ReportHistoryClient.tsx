"use client";

import Link from "next/link";
import { REPORT_HISTORY_ACTION_LABELS } from "@/lib/result-delivery-labels";
import type { ReportHistoryView } from "@/types/result-delivery";

export function ReportHistoryClient({ rows }: { rows: ReportHistoryView[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Lịch sử phát hành</h1>
        <p className="text-sm text-slate-500">Audit trail phiên bản báo cáo — không ghi đè</p>
      </div>
      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có lịch sử phát hành</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {row.reportCode} · v{row.version} · lần {row.issueNumber}
                  </p>
                  <p className="text-sm text-slate-500">
                    {row.sampleCode} · {REPORT_HISTORY_ACTION_LABELS[row.action]}
                  </p>
                </div>
                <p className="text-sm text-slate-600">{row.actionAt.slice(0, 16).replace("T", " ")}</p>
              </div>
              <p className="mt-2 text-sm">
                {row.actionBy}
                {row.reason ? ` — ${row.reason}` : ""}
              </p>
              <Link
                href={`/results-delivery/reports/${row.reportId}`}
                className="mt-2 inline-block text-sm text-cyan-700 hover:underline"
              >
                Xem phiếu
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
