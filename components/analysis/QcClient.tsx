"use client";

import { useState, useTransition } from "react";
import { overrideQcFailAction, saveQcCheckAction } from "@/lib/actions/analysis";
import { QC_CHECK_STATUS_LABELS, QC_CHECK_TYPE_LABELS } from "@/lib/analysis-labels";
import type { QcCheckView } from "@/types/analysis";
import type { QcCheckType } from "@prisma/client";

const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";
const QC_TYPES = Object.keys(QC_CHECK_TYPE_LABELS) as QcCheckType[];

type TaskRow = {
  id: string;
  sampleCode: string;
  parameterGroup: string;
  departmentName: string;
  status: string;
  qcHistory: QcCheckView[];
};

export function QcClient({ tasks }: { tasks: TaskRow[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<
    Record<
      string,
      {
        checkType: QcCheckType;
        status: string;
        expectedValue: string;
        measuredValue: string;
        recoveryPercent: string;
        note: string;
      }
    >
  >({});
  const [overrideReason, setOverrideReason] = useState<Record<string, string>>({});

  function save(taskId: string) {
    const row = selected[taskId];
    if (!row) return;
    setError("");
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("checkType", row.checkType);
    fd.set("status", row.status);
    fd.set("expectedValue", row.expectedValue);
    fd.set("measuredValue", row.measuredValue);
    fd.set("recoveryPercent", row.recoveryPercent);
    fd.set("note", row.note);
    startTransition(async () => {
      const r = await saveQcCheckAction(fd);
      if (r.error) setError(r.error);
    });
  }

  function override(taskId: string) {
    const reason = overrideReason[taskId]?.trim();
    if (!reason) {
      setError("Bắt buộc nhập lý do override");
      return;
    }
    setError("");
    startTransition(async () => {
      const r = await overrideQcFailAction(taskId, reason);
      if (r.error) setError(r.error);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kiểm tra QC</h1>
        <p className="text-sm text-slate-500">Đánh giá blank, CRM, recovery, RSD với giá trị đo có cấu trúc</p>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}
      <div className="space-y-3">
        {tasks.map((task) => {
          const row = selected[task.id] ?? {
            checkType: "blank" as QcCheckType,
            status: "pass",
            expectedValue: "",
            measuredValue: "",
            recoveryPercent: "",
            note: "",
          };
          const hasFail = task.qcHistory.some((c) => c.status === "fail");
          return (
            <div key={task.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="font-medium">
                {task.sampleCode} — {task.parameterGroup}
              </p>
              <p className="text-xs text-slate-500">
                {task.departmentName} · {task.status}
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                <select
                  className={inputClass}
                  value={row.checkType}
                  onChange={(e) =>
                    setSelected((p) => ({
                      ...p,
                      [task.id]: { ...row, checkType: e.target.value as QcCheckType },
                    }))
                  }
                >
                  {QC_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {QC_CHECK_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <select
                  className={inputClass}
                  value={row.status}
                  onChange={(e) =>
                    setSelected((p) => ({ ...p, [task.id]: { ...row, status: e.target.value } }))
                  }
                >
                  {Object.entries(QC_CHECK_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <input
                  className={inputClass}
                  placeholder="Giá trị chuẩn"
                  value={row.expectedValue}
                  onChange={(e) =>
                    setSelected((p) => ({ ...p, [task.id]: { ...row, expectedValue: e.target.value } }))
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Giá trị đo"
                  value={row.measuredValue}
                  onChange={(e) =>
                    setSelected((p) => ({ ...p, [task.id]: { ...row, measuredValue: e.target.value } }))
                  }
                />
                <input
                  className={inputClass}
                  placeholder="% Recovery"
                  value={row.recoveryPercent}
                  onChange={(e) =>
                    setSelected((p) => ({
                      ...p,
                      [task.id]: { ...row, recoveryPercent: e.target.value },
                    }))
                  }
                />
                <input
                  className={`${inputClass} md:col-span-2`}
                  placeholder="Ghi chú"
                  value={row.note}
                  onChange={(e) =>
                    setSelected((p) => ({ ...p, [task.id]: { ...row, note: e.target.value } }))
                  }
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => save(task.id)}
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-sm text-white"
                >
                  Lưu QC
                </button>
              </div>
              {hasFail ? (
                <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <input
                    className={`${inputClass} max-w-md flex-1`}
                    placeholder="Lý do override (manager)"
                    value={overrideReason[task.id] ?? ""}
                    onChange={(e) =>
                      setOverrideReason((p) => ({ ...p, [task.id]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => override(task.id)}
                    className="rounded-xl border border-amber-400 px-4 py-2 text-sm text-amber-900"
                  >
                    Override QC fail
                  </button>
                </div>
              ) : null}
              {task.qcHistory.length > 0 ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="py-1 pr-3">Loại</th>
                        <th className="py-1 pr-3">Kết quả</th>
                        <th className="py-1 pr-3">Chuẩn / Đo</th>
                        <th className="py-1 pr-3">Recovery</th>
                        <th className="py-1 pr-3">Người kiểm</th>
                        <th className="py-1">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {task.qcHistory.map((h) => (
                        <tr key={h.id} className="border-t border-slate-100">
                          <td className="py-1 pr-3">{QC_CHECK_TYPE_LABELS[h.checkType]}</td>
                          <td className="py-1 pr-3">{QC_CHECK_STATUS_LABELS[h.status]}</td>
                          <td className="py-1 pr-3">
                            {h.expectedValue || "—"} / {h.measuredValue || "—"}
                          </td>
                          <td className="py-1 pr-3">{h.recoveryPercent || "—"}</td>
                          <td className="py-1 pr-3">{h.checkedBy}</td>
                          <td className="py-1">{h.checkedAt.slice(0, 16).replace("T", " ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
