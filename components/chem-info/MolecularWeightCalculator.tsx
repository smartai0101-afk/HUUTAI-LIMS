"use client";

import { useMemo, useState } from "react";
import { calculateMolecularWeight } from "@/lib/chem-info/calculators/molecular-weight";

export function MolecularWeightCalculator() {
  const [formula, setFormula] = useState("H2SO4");

  const result = useMemo(() => calculateMolecularWeight(formula), [formula]);

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-slate-600">Công thức phân tử</label>
        <input
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="VD: H2SO4, C6H12O6, NaCl"
          className="h-11 w-full max-w-md rounded-xl border border-slate-200 px-3 text-sm font-mono outline-none focus:border-cyan-300"
        />
      </div>

      {!result.ok ? (
        <p className="text-sm text-rose-600">{result.error}</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-cyan-50 px-4 py-3 ring-1 ring-cyan-100">
            <p className="text-xs text-cyan-700">Khối lượng mol</p>
            <p className="text-2xl font-semibold text-cyan-900">{result.weight} g/mol</p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2">Nguyên tố</th>
                  <th className="px-3 py-2">Số lượng</th>
                  <th className="px-3 py-2">Khối lượng (u)</th>
                  <th className="px-3 py-2">Tổng (u)</th>
                </tr>
              </thead>
              <tbody>
                {result.breakdown.map((row) => (
                  <tr key={row.symbol} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-mono font-semibold">{row.symbol}</td>
                    <td className="px-3 py-2">{row.count}</td>
                    <td className="px-3 py-2">{row.mass}</td>
                    <td className="px-3 py-2">{Math.round(row.subtotal * 1000) / 1000}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
