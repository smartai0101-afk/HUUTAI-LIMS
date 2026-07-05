"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MethodMatrixMultiSelect } from "@/components/analytical-methods/MethodMatrixMultiSelect";
import { MethodTestMethodMultiSelect } from "@/components/analytical-methods/MethodTestMethodMultiSelect";
import { createAnalyticalMethodAction } from "@/lib/actions/analytical-methods";
import type { SampleMatrixView, TestMethodView } from "@/types/catalog";

type Props = {
  matrices: SampleMatrixView[];
  testMethods: TestMethodView[];
};

export function MethodFormClient({ matrices, testMethods }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const result = await createAnalyticalMethodAction(fd);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.id) router.push(`/analytical-methods/${result.id}`);
  }

  const textFields = [
    { name: "methodCode", label: "Mã phương pháp *", placeholder: "PP-HPLC-001", required: true },
    { name: "methodName", label: "Tên phương pháp *", placeholder: "Xác định ... trong ...", required: true },
    { name: "technique", label: "Kỹ thuật", placeholder: "HPLC-UV, GC-MS...", required: false },
    { name: "standardRef", label: "Chuẩn tham chiếu", placeholder: "ISO, AOAC, TCVN...", required: false },
  ] as const;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Tạo phương pháp phân tích</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        {textFields.slice(0, 2).map((field) => (
          <label key={field.name} className="block text-sm">
            <span className="font-medium text-slate-700">{field.label}</span>
            <input
              name={field.name}
              placeholder={field.placeholder}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              required={field.required}
            />
          </label>
        ))}

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Nền mẫu</span>
          <MethodMatrixMultiSelect matrices={matrices} disabled={pending} />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Chất phân tích</span>
          <MethodTestMethodMultiSelect testMethods={testMethods} disabled={pending} />
        </label>

        {textFields.slice(2).map((field) => (
          <label key={field.name} className="block text-sm">
            <span className="font-medium text-slate-700">{field.label}</span>
            <input
              name={field.name}
              placeholder={field.placeholder}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
        ))}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Đang lưu..." : "Tạo phương pháp"}
        </button>
      </form>
    </div>
  );
}
