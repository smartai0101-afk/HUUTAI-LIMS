"use client";

import { useRouter } from "next/navigation";
import {
  abortExecutionAction,
  completeExecutionAction,
  updateExecutionStepAction,
} from "@/lib/actions/method-execution";
import { buildExecutionReportCsv } from "@/lib/services/analytical-methods/method-execution";
import type { MethodExecutionView } from "@/types/analytical-methods";
import type { MethodExecutionStepStatus } from "@prisma/client";

type Props = { execution: MethodExecutionView };

const STEP_STATUSES: MethodExecutionStepStatus[] = ["Pending", "Done", "Skipped", "Failed"];

export function MethodExecutionClient({ execution }: Props) {
  const router = useRouter();

  function downloadReport() {
    const csv = buildExecutionReportCsv(execution);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `method-execution-${execution.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {execution.methodCode} — Thực hiện v{execution.version}
        </h1>
        <p className="text-sm text-slate-500">
          {execution.sampleCount} mẫu · {execution.status} · bởi {execution.startedBy}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {execution.status === "InProgress" ? (
          <>
            <button
              type="button"
              className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white"
              onClick={async () => {
                await completeExecutionAction(execution.id);
                router.refresh();
              }}
            >
              Hoàn thành
            </button>
            <button
              type="button"
              className="rounded-lg border px-3 py-1 text-sm"
              onClick={async () => {
                await abortExecutionAction(execution.id, "Hủy thủ công");
                router.refresh();
              }}
            >
              Hủy
            </button>
          </>
        ) : null}
        <button type="button" onClick={downloadReport} className="rounded-lg border px-3 py-1 text-sm">
          Export CSV
        </button>
      </div>

      <div className="space-y-3">
        {execution.steps.map((step) => (
          <div key={step.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {step.stepOrder}. {step.stepName}
                </p>
                <p className="text-sm text-slate-600">{step.instruction}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{step.status}</span>
            </div>
            {execution.status === "InProgress" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {STEP_STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    className="rounded-lg border px-2 py-1 text-xs"
                    onClick={async () => {
                      await updateExecutionStepAction(step.id, st);
                      router.refresh();
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            ) : null}
            {step.operator ? (
              <p className="mt-2 text-xs text-slate-500">
                {step.operator} · {step.timestamp ?? ""}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
