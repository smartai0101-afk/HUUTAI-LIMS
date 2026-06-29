"use client";

import Link from "next/link";
import { REPORT_STATUS_COLORS, REPORT_STATUS_LABELS } from "@/lib/result-delivery-labels";
import type { TestReportView } from "@/types/result-delivery";
import { cn } from "@/lib/utils";

export function ReportsListClient({ reports }: { reports: TestReportView[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Phiếu kết quả</h1>
        <p className="text-sm text-slate-500">Danh sách phiếu kết quả thử nghiệm (COA)</p>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Mã phiếu</th>
              <th className="px-4 py-3">Mã mẫu</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Phiên bản</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Chưa có phiếu kết quả
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{r.reportCode}</td>
                  <td className="px-4 py-3">{r.sampleCode}</td>
                  <td className="px-4 py-3">{r.customerName || "—"}</td>
                  <td className="px-4 py-3">
                    v{r.reportVersion} · lần {r.issueNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        REPORT_STATUS_COLORS[r.status],
                      )}
                    >
                      {REPORT_STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/results-delivery/reports/${r.id}`}
                      className="text-cyan-700 hover:underline"
                    >
                      Chi tiết / Phát hành
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
