"use client";

import { useState, useTransition } from "react";
import { saveQcCheckAction } from "@/lib/actions/analysis";
import { QC_CHECK_STATUS_LABELS, QC_CHECK_TYPE_LABELS } from "@/lib/analysis-labels";
import type { QcCheckType } from "@prisma/client";

const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";
const QC_TYPES = Object.keys(QC_CHECK_TYPE_LABELS) as QcCheckType[];

type TaskRow = {
  id: string;
  sampleCode: string;
  parameterGroup: string;
  departmentName: string;
  status: string;
};

export function QcClient({ tasks }: { tasks: TaskRow[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Record<string, { checkType: QcCheckType; status: string; note: string }>>({});

  function save(taskId: string) {
    const row = selected[taskId];
    if (!row) return;
    setError("");
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("checkType", row.checkType);
    fd.set("status", row.status);
    fd.set("note", row.note);
    startTransition(async () => {
      const r = await saveQcCheckAction(fd);
      if (r.error) setError(r.error);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kiểm tra QC</h1>
        <p className="text-sm text-slate-500">Đánh giá blank, CRM, recovery, RSD, …</p>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}
      <div className="space-y-3">
        {tasks.map((task) => {
          const row = selected[task.id] ?? { checkType: "blank" as QcCheckType, status: "pass", note: "" };
          return (
            <div key={task.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <p className="font-medium">{task.sampleCode} — {task.parameterGroup}</p>
              <p className="text-xs text-slate-500">{task.departmentName}</p>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
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
                    <option key={t} value={t}>{QC_CHECK_TYPE_LABELS[t]}</option>
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
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <button type="button" disabled={pending} onClick={() => save(task.id)} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm text-white">
                  Lưu QC
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
