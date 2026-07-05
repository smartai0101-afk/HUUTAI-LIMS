"use client";

import { useMemo, useState } from "react";
import type { SampleTestMatrixView } from "@/types/catalog";

type Props = {
  matrix: SampleTestMatrixView;
  readOnly?: boolean;
  onToggle: (lineId: string, testMethodId: string, selected: boolean) => void;
  onBulkApplySameMatrix?: () => void;
};

export function SampleTestMatrix({
  matrix,
  readOnly,
  onToggle,
  onBulkApplySameMatrix,
}: Props) {
  const [matrixFilter, setMatrixFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const matrixNames = useMemo(() => {
    const set = new Set(matrix.lines.map((l) => l.matrixName).filter(Boolean));
    return ["All", ...Array.from(set)] as string[];
  }, [matrix.lines]);

  const categories = useMemo(() => {
    const set = new Set(matrix.testMethods.map((t) => t.categoryName));
    return ["All", ...Array.from(set).sort()];
  }, [matrix.testMethods]);

  const filteredLines = matrix.lines.filter((l) => {
    if (matrixFilter === "All") return true;
    return l.matrixName === matrixFilter;
  });

  const filteredTests = matrix.testMethods.filter((t) => {
    if (categoryFilter !== "All" && t.categoryName !== categoryFilter) return false;
    return true;
  });

  function cellState(lineId: string, testMethodId: string) {
    return matrix.cells.find((c) => c.lineId === lineId && c.testMethodId === testMethodId);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={matrixFilter}
          onChange={(e) => setMatrixFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {matrixNames.map((m) => (
            <option key={m} value={m}>
              {m === "All" ? "Tất cả nền mẫu" : m}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "Tất cả nhóm chỉ tiêu" : c}
            </option>
          ))}
        </select>
        {!readOnly && onBulkApplySameMatrix ? (
          <button
            type="button"
            onClick={onBulkApplySameMatrix}
            className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-800"
          >
            Áp dụng cho mẫu cùng nền
          </button>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="sticky left-0 bg-slate-50 px-3 py-2 text-left">Mẫu</th>
              <th className="px-3 py-2 text-left">Nền mẫu</th>
              {filteredTests.map((t) => (
                <th key={t.id} className="px-2 py-2 text-center whitespace-nowrap" title={t.name}>
                  {t.code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredLines.map((line) => (
              <tr key={line.id} className="border-t border-slate-100">
                <td className="sticky left-0 bg-white px-3 py-2 font-medium">{line.sampleName}</td>
                <td className="px-3 py-2 text-slate-600">{line.matrixName ?? "—"}</td>
                {filteredTests.map((t) => {
                  const cell = cellState(line.id, t.id);
                  const selected = cell?.selected ?? false;
                  const valid = cell?.valid ?? true;
                  return (
                    <td key={t.id} className="px-2 py-2 text-center">
                      {readOnly ? (
                        <span className={selected ? "text-emerald-600" : "text-slate-300"}>
                          {selected ? "✓" : "—"}
                        </span>
                      ) : (
                        <button
                          type="button"
                          title={!valid ? "Không phù hợp nền mẫu" : t.name}
                          onClick={() => onToggle(line.id, t.id, !selected)}
                          className={`h-7 w-7 rounded border text-sm ${
                            selected
                              ? valid
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : "border-amber-400 bg-amber-50 text-amber-700"
                              : "border-slate-200 text-slate-400 hover:border-cyan-300"
                          }`}
                        >
                          {selected ? "✓" : ""}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
