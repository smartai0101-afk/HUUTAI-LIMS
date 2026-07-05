"use client";

import Link from "next/link";
import { WORKSHEET_STATUS_LABELS } from "@/lib/analysis-labels";
import type { WorksheetView } from "@/types/analysis";

type SampleTestRow = {
  id: string;
  sampleCode: string;
  sampleName: string;
  parameterName: string;
  runOrder: number;
};

type QcRow = {
  id: string;
  checkType: string;
  status: string;
  expectedValue: string;
  measuredValue: string;
  recoveryPercent: string;
  note: string;
};

type Props = {
  worksheet: WorksheetView;
  sampleTests: SampleTestRow[];
  qcChecks: QcRow[];
};

export function WorksheetDetailClient({ worksheet, sampleTests, qcChecks }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{worksheet.worksheetCode}</h1>
          <p className="text-sm text-slate-500">{WORKSHEET_STATUS_LABELS[worksheet.status]}</p>
        </div>
        <Link href="/analysis/worksheets" className="text-sm text-cyan-700 hover:underline">
          ← Quay lại
        </Link>
      </div>

      <section className="grid gap-4 rounded-2xl border bg-white p-4 text-sm shadow-sm md:grid-cols-2">
        <p>Worklist: {worksheet.worklistCode}</p>
        <p>PP: {worksheet.methodName || "—"}</p>
        <p>TB: {worksheet.equipmentName || "—"}</p>
        <p>Analyst: {worksheet.analystName}</p>
        <p>Điều kiện: {worksheet.conditionNote || "—"}</p>
        <p>
          HC: {worksheet.chemicalIds.length} · Chuẩn: {worksheet.standardIds.length} · CRM:{" "}
          {worksheet.crmIds.length}
        </p>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Sample tests trên worksheet</h2>
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">#</th>
              <th className="py-2">Mẫu</th>
              <th className="py-2">Chỉ tiêu</th>
            </tr>
          </thead>
          <tbody>
            {sampleTests.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2">{r.runOrder + 1}</td>
                <td className="py-2">
                  {r.sampleCode} — {r.sampleName}
                </td>
                <td className="py-2">{r.parameterName}</td>
              </tr>
            ))}
            {sampleTests.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 text-slate-500">
                  Chưa gắn sample_test — tạo từ worklist có liên kết task/sample_test.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">QC trên worksheet</h2>
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Loại</th>
              <th className="py-2">Kỳ vọng</th>
              <th className="py-2">Đo</th>
              <th className="py-2">Recovery</th>
              <th className="py-2">KQ</th>
            </tr>
          </thead>
          <tbody>
            {qcChecks.map((q) => (
              <tr key={q.id} className="border-t">
                <td className="py-2">{q.checkType}</td>
                <td className="py-2">{q.expectedValue || "—"}</td>
                <td className="py-2">{q.measuredValue || "—"}</td>
                <td className="py-2">{q.recoveryPercent || "—"}</td>
                <td className="py-2">{q.status}</td>
              </tr>
            ))}
            {qcChecks.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-slate-500">
                  Chưa có bản ghi QC.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
