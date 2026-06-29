"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  acceptAssignmentAction,
  rejectAssignmentAction,
} from "@/lib/actions/analysis";
import { INBOX_STATUS_LABEL } from "@/lib/analysis-labels";
import type { AnalysisInboxRow } from "@/types/analysis";

const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";

export function AnalysisInboxClient({ rows }: { rows: AnalysisInboxRow[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  function handleAccept(assignmentId: string) {
    setError("");
    startTransition(async () => {
      const result = await acceptAssignmentAction(assignmentId);
      if (result.error) setError(result.error);
    });
  }

  function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectId) return;
    setError("");
    const fd = new FormData();
    fd.set("assignmentId", rejectId);
    fd.set("rejectionReason", rejectReason);
    startTransition(async () => {
      const result = await rejectAssignmentAction(fd);
      if (result.error) setError(result.error);
      else {
        setRejectId(null);
        setRejectReason("");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Mẫu chờ lab tiếp nhận</h1>
        <p className="text-sm text-slate-500">Quản lý phòng tiếp nhận phân công từ Lab Manager</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Mã mẫu</th>
              <th className="px-4 py-3">Tên mẫu</th>
              <th className="px-4 py-3">Nhóm chỉ tiêu</th>
              <th className="px-4 py-3">Phòng ban</th>
              <th className="px-4 py-3">Quản lý phòng</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.assignmentId} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{row.sampleCode}</td>
                <td className="px-4 py-3">{row.sampleName}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{row.parameterGroup}</p>
                  <p className="text-xs text-slate-500">{row.parameters.join(" · ")}</p>
                </td>
                <td className="px-4 py-3">{row.departmentName}</td>
                <td className="px-4 py-3">{row.managerName}</td>
                <td className="px-4 py-3">
                  {new Date(row.dueDate).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-4 py-3">{INBOX_STATUS_LABEL}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleAccept(row.assignmentId)}
                      className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs text-white disabled:opacity-60"
                    >
                      Tiếp nhận
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setRejectId(row.assignmentId)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700"
                    >
                      Từ chối
                    </button>
                    <Link
                      href={`/samples/${row.sampleId}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Không có phân công chờ tiếp nhận.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {rejectId ? (
        <form onSubmit={handleReject} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-medium">Lý do từ chối</h2>
          <textarea
            required
            className={`${inputClass} min-h-24`}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="mt-3 flex gap-2">
            <button type="submit" disabled={pending} className="rounded-xl bg-red-600 px-4 py-2 text-sm text-white">
              Xác nhận từ chối
            </button>
            <button type="button" onClick={() => setRejectId(null)} className="rounded-xl border px-4 py-2 text-sm">
              Hủy
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
