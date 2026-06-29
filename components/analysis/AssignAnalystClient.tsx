"use client";

import { useState, useTransition } from "react";
import { assignAnalystAction } from "@/lib/actions/analysis";
import { ANALYSIS_TASK_STATUS_LABELS } from "@/lib/analysis-labels";
import type { AnalysisTaskView, DepartmentAnalystView } from "@/types/analysis";

const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";

type Props = {
  tasks: AnalysisTaskView[];
  analysts: DepartmentAnalystView[];
  departments: { id: string; name: string }[];
};

export function AssignAnalystClient({ tasks, analysts, departments }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Record<string, { analystId: string; dueDate: string }>>({});

  function handleAssign(taskId: string) {
    const row = selected[taskId];
    if (!row?.analystId || !row.dueDate) {
      setError("Chọn analyst và deadline nội bộ");
      return;
    }
    setError("");
    const fd = new FormData();
    fd.set("taskId", taskId);
    fd.set("analystId", row.analystId);
    fd.set("internalDueDate", row.dueDate);
    startTransition(async () => {
      const result = await assignAnalystAction(fd);
      if (result.error) setError(result.error);
    });
  }

  const analystsByDept = (deptId: string) => analysts.filter((a) => a.departmentId === deptId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Phân công analyst</h1>
        <p className="text-sm text-slate-500">Quản lý phòng giao việc cho analyst thực hiện</p>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Mã mẫu</th>
              <th className="px-4 py-3">Nhóm chỉ tiêu</th>
              <th className="px-4 py-3">Phòng ban</th>
              <th className="px-4 py-3">Analyst</th>
              <th className="px-4 py-3">Deadline nội bộ</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const deptAnalysts = analystsByDept(task.departmentId);
              const sel = selected[task.id] ?? { analystId: deptAnalysts[0]?.id ?? "", dueDate: "" };
              return (
                <tr key={task.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{task.sampleCode}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{task.parameterGroup}</p>
                    <p className="text-xs text-slate-500">{task.parameters.join(" · ")}</p>
                  </td>
                  <td className="px-4 py-3">{task.departmentName}</td>
                  <td className="px-4 py-3">
                    <select
                      className={inputClass}
                      value={sel.analystId}
                      onChange={(e) =>
                        setSelected((prev) => ({
                          ...prev,
                          [task.id]: { ...sel, analystId: e.target.value },
                        }))
                      }
                    >
                      <option value="">— Chọn —</option>
                      {deptAnalysts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      className={inputClass}
                      value={sel.dueDate}
                      onChange={(e) =>
                        setSelected((prev) => ({
                          ...prev,
                          [task.id]: { ...sel, dueDate: e.target.value },
                        }))
                      }
                    />
                  </td>
                  <td className="px-4 py-3">{ANALYSIS_TASK_STATUS_LABELS[task.status]}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleAssign(task.id)}
                      className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs text-white disabled:opacity-60"
                    >
                      Lưu
                    </button>
                  </td>
                </tr>
              );
            })}
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Không có task chờ phân công analyst.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Phòng ban: {departments.map((d) => d.name).join(" · ")}
      </p>
    </div>
  );
}
