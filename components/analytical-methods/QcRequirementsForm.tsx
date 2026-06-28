"use client";

import { useRouter } from "next/navigation";
import {
  deleteMethodAcceptanceAction,
  deleteMethodQCAction,
  runSafetyChecksAction,
  saveMethodAcceptanceAction,
  saveMethodQCAction,
} from "@/lib/actions/method-execution";
import type {
  MethodAcceptanceCriteriaView,
  MethodQCRequirementView,
  MethodSafetyNoteView,
} from "@/types/analytical-methods";
import type { SafetyCheckResult } from "@/lib/services/analytical-methods/method-safety-check";

type Props = {
  methodId: string;
  qc: MethodQCRequirementView[];
  acceptance: MethodAcceptanceCriteriaView[];
  safety: MethodSafetyNoteView[];
  editable: boolean;
  safetyChecks?: SafetyCheckResult[];
};

export function QcRequirementsForm({ methodId, qc, acceptance, editable, safetyChecks = [] }: Props) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {editable ? (
        <form
          className="rounded-2xl border bg-white p-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            await saveMethodQCAction(methodId, fd);
            router.refresh();
            e.currentTarget.reset();
          }}
        >
          <h2 className="font-semibold">Thêm yêu cầu QC</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <input name="qcType" placeholder="Loại QC (Blank, Duplicate, Spike...)" className="rounded-lg border px-2 py-1" required />
            <input name="frequency" placeholder="Tần suất (1, 10...)" className="rounded-lg border px-2 py-1" />
            <input name="frequencyUnit" placeholder="Đơn vị (per batch, per 10 samples)" className="rounded-lg border px-2 py-1" />
            <input name="limitsJson" placeholder='JSON limits {"rsd":5}' className="rounded-lg border px-2 py-1" defaultValue="{}" />
          </div>
          <button type="submit" className="rounded-lg bg-cyan-600 px-3 py-1 text-sm text-white">
            Thêm QC
          </button>
        </form>
      ) : null}

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 font-semibold">Yêu cầu QC & ISO 17025</h2>
        <ul className="space-y-2 text-sm">
          {qc.map((item) => (
            <li key={item.id} className="flex justify-between gap-2 border-b border-slate-100 pb-2">
              <span>
                <strong>{item.qcType}</strong> — {item.frequency} {item.frequencyUnit} · {item.limitsJson}
              </span>
              {editable ? (
                <button
                  type="button"
                  className="text-red-600"
                  onClick={async () => {
                    await deleteMethodQCAction(methodId, item.id);
                    router.refresh();
                  }}
                >
                  Xóa
                </button>
              ) : null}
            </li>
          ))}
          {qc.length === 0 ? <li className="text-slate-500">Chưa cấu hình QC</li> : null}
        </ul>
      </div>

      {editable ? (
        <form
          className="rounded-2xl border bg-white p-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            await saveMethodAcceptanceAction(methodId, fd);
            router.refresh();
            e.currentTarget.reset();
          }}
        >
          <h2 className="font-semibold">Tiêu chí chấp nhận</h2>
          <input name="analyte" placeholder="Analyte" className="w-full rounded-lg border px-2 py-1" required />
          <input name="criteriaJson" placeholder='{"recovery":"85-115%"}' className="w-full rounded-lg border px-2 py-1" defaultValue="{}" />
          <button type="submit" className="rounded-lg bg-cyan-600 px-3 py-1 text-sm text-white">
            Thêm tiêu chí
          </button>
        </form>
      ) : null}

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 font-semibold">Tiêu chí chấp nhận</h2>
        <ul className="space-y-2 text-sm">
          {acceptance.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span>
                {item.analyte}: {item.criteriaJson}
              </span>
              {editable ? (
                <button
                  type="button"
                  className="text-red-600"
                  onClick={async () => {
                    await deleteMethodAcceptanceAction(methodId, item.id);
                    router.refresh();
                  }}
                >
                  Xóa
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Kiểm tra an toàn (SDS/GHS/tương thích)</h2>
          <button
            type="button"
            className="text-sm text-cyan-700"
            onClick={async () => {
              await runSafetyChecksAction(methodId);
              router.refresh();
            }}
          >
            Chạy kiểm tra
          </button>
        </div>
        <ul className="space-y-3 text-sm">
          {safetyChecks.map((s) => (
            <li key={s.casNumber} className="rounded-lg bg-slate-50 p-3">
              <p className="font-medium">
                {s.chemicalName} ({s.casNumber})
              </p>
              <p>SDS: {s.hasSds ? "Có" : "Thiếu"} · GHS: {s.hasGhs ? s.signalWord : "Thiếu"}</p>
              {s.compatibilityWarnings.map((w) => (
                <p key={w} className="text-amber-700">
                  {w}
                </p>
              ))}
            </li>
          ))}
          {safetyChecks.length === 0 ? <li className="text-slate-500">Thêm CAS vào hóa chất rồi chạy kiểm tra</li> : null}
        </ul>
      </div>
    </div>
  );
}
