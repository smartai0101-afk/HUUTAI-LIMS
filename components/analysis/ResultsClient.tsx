"use client";

import { useState, useTransition } from "react";
import { saveTestResultAction, submitForReviewAction } from "@/lib/actions/analysis";
import { TEST_RESULT_STATUS_LABELS } from "@/lib/analysis-labels";
import type { TestResultView } from "@/types/analysis";

const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";

export function ResultsClient({ results }: { results: TestResultView[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Partial<TestResultView>>>({});

  function saveResult(result: TestResultView) {
    const d = drafts[result.id] ?? {};
    setError("");
    const fd = new FormData();
    fd.set("resultId", result.id);
    fd.set("resultValue", d.resultValue ?? result.resultValue);
    fd.set("unit", d.unit ?? result.unit);
    fd.set("lod", d.lod ?? result.lod);
    fd.set("loq", d.loq ?? result.loq);
    fd.set("limitValue", d.limitValue ?? result.limitValue);
    fd.set("evaluation", d.evaluation ?? result.evaluation ?? "");
    fd.set("note", d.note ?? result.note);
    startTransition(async () => {
      const r = await saveTestResultAction(fd);
      if (r.error) setError(r.error);
    });
  }

  function submitReview(taskId: string) {
    startTransition(async () => {
      const r = await submitForReviewAction(taskId);
      if (r.error) setError(r.error);
    });
  }

  const byTask = results.reduce<Record<string, TestResultView[]>>((acc, r) => {
    (acc[r.taskId] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nhập kết quả</h1>
        <p className="text-sm text-slate-500">Nhập kết quả phân tích theo từng chỉ tiêu</p>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}
      {Object.entries(byTask).map(([taskId, rows]) => (
        <section key={taskId} className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-medium">{rows[0]?.sampleCode} — {rows[0]?.parameterGroup}</p>
              <p className="text-xs text-slate-500">{rows[0]?.departmentName}</p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() => submitReview(taskId)}
              className="rounded-lg border px-3 py-1.5 text-xs"
            >
              Gửi duyệt
            </button>
          </div>
          <div className="space-y-3">
            {rows.map((r) => {
              const d = drafts[r.id] ?? {};
              return (
                <div key={r.id} className="grid gap-2 rounded-xl border border-slate-100 p-3 md:grid-cols-6">
                  <div className="md:col-span-6 text-sm font-medium">{r.parameterName}</div>
                  <input className={inputClass} placeholder="Kết quả" defaultValue={r.resultValue} onChange={(e) => setDrafts((p) => ({ ...p, [r.id]: { ...p[r.id], resultValue: e.target.value } }))} />
                  <input className={inputClass} placeholder="Đơn vị" defaultValue={r.unit} onChange={(e) => setDrafts((p) => ({ ...p, [r.id]: { ...p[r.id], unit: e.target.value } }))} />
                  <input className={inputClass} placeholder="LOD" defaultValue={r.lod} onChange={(e) => setDrafts((p) => ({ ...p, [r.id]: { ...p[r.id], lod: e.target.value } }))} />
                  <input className={inputClass} placeholder="LOQ" defaultValue={r.loq} onChange={(e) => setDrafts((p) => ({ ...p, [r.id]: { ...p[r.id], loq: e.target.value } }))} />
                  <input className={inputClass} placeholder="Giới hạn" defaultValue={r.limitValue} onChange={(e) => setDrafts((p) => ({ ...p, [r.id]: { ...p[r.id], limitValue: e.target.value } }))} />
                  <button type="button" disabled={pending} onClick={() => saveResult(r)} className="rounded-lg bg-cyan-600 px-3 py-2 text-xs text-white">
                    Lưu
                  </button>
                  <div className="md:col-span-6 text-xs text-slate-500">
                    {TEST_RESULT_STATUS_LABELS[r.status]}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {results.length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có kết quả cần nhập.</p>
      ) : null}
    </div>
  );
}
