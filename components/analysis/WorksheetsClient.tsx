"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  completeWorksheetAction,
  createWorksheetAction,
  startWorksheetAction,
} from "@/lib/actions/analysis";
import { WORKSHEET_STATUS_LABELS } from "@/lib/analysis-labels";
import type { WorksheetView } from "@/types/analysis";

const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";

type Props = {
  worksheets: WorksheetView[];
  worklists: { id: string; worklistCode: string; status: string }[];
  chemicals: { id: string; code: string; name: string }[];
  standards: { id: string; code: string; name: string }[];
};

export function WorksheetsClient({ worksheets, worklists, chemicals, standards }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [worklistId, setWorklistId] = useState(worklists[0]?.id ?? "");
  const [chemicalIds, setChemicalIds] = useState<string[]>([]);
  const [standardIds, setStandardIds] = useState<string[]>([]);
  const [crmIds, setCrmIds] = useState<string[]>([]);
  const [conditionNote, setConditionNote] = useState("");

  function toggle(setter: (v: string[]) => void, ids: string[], id: string) {
    setter(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.set("worklistId", worklistId);
    fd.set("chemicalIds", JSON.stringify(chemicalIds));
    fd.set("standardIds", JSON.stringify(standardIds));
    fd.set("crmIds", JSON.stringify(crmIds));
    fd.set("conditionNote", conditionNote);
    startTransition(async () => {
      const result = await createWorksheetAction(fd);
      if (result.error) setError(result.error);
      else {
        setShowForm(false);
        router.refresh();
      }
    });
  }

  function runAction(fn: (id: string) => Promise<{ error?: string; success?: boolean }>, id: string) {
    startTransition(async () => {
      const result = await fn(id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Worksheet</h1>
          <p className="text-sm text-slate-500">Ghi nhận quá trình phân tích</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm text-white">
          + Tạo worksheet
        </button>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {showForm ? (
        <form onSubmit={handleCreate} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Worklist</span>
            <select required className={inputClass} value={worklistId} onChange={(e) => setWorklistId(e.target.value)}>
              {worklists.map((w) => (
                <option key={w.id} value={w.id}>{w.worklistCode}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Hóa chất</span>
            <select multiple className={`${inputClass} min-h-24`} value={chemicalIds} onChange={(e) => setChemicalIds(Array.from(e.target.selectedOptions).map((o) => o.value))}>
              {chemicals.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Chuẩn</span>
            <select multiple className={`${inputClass} min-h-24`} value={standardIds} onChange={(e) => setStandardIds(Array.from(e.target.selectedOptions).map((o) => o.value))}>
              {standards.map((s) => (
                <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">CRM</span>
            <select multiple className={`${inputClass} min-h-24`} value={crmIds} onChange={(e) => setCrmIds(Array.from(e.target.selectedOptions).map((o) => o.value))}>
              {standards.map((s) => (
                <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Điều kiện phân tích</span>
            <textarea className={`${inputClass} min-h-20`} value={conditionNote} onChange={(e) => setConditionNote(e.target.value)} />
          </label>
          <button type="submit" disabled={pending} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm text-white">
            Tạo
          </button>
        </form>
      ) : null}

      <div className="space-y-3">
        {worksheets.map((ws) => (
          <div key={ws.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex justify-between gap-2">
              <div>
                <p className="font-semibold">{ws.worksheetCode}</p>
                <p className="text-sm text-slate-600">{ws.worklistCode} · {ws.analystName}</p>
              </div>
              <span className="text-xs">{WORKSHEET_STATUS_LABELS[ws.status]}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {ws.status === "draft" ? (
                <button type="button" disabled={pending} onClick={() => runAction(startWorksheetAction, ws.id)} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs text-white">
                  Bắt đầu
                </button>
              ) : null}
              {ws.status === "in_progress" ? (
                <button type="button" disabled={pending} onClick={() => runAction(completeWorksheetAction, ws.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white">
                  Hoàn thành
                </button>
              ) : null}
              <Link href={`/analysis/worksheets/${ws.id}`} className="rounded-lg border px-3 py-1.5 text-xs">
                Chi tiết
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
