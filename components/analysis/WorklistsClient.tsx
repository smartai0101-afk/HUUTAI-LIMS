"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createWorklistAction, completeWorklistAction, startWorklistAction } from "@/lib/actions/analysis";
import { WORKLIST_STATUS_LABELS } from "@/lib/analysis-labels";
import type { AnalysisTaskView, WorklistView } from "@/types/analysis";

const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";

type Props = {
  worklists: WorklistView[];
  departments: { id: string; name: string }[];
  methods: { id: string; methodCode: string; methodName: string; versionId: string | null }[];
  equipment: { id: string; code: string; name: string }[];
  analysts: { id: string; name: string; departmentId: string }[];
  availableTasks: AnalysisTaskView[];
};

export function WorklistsClient({
  worklists,
  departments,
  methods,
  equipment,
  analysts,
  availableTasks,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "");
  const [methodId, setMethodId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [analystId, setAnalystId] = useState("");
  const [taskIds, setTaskIds] = useState<string[]>([]);

  const deptTasks = useMemo(
    () => availableTasks.filter((t) => t.departmentId === departmentId),
    [availableTasks, departmentId],
  );
  const deptAnalysts = useMemo(
    () => analysts.filter((a) => a.departmentId === departmentId),
    [analysts, departmentId],
  );

  function toggleTask(id: string) {
    setTaskIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.set("departmentId", departmentId);
    fd.set("methodId", methodId);
    fd.set("equipmentId", equipmentId);
    fd.set("analystId", analystId);
    fd.set("taskIds", JSON.stringify(taskIds));
    startTransition(async () => {
      const result = await createWorklistAction(fd);
      if (result.error) setError(result.error);
      else {
        setShowForm(false);
        router.refresh();
      }
    });
  }

  function handleStart(id: string) {
    startTransition(async () => {
      const result = await startWorklistAction(id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleComplete(id: string) {
    startTransition(async () => {
      const result = await completeWorklistAction(id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Worklist</h1>
          <p className="text-sm text-slate-500">Gom mẫu/chỉ tiêu cùng phương pháp để chạy</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-cyan-600 px-4 py-2 text-sm text-white"
        >
          + Tạo worklist
        </button>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {showForm ? (
        <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Phòng ban</span>
            <select className={inputClass} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Phương pháp</span>
            <select required className={inputClass} value={methodId} onChange={(e) => setMethodId(e.target.value)}>
              <option value="">— Chọn —</option>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>{m.methodCode} — {m.methodName}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Thiết bị</span>
            <select required className={inputClass} value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)}>
              <option value="">— Chọn —</option>
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.code} — {eq.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Analyst</span>
            <select required className={inputClass} value={analystId} onChange={(e) => setAnalystId(e.target.value)}>
              <option value="">— Chọn —</option>
              {deptAnalysts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>
          <div className="text-sm">
            <span className="mb-2 block font-medium">Task</span>
            <div className="space-y-1 rounded-xl border p-3">
              {deptTasks.map((t) => (
                <label key={t.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={taskIds.includes(t.id)} onChange={() => toggleTask(t.id)} />
                  {t.sampleCode} — {t.parameterGroup}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm text-white">
              Tạo
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border px-4 py-2 text-sm">
              Hủy
            </button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        {worklists.map((wl) => (
          <div key={wl.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{wl.worklistCode}</p>
                <p className="text-sm text-slate-600">
                  {wl.departmentName} · {wl.methodName || "—"} · {wl.equipmentName || "—"}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                {WORKLIST_STATUS_LABELS[wl.status]}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{wl.taskCount} task · {wl.analystName}</p>
            <div className="mt-3 flex gap-2">
              {wl.status === "created" ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleStart(wl.id)}
                  className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs text-white"
                >
                  Bắt đầu chạy
                </button>
              ) : null}
              {wl.status === "running" ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleComplete(wl.id)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white"
                >
                  Hoàn thành
                </button>
              ) : null}
              <Link href={`/analysis/worklists/${wl.id}`} className="rounded-lg border px-3 py-1.5 text-xs">
                Chi tiết
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
