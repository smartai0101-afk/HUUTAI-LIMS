"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeWorklistAction } from "@/lib/actions/analysis";
import { WORKLIST_STATUS_LABELS } from "@/lib/analysis-labels";
import type { WorklistView } from "@/types/analysis";

export function WorklistDetailClient({ worklist }: { worklist: WorklistView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleComplete() {
    setError("");
    startTransition(async () => {
      const result = await completeWorklistAction(worklist.id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{worklist.worklistCode}</h1>
        <p className="text-sm text-slate-500">{WORKLIST_STATUS_LABELS[worklist.status]}</p>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-sm">Phòng: {worklist.departmentName}</p>
        <p className="text-sm">PP: {worklist.methodName || "—"}</p>
        <p className="text-sm">TB: {worklist.equipmentName || "—"}</p>
        <p className="text-sm">Analyst: {worklist.analystName}</p>
      </section>
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">Danh sách mẫu/chỉ tiêu</h2>
        <ul className="space-y-2 text-sm">
          {worklist.tasks.map((t) => (
            <li key={t.id}>
              {t.sampleCode} — {t.parameterGroup} ({t.parameters.join(", ")})
            </li>
          ))}
        </ul>
      </section>
      {worklist.status === "running" ? (
        <button
          type="button"
          disabled={pending}
          onClick={handleComplete}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white"
        >
          Hoàn thành worklist
        </button>
      ) : null}
      <Link href="/analysis/worklists" className="block text-sm text-cyan-700 hover:underline">
        ← Quay lại
      </Link>
    </div>
  );
}
