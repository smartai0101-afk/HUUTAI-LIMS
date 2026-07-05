"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { fetchSamplePrepChecklistAction } from "@/lib/actions/analysis";

type TaskRow = Awaited<
  ReturnType<typeof import("@/lib/services/analysis/sample-prep").listSamplePrepTasks>
>[number];

type Checklist = {
  taskId: string;
  sampleCode: string;
  sampleName: string;
  parameterGroup: string;
  methodName: string;
  preservationCondition: string;
  containerType: string;
  prepSteps: string[];
};

type Props = {
  tasks: TaskRow[];
};

export function SamplePrepClient({ tasks }: Props) {
  const [pending, startTransition] = useTransition();
  const [checklist, setChecklist] = useState<Checklist | null>(null);

  function loadChecklist(taskId: string) {
    startTransition(async () => {
      const result = await fetchSamplePrepChecklistAction(taskId);
      if ("checklist" in result && result.checklist) {
        setChecklist(result.checklist as Checklist);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Chuẩn bị mẫu</h1>
        <p className="text-sm text-slate-500">Checklist chuẩn bị mẫu theo SOP trước worksheet</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Mã mẫu</th>
                <th className="px-4 py-3">Nhóm</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => loadChecklist(task.id)}
                      className="font-medium text-cyan-700 hover:underline disabled:opacity-50"
                    >
                      {task.sampleCode}
                    </button>
                  </td>
                  <td className="px-4 py-3">{task.parameterGroup}</td>
                  <td className="px-4 py-3">{task.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          {checklist ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{checklist.sampleCode}</h2>
                <p className="text-sm text-slate-500">{checklist.sampleName}</p>
              </div>
              <div className="text-sm text-slate-600">
                <p>Phương pháp: {checklist.methodName}</p>
                <p>Bảo quản: {checklist.preservationCondition || "—"}</p>
                <p>Bao bì: {checklist.containerType || "—"}</p>
              </div>
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                {checklist.prepSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <Link
                href="/analysis/worksheets"
                className="inline-flex rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white"
              >
                Tiếp tục → Worksheet
              </Link>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Chọn mẫu để xem checklist chuẩn bị.</p>
          )}
        </div>
      </div>
    </div>
  );
}
