"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAnalyticalMethodAction } from "@/lib/actions/analytical-methods";
import type { AnalyticalMethodDetail } from "@/types/analytical-methods";

type Props = { method: AnalyticalMethodDetail; editable: boolean };

export function MethodOverviewClient({ method, editable }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");

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
      {[
        ["methodCode", "Mã phương pháp", method.methodCode],
        ["methodName", "Tên", method.methodName],
        ["matrix", "Matrix", method.matrix],
        ["analyte", "Analyte", method.analyte],
        ["technique", "Kỹ thuật", method.technique],
        ["standardRef", "Chuẩn tham chiếu", method.standardRef],
      ].map(([name, label, value]) => (
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
