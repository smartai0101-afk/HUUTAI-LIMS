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
          placeholder="VD: H2SO4.H2O, CuSO4.5H2O, h2so4"
          className="h-11 w-full max-w-md rounded-xl border border-slate-200 px-3 text-sm font-mono outline-none focus:border-cyan-300"
        />
        <p className="mt-1 text-xs text-slate-500">
          Hỗ trợ hydrate/solvate/adduct: dấu <span className="font-mono">.</span>,{" "}
          <span className="font-mono">·</span>, <span className="font-mono">•</span> — không phân biệt hoa thường.
        </p>
      </div>

      {!result.ok ? (
        <p className="text-sm text-rose-600">{result.error}</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-cyan-50 px-4 py-3 ring-1 ring-cyan-100">
            <p className="text-xs text-cyan-700">Khối lượng mol (tổng)</p>
            <p className="text-2xl font-semibold text-cyan-900">{result.weight} g/mol</p>
          </div>

          {result.parts.length > 1 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Phần công thức</th>
                    <th className="px-3 py-2">Hệ số</th>
                    <th className="px-3 py-2">Khối lượng (g/mol)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.parts.map((part, index) => (
                    <tr key={`${part.label}-${index}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-mono font-semibold">{part.label}</td>
                      <td className="px-3 py-2">{part.coefficient}</td>
                      <td className="px-3 py-2">{part.weight}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-200 bg-slate-50 font-medium">
                    <td className="px-3 py-2" colSpan={2}>
                      Tổng
                    </td>
                    <td className="px-3 py-2">{result.weight}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <p className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
              Thành phần nguyên tố (gộp)
            </p>
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
                    <td className="px-3 py-2">{row.subtotal}</td>
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
