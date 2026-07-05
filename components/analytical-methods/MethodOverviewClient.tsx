"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MethodMatrixMultiSelect } from "@/components/analytical-methods/MethodMatrixMultiSelect";
import { MethodTestMethodMultiSelect } from "@/components/analytical-methods/MethodTestMethodMultiSelect";
import { updateAnalyticalMethodAction } from "@/lib/actions/analytical-methods";
import type { AnalyticalMethodDetail } from "@/types/analytical-methods";
import type { SampleMatrixView, TestMethodView } from "@/types/catalog";

type Props = {
  method: AnalyticalMethodDetail;
  matrices: SampleMatrixView[];
  testMethods: TestMethodView[];
  editable: boolean;
};

export function MethodOverviewClient({ method, matrices, testMethods, editable }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");

  const textFields = [
    ["methodCode", "Mã phương pháp", method.methodCode],
    ["methodName", "Tên", method.methodName],
    ["technique", "Kỹ thuật", method.technique],
    ["standardRef", "Chuẩn tham chiếu", method.standardRef],
  ] as const;

  return (
    <form
      className="max-w-2xl space-y-4 rounded-2xl border bg-white p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!editable) return;
        const fd = new FormData(e.currentTarget);
        const result = await updateAnalyticalMethodAction(method.id, fd);
        if (result.error) setError(result.error);
        else router.refresh();
      }}
    >
      {textFields.slice(0, 2).map(([name, label, value]) => (
        <label key={name} className="block text-sm">
          <span className="font-medium text-slate-700">{label}</span>
          <input
            name={name}
            defaultValue={value}
            disabled={!editable}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 disabled:bg-slate-50"
          />
        </label>
      ))}

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Nền mẫu</span>
        <MethodMatrixMultiSelect
          key={`${method.id}-matrix-${method.matrixIds.join(",")}`}
          matrices={matrices}
          defaultSelectedIds={method.matrixIds}
          disabled={!editable}
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Chất phân tích</span>
        <MethodTestMethodMultiSelect
          key={`${method.id}-test-${method.testMethodIds.join(",")}`}
          testMethods={testMethods}
          defaultSelectedIds={method.testMethodIds}
          disabled={!editable}
        />
      </label>

      {textFields.slice(2).map(([name, label, value]) => (
        <label key={name} className="block text-sm">
          <span className="font-medium text-slate-700">{label}</span>
          <input
            name={name}
            defaultValue={value}
            disabled={!editable}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 disabled:bg-slate-50"
          />
        </label>
      ))}

      <p className="text-xs text-slate-500">Tạo bởi {method.createdBy}</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {editable ? (
        <button type="submit" className="rounded-xl bg-cyan-600 px-4 py-2 text-sm text-white">
          Lưu metadata
        </button>
      ) : null}
    </form>
  );
}
