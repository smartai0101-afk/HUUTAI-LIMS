"use client";

import { useState, useTransition } from "react";
import {
  approveTaskAction,
  rejectTaskAction,
  requestRerunAction,
  submitForReviewAction,
} from "@/lib/actions/analysis";
import {
  ANALYSIS_TASK_STATUS_LABELS,
  QC_CHECK_STATUS_LABELS,
  TEST_RESULT_STATUS_LABELS,
} from "@/lib/analysis-labels";
import type { ReviewRowView } from "@/types/analysis";

export function ReviewClient({ rows }: { rows: ReviewRowView[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function run(fn: () => Promise<{ error?: string }>) {
    setError("");
    startTransition(async () => {
      const r = await fn();
      if (r.error) setError(r.error);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kết quả chờ duyệt</h1>
        <p className="text-sm text-slate-500">Reviewer / Lab Manager / QA duyệt kết quả</p>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Mã mẫu</th>
              <th className="px-4 py-3">Chỉ tiêu</th>
              <th className="px-4 py-3">Kết quả</th>
              <th className="px-4 py-3">Analyst</th>
              <th className="px-4 py-3">QC</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.taskId} className="border-t border-slate-100">
                <td className="px-4 py-3">{row.sampleCode}</td>
                <td className="px-4 py-3">
                  <p>{row.parameterGroup}</p>
                  <p className="text-xs text-slate-500">{row.parameters.join(" · ")}</p>
                </td>
                <td className="px-4 py-3">
                  {row.results.map((r) => (
                    <p key={r.id} className="text-xs">
                      {r.parameterName}: {r.resultValue || "—"} {r.unit}
                    </p>
                  ))}
                </td>
                <td className="px-4 py-3">{row.analystName}</td>
                <td className="px-4 py-3">
                  {row.qcStatus ? QC_CHECK_STATUS_LABELS[row.qcStatus] : "—"}
                </td>
                <td className="px-4 py-3">{ANALYSIS_TASK_STATUS_LABELS[row.taskStatus]}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {row.taskStatus !== "submitted_for_review" ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(() => submitForReviewAction(row.taskId))}
                        className="rounded border px-2 py-1 text-xs"
                      >
                        Gửi duyệt
                      </button>
                    ) : null}
                    <button type="button" disabled={pending} onClick={() => run(() => approveTaskAction(row.taskId))} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">
                      Duyệt
                    </button>
                    <button type="button" disabled={pending} onClick={() => run(() => rejectTaskAction(row.taskId, "Trả về chỉnh sửa"))} className="rounded border px-2 py-1 text-xs">
                      Trả về
                    </button>
                    <button type="button" disabled={pending} onClick={() => run(() => requestRerunAction(row.taskId, "Chạy lại"))} className="rounded border px-2 py-1 text-xs">
                      Chạy lại
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Không có kết quả chờ duyệt.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
