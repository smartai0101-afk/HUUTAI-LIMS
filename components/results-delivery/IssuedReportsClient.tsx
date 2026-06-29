"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { REPORT_STATUS_LABELS } from "@/lib/result-delivery-labels";
import type { IssuedReportRow } from "@/types/result-delivery";

export function IssuedReportsClient({ rows }: { rows: IssuedReportRow[] }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.sampleCode.toLowerCase().includes(q) ||
        r.reportCode.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q),
    );
  }, [rows, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kết quả đã trả</h1>
        <p className="text-sm text-slate-500">Tra cứu và tải lại báo cáo đã phát hành</p>
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm mã mẫu, mã phiếu, khách hàng..."
        className="w-full max-w-md rounded-xl border px-3 py-2 text-sm"
      />
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Mã mẫu</th>
              <th className="px-4 py-3">Mã phiếu</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Ngày phát hành</th>
              <th className="px-4 py-3">Người phát hành</th>
              <th className="px-4 py-3">Phiên bản</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Tải lại</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Không có kết quả phù hợp
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{r.sampleCode}</td>
                  <td className="px-4 py-3">{r.reportCode}</td>
                  <td className="px-4 py-3">{r.customerName || "—"}</td>
                  <td className="px-4 py-3">{r.issueDate?.slice(0, 10) ?? "—"}</td>
                  <td className="px-4 py-3">{r.issuedBy || "—"}</td>
                  <td className="px-4 py-3">
                    v{r.reportVersion} · lần {r.issueNumber}
                  </td>
                  <td className="px-4 py-3">{REPORT_STATUS_LABELS[r.status]}</td>
                  <td className="px-4 py-3">
                    <Link href={`/results-delivery/reports/${r.id}`} className="text-cyan-700 hover:underline">
                      Mở báo cáo
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
