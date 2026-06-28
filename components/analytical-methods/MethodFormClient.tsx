"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAnalyticalMethodAction } from "@/lib/actions/analytical-methods";

export function MethodFormClient() {
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Tạo phương pháp phân tích</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        {[
          { name: "methodCode", label: "Mã phương pháp *", placeholder: "PP-HPLC-001" },
          { name: "methodName", label: "Tên phương pháp *", placeholder: "Xác định ... trong ..." },
          { name: "matrix", label: "Matrix", placeholder: "Nước, đất, thực phẩm..." },
          { name: "analyte", label: "Analyte", placeholder: "Pb, Cd, ..." },
          { name: "technique", label: "Kỹ thuật", placeholder: "HPLC-UV, GC-MS..." },
          { name: "standardRef", label: "Chuẩn tham chiếu", placeholder: "ISO, AOAC, TCVN..." },
        ].map((field) => (
          <label key={field.name} className="block text-sm">
            <span className="font-medium text-slate-700">{field.label}</span>
            <input
              name={field.name}
              placeholder={field.placeholder}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              required={field.name === "methodCode" || field.name === "methodName"}
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
