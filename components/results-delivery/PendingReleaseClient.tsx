"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  createReportAction,
  issueReportAction,
} from "@/lib/actions/results-delivery";
import type { PendingReleaseRow } from "@/types/result-delivery";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

export function PendingReleaseClient({ rows }: { rows: PendingReleaseRow[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function run(fn: () => Promise<{ error?: string; reportId?: string }>) {
    setError("");
    startTransition(async () => {
      const r = await fn();
      if (r.error) setError(r.error);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kết quả chờ phát hành</h1>
        <p className="text-sm text-slate-500">
          Mẫu đã QC đạt và duyệt xong — tạo phiếu kết quả rồi phát hành
        </p>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Mã mẫu</th>
              <th className="px-4 py-3">Tên mẫu</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Ngày tiếp nhận</th>
              <th className="px-4 py-3">Ngày hoàn thành</th>
              <th className="px-4 py-3">Analyst</th>
              <th className="px-4 py-3">Reviewer</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  Không có mẫu chờ phát hành
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.sampleId} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{row.sampleCode}</td>
                  <td className="px-4 py-3">{row.sampleName}</td>
                  <td className="px-4 py-3">{row.customerName || "—"}</td>
                  <td className="px-4 py-3">{formatDate(row.receivedAt)}</td>
                  <td className="px-4 py-3">{formatDate(row.completedAt)}</td>
                  <td className="px-4 py-3">{row.analystNames || "—"}</td>
                  <td className="px-4 py-3">{row.reviewerName}</td>
                  <td className="px-4 py-3">{formatDate(row.dueDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/samples/${row.sampleId}`}
                        className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
                      >
                        Xem kết quả
                      </Link>
                      {!row.hasDraftReport ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => run(() => createReportAction(row.sampleId))}
                          className="rounded bg-cyan-600 px-2 py-1 text-xs text-white"
                        >
                          Tạo phiếu
                        </button>
                      ) : (
                        <Link
                          href={`/results-delivery/reports/${row.draftReportId}`}
                          className="rounded border px-2 py-1 text-xs hover:bg-slate-50"
                        >
                          Xem phiếu
                        </Link>
                      )}
                      {row.readyToIssue && row.draftReportId ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => run(() => issueReportAction(row.draftReportId!))}
                          className="rounded bg-emerald-600 px-2 py-1 text-xs text-white"
                        >
                          Phát hành
                        </button>
                      ) : null}
                    </div>
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
