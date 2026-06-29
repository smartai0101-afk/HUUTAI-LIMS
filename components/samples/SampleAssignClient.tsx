"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { assignAnalysisGroupsAction } from "@/lib/actions/samples";
import { ANALYSIS_ASSIGNMENT_STATUS_LABELS } from "@/lib/sample-labels";
import { suggestDepartmentForParameters } from "@/lib/parameter-department-hints";
import type {
  AnalysisAssignmentView,
  LabDepartmentView,
  SampleAssignmentContext,
  SampleListItem,
} from "@/types/samples";

type Props = {
  samples: SampleListItem[];
  departments: LabDepartmentView[];
  initialContext: SampleAssignmentContext | null;
  initialSampleId?: string;
};

type GroupRow = {
  id?: string;
  parameterGroup: string;
  parameters: string[];
  departmentId: string;
  managerId: string;
  dueDate: string;
  status: AnalysisAssignmentView["status"];
  note: string;
};

const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";

function toDateInputValue(iso?: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function emptyGroup(): GroupRow {
  return {
    parameterGroup: "",
    parameters: [],
    departmentId: "",
    managerId: "",
    dueDate: "",
    status: "assigned",
    note: "",
  };
}

function assignmentsToGroups(assignments: AnalysisAssignmentView[]): GroupRow[] {
  if (assignments.length === 0) return [emptyGroup()];
  return assignments.map((a) => ({
    id: a.id,
    parameterGroup: a.parameterGroup,
    parameters: a.parameters,
    departmentId: a.departmentId,
    managerId: a.managerId,
    dueDate: toDateInputValue(a.dueDate),
    status: a.status,
    note: a.note,
  }));
}

function pickDefaultManager(dept: LabDepartmentView | undefined): string {
  if (!dept || dept.managers.length === 0) return "";
  if (dept.managers.length === 1) return dept.managers[0]!.id;
  const preferred = dept.managers.find((m) => m.isDefault);
  return preferred?.id ?? dept.managers[0]!.id;
}

export function SampleAssignClient({
  samples,
  departments,
  initialContext,
  initialSampleId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sampleId = searchParams.get("sampleId") ?? initialSampleId ?? samples[0]?.id ?? "";
  const selectedSample = useMemo(
    () => samples.find((s) => s.id === sampleId) ?? samples[0],
    [samples, sampleId],
  );

  const contextMatchesSample = initialContext?.sampleId === sampleId;
  const parameterPool = contextMatchesSample ? initialContext.parameterPool : [];
  const [groups, setGroups] = useState<GroupRow[]>(() =>
    contextMatchesSample ? assignmentsToGroups(initialContext.assignments) : [emptyGroup()],
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (contextMatchesSample) {
      setGroups(assignmentsToGroups(initialContext!.assignments));
    } else {
      setGroups([emptyGroup()]);
    }
  }, [contextMatchesSample, initialContext]);

  const departmentNames = useMemo(() => departments.map((d) => d.name), [departments]);

  const usedParameters = useMemo(() => {
    const used = new Set<string>();
    for (const group of groups) {
      for (const p of group.parameters) used.add(p);
    }
    return used;
  }, [groups]);

  function updateGroup(index: number, patch: Partial<GroupRow>) {
    setGroups((prev) => {
      const next = [...prev];
      const current = next[index]!;
      const updated = { ...current, ...patch };

      if (patch.departmentId !== undefined && patch.departmentId !== current.departmentId) {
        const dept = departments.find((d) => d.id === patch.departmentId);
        updated.managerId = pickDefaultManager(dept);
      }

      if (patch.parameters !== undefined) {
        const suggested = suggestDepartmentForParameters(patch.parameters, departmentNames);
        if (suggested && !updated.departmentId) {
          const dept = departments.find((d) => d.name === suggested);
          if (dept) {
            updated.departmentId = dept.id;
            updated.managerId = pickDefaultManager(dept);
          }
        }
      }

      next[index] = updated;
      return next;
    });
  }

  function toggleParameter(groupIndex: number, parameter: string) {
    const group = groups[groupIndex];
    if (!group) return;
    const has = group.parameters.includes(parameter);
    const nextParams = has
      ? group.parameters.filter((p) => p !== parameter)
      : [...group.parameters, parameter];
    updateGroup(groupIndex, { parameters: nextParams });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSample) return;
    setError("");
    setMessage("");

    const fd = new FormData();
    fd.set("sampleId", selectedSample.id);
    fd.set("groups", JSON.stringify(groups));

    startTransition(async () => {
      const result = await assignAnalysisGroupsAction(fd);
      if (result.error) setError(result.error);
      else {
        setMessage("Đã phân công phân tích");
        router.push(`/samples/${selectedSample.id}`);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Phân công phân tích</h1>
        <p className="text-sm text-slate-500">
          Lab Manager giao nhóm chỉ tiêu cho phòng chuyên môn
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block max-w-xl text-sm">
          <span className="mb-1 block font-medium">Chọn mẫu *</span>
          <select
            required
            className={inputClass}
            value={selectedSample?.id ?? ""}
            onChange={(e) => router.push(`/samples/assign?sampleId=${e.target.value}`)}
          >
            {samples.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sampleCode} — {s.sampleName}
              </option>
            ))}
          </select>
        </label>

        {parameterPool.length > 0 ? (
          <p className="text-sm text-slate-600">
            Chỉ tiêu yêu cầu: {parameterPool.join(" · ")}
          </p>
        ) : (
          <p className="text-sm text-amber-700">
            Mẫu chưa có danh sách chỉ tiêu. Vui lòng bổ sung tại phiếu yêu cầu hoặc tiếp nhận mẫu.
          </p>
        )}

        {groups.map((group, index) => {
          const dept = departments.find((d) => d.id === group.departmentId);
          const managers = dept?.managers ?? [];

          return (
            <section
              key={group.id ?? `new-${index}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-medium text-slate-900">Nhóm chỉ tiêu {index + 1}</h2>
                {groups.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setGroups((prev) => prev.filter((_, i) => i !== index))}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Xóa nhóm
                  </button>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm md:col-span-2">
                  <span className="mb-1 block font-medium">Nhóm chỉ tiêu *</span>
                  <input
                    required
                    className={inputClass}
                    value={group.parameterGroup}
                    onChange={(e) => updateGroup(index, { parameterGroup: e.target.value })}
                    placeholder="vd. Kim loại nặng"
                  />
                </label>

                <div className="text-sm md:col-span-2">
                  <span className="mb-2 block font-medium">Chỉ tiêu trong nhóm *</span>
                  <div className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-2">
                    {parameterPool.map((param) => {
                      const takenElsewhere =
                        usedParameters.has(param) && !group.parameters.includes(param);
                      return (
                        <label
                          key={param}
                          className={`flex items-center gap-2 text-sm ${takenElsewhere ? "opacity-40" : ""}`}
                        >
                          <input
                            type="checkbox"
                            disabled={takenElsewhere}
                            checked={group.parameters.includes(param)}
                            onChange={() => toggleParameter(index, param)}
                          />
                          <span>{param}</span>
                        </label>
                      );
                    })}
                    {parameterPool.length === 0 ? (
                      <span className="text-slate-500">Không có chỉ tiêu</span>
                    ) : null}
                  </div>
                </div>

                <label className="text-sm">
                  <span className="mb-1 block font-medium">Phòng ban phụ trách *</span>
                  <select
                    required
                    className={inputClass}
                    value={group.departmentId}
                    onChange={(e) => updateGroup(index, { departmentId: e.target.value })}
                  >
                    <option value="">— Chọn phòng ban —</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm">
                  <span className="mb-1 block font-medium">Quản lý phòng phụ trách *</span>
                  <select
                    required
                    className={inputClass}
                    value={group.managerId}
                    disabled={!group.departmentId}
                    onChange={(e) => updateGroup(index, { managerId: e.target.value })}
                  >
                    <option value="">— Chọn quản lý —</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm">
                  <span className="mb-1 block font-medium">Deadline *</span>
                  <input
                    required
                    type="date"
                    className={inputClass}
                    value={group.dueDate}
                    onChange={(e) => updateGroup(index, { dueDate: e.target.value })}
                  />
                </label>

                <div className="text-sm">
                  <span className="mb-1 block font-medium">Trạng thái</span>
                  <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800">
                    {ANALYSIS_ASSIGNMENT_STATUS_LABELS[group.status]}
                  </span>
                </div>

                <label className="text-sm md:col-span-2">
                  <span className="mb-1 block font-medium">Ghi chú</span>
                  <textarea
                    className={`${inputClass} min-h-20`}
                    value={group.note}
                    onChange={(e) => updateGroup(index, { note: e.target.value })}
                  />
                </label>
              </div>
            </section>
          );
        })}

        <button
          type="button"
          onClick={() => setGroups((prev) => [...prev, emptyGroup()])}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
        >
          + Thêm nhóm chỉ tiêu
        </button>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending || !selectedSample || parameterPool.length === 0}
            className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Đang lưu..." : "Lưu phân công"}
          </button>
        </div>
      </form>
    </div>
  );
}
