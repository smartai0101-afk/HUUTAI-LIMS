"use client";

import { useMemo, useState } from "react";
import { SAMPLE_TEST_STATUS_LABELS } from "@/lib/sample-labels";
import type { SampleTestAssignmentView } from "@/lib/services/samples/sample-test-assignment";
import type { LabDepartmentView } from "@/types/samples";

type Tab = "sample" | "test" | "method" | "analyst";

type Props = {
  items: SampleTestAssignmentView[];
  departments: LabDepartmentView[];
};

export function AssignmentHubClient({ items, departments }: Props) {
  const [tab, setTab] = useState<Tab>("sample");

  const groupedBySample = useMemo(() => {
    const map = new Map<string, SampleTestAssignmentView[]>();
    for (const item of items) {
      const list = map.get(item.sampleId) ?? [];
      list.push(item);
      map.set(item.sampleId, list);
    }
    return map;
  }, [items]);

  const groupedByTest = useMemo(() => {
    const map = new Map<string, SampleTestAssignmentView[]>();
    for (const item of items) {
      const key = item.testMethodId ?? item.parameterName;
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [items]);

  const analystLoad = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, r) => {
      const k = r.analystName || "Chưa gán";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
  }, [items]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "sample", label: "Theo mẫu" },
    { id: "test", label: "Theo chỉ tiêu" },
    { id: "method", label: "Theo PP/thiết bị" },
    { id: "analyst", label: "Theo analyst" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm ${
              tab === t.id ? "bg-cyan-600 text-white" : "border border-slate-200 text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sample" ? (
        <div className="space-y-3">
          {[...groupedBySample.entries()].map(([sampleId, rows]) => (
            <details key={sampleId} className="rounded-2xl border bg-white p-4" open>
              <summary className="cursor-pointer font-medium text-slate-900">
                {rows[0]?.sampleCode} — {rows[0]?.sampleName}{" "}
                <span className="text-sm font-normal text-slate-500">({rows.length} chỉ tiêu)</span>
              </summary>
              <ul className="mt-3 space-y-2 text-sm">
                {rows.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <span>
                      {r.parameterName}{" "}
                      <span className="text-slate-500">· {SAMPLE_TEST_STATUS_LABELS[r.status]}</span>
                    </span>
                    <AssignMiniForm departments={departments} sampleTestId={r.id} />
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      ) : null}

      {tab === "test" ? (
        <div className="space-y-3">
          {[...groupedByTest.entries()].map(([key, rows]) => (
            <div key={key} className="rounded-2xl border bg-white p-4">
              <p className="font-medium">
                {rows[0]?.testMethodName ?? rows[0]?.parameterName}{" "}
                <span className="text-sm text-slate-500">({rows.length} mẫu)</span>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {rows.map((r) => (
                  <li key={r.id}>
                    {r.sampleCode} — {SAMPLE_TEST_STATUS_LABELS[r.status]}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "method" ? (
        <p className="rounded-2xl border bg-white p-4 text-sm text-slate-600">
          Gom theo phương pháp/thiết bị khi tạo worklist — chọn các chỉ tiêu cùng phương pháp từ tab Theo chỉ tiêu,
          sau đó tạo worklist tại module Phân tích.
        </p>
      ) : null}

      {tab === "analyst" ? (
        <div className="rounded-2xl border bg-white p-4 text-sm space-y-1">
          {Object.entries(analystLoad).map(([name, count]) => (
            <p key={name}>
              {name}: <strong>{count}</strong> chỉ tiêu
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AssignMiniForm({
  departments,
  sampleTestId,
}: {
  departments: LabDepartmentView[];
  sampleTestId: string;
}) {
  const [deptId, setDeptId] = useState(departments[0]?.id ?? "");
  const managerId =
    departments.find((d) => d.id === deptId)?.managers.find((m) => m.isDefault)?.id ??
    departments.find((d) => d.id === deptId)?.managers[0]?.id ??
    "";

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      action={async (fd) => {
        fd.set("departmentId", deptId);
        fd.set("managerId", managerId);
        const { assignSampleTestAction } = await import("@/lib/actions/request-lines");
        await assignSampleTestAction(sampleTestId, fd);
      }}
    >
      <select
        value={deptId}
        onChange={(e) => setDeptId(e.target.value)}
        className="rounded border px-2 py-1 text-xs"
      >
        {departments.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <input name="dueDate" type="date" required className="rounded border px-2 py-1 text-xs" />
      <button type="submit" className="rounded bg-cyan-600 px-2 py-1 text-xs text-white">
        Gán
      </button>
    </form>
  );
}
