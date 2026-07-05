"use client";

import Link from "next/link";
import { REPORT_STATUS_COLORS, REPORT_STATUS_LABELS } from "@/lib/result-delivery-labels";
import type { TestReportView } from "@/types/result-delivery";
import { cn } from "@/lib/utils";

export function ReportsListClient({
  reports,
  partialOnly = false,
}: {
  reports: TestReportView[];
  partialOnly?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {partialOnly ? "Báo cáo phát hành một phần" : "Phiếu kết quả"}
          </h1>
          <p className="text-sm text-slate-500">
            {partialOnly
              ? "Các phiếu COA phát hành một phần theo phiếu yêu cầu"
              : "Danh sách phiếu kết quả thử nghiệm (COA)"}
          </p>
        </div>
        <div className="flex gap-2">
          {partialOnly ? (
            <Link href="/results-delivery/reports" className="rounded-xl border px-3 py-2 text-sm">
              Tất cả phiếu
            </Link>
          ) : (
            <Link
              href="/results-delivery/reports?partial=1"
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
            >
              Chỉ partial
            </Link>
          )}
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Mã phiếu</th>
              <th className="px-4 py-3">Mã mẫu / Phiếu</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3">Phiên bản</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Chưa có phiếu kết quả
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{r.reportCode}</td>
                  <td className="px-4 py-3">{r.sampleCode || r.requestCode || "—"}</td>
                  <td className="px-4 py-3">{r.customerName || "—"}</td>
                  <td className="px-4 py-3">
                    {r.isPartial ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                        Partial
                      </span>
                    ) : r.requestId && !r.sampleId ? (
                      <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs text-cyan-800">
                        Theo phiếu
                      </span>
                    ) : (
                      <span className="text-slate-500">Theo mẫu</span>
                    )}
                  </td>
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
