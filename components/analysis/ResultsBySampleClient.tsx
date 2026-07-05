"use client";

import type { TestResultView } from "@/types/analysis";

type Props = {
  sampleId: string;
  sampleCode: string;
  sampleName: string;
  results: TestResultView[];
};

export function ResultsBySampleClient({ sampleCode, sampleName, results }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Nhập kết quả theo mẫu</h1>
        <p className="text-sm text-slate-500">
          {sampleCode} — {sampleName}
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Chỉ tiêu</th>
              <th className="px-3 py-2">Kết quả</th>
              <th className="px-3 py-2">ĐVT</th>
              <th className="px-3 py-2">LOD</th>
              <th className="px-3 py-2">LOQ</th>
              <th className="px-3 py-2">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2 font-medium">{r.parameterName}</td>
                <td className="px-3 py-2">{r.resultValue || "—"}</td>
                <td className="px-3 py-2">{r.unit}</td>
                <td className="px-3 py-2">{r.lod}</td>
                <td className="px-3 py-2">{r.loq}</td>
                <td className="px-3 py-2 text-xs text-slate-500">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
