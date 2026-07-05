"use client";

import { useState } from "react";
import { MatrixSelector } from "./MatrixSelector";
import type { RequestSampleLineView, SampleMatrixView } from "@/types/catalog";

export type SampleLineDraft = {
  id?: string;
  tempCode: string;
  sampleName: string;
  matrixId: string | null;
  sampleType: string;
  quantity: string;
  unit: string;
  conditionNote: string;
  testMethodIds: string[];
  testCount?: number;
  status?: string;
};

type Props = {
  lines: SampleLineDraft[];
  matrices: SampleMatrixView[];
  onChange: (lines: SampleLineDraft[]) => void;
  onSelectLine: (index: number) => void;
  selectedIndex: number | null;
  readOnly?: boolean;
  onDuplicate?: (index: number) => void;
  onRemove?: (index: number) => void;
};

const inputClass = "w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm";

export function SampleTable({
  lines,
  matrices,
  onChange,
  onSelectLine,
  selectedIndex,
  readOnly,
  onDuplicate,
  onRemove,
}: Props) {
  function updateLine(index: number, patch: Partial<SampleLineDraft>) {
    const next = lines.map((l, i) => (i === index ? { ...l, ...patch } : l));
    onChange(next);
  }

  function addLine() {
    onChange([
      ...lines,
      {
        tempCode: `TMP-${String(lines.length + 1).padStart(3, "0")}`,
        sampleName: "",
        matrixId: null,
        sampleType: "",
        quantity: "",
        unit: "",
        conditionNote: "",
        testMethodIds: [],
      },
    ]);
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">STT</th>
              <th className="px-3 py-2">Mã tạm</th>
              <th className="px-3 py-2">Tên mẫu</th>
              <th className="px-3 py-2 min-w-[180px]">Nền mẫu</th>
              <th className="px-3 py-2">SL</th>
              <th className="px-3 py-2">Điều kiện</th>
              <th className="px-3 py-2">Chỉ tiêu</th>
              <th className="px-3 py-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr
                key={line.id ?? index}
                className={`border-t border-slate-100 ${selectedIndex === index ? "bg-cyan-50/60" : ""}`}
                onClick={() => onSelectLine(index)}
              >
                <td className="px-3 py-2">{index + 1}</td>
                <td className="px-3 py-2">
                  <input
                    className={inputClass}
                    value={line.tempCode}
                    disabled={readOnly}
                    onChange={(e) => updateLine(index, { tempCode: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className={inputClass}
                    value={line.sampleName}
                    disabled={readOnly}
                    required
                    onChange={(e) => updateLine(index, { sampleName: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <MatrixSelector
                    matrices={matrices}
                    value={line.matrixId}
                    onChange={(matrixId) => updateLine(index, { matrixId, testMethodIds: [] })}
                    disabled={readOnly}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <input
                      className={`${inputClass} w-16`}
                      value={line.quantity}
                      disabled={readOnly}
                      onChange={(e) => updateLine(index, { quantity: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <input
                      className={`${inputClass} w-14`}
                      value={line.unit}
                      placeholder="đvt"
                      disabled={readOnly}
                      onChange={(e) => updateLine(index, { unit: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <input
                    className={inputClass}
                    value={line.conditionNote}
                    disabled={readOnly}
                    onChange={(e) => updateLine(index, { conditionNote: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="px-3 py-2 text-center font-medium text-cyan-700">
                  {line.testMethodIds.length || line.testCount || 0}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    {!readOnly && onDuplicate ? (
                      <button
                        type="button"
                        className="rounded border px-2 py-1 text-xs"
                        onClick={() => onDuplicate(index)}
                      >
                        Nhân bản
                      </button>
                    ) : null}
                    {!readOnly && onRemove && lines.length > 1 ? (
                      <button
                        type="button"
                        className="rounded border border-red-200 px-2 py-1 text-xs text-red-600"
                        onClick={() => onRemove(index)}
                      >
                        Xóa
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly ? (
        <button
          type="button"
          onClick={addLine}
          className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:border-cyan-400 hover:text-cyan-700"
        >
          + Thêm mẫu
        </button>
      ) : null}
    </div>
  );
}

export function linesFromView(lines: RequestSampleLineView[]): SampleLineDraft[] {
  return lines.map((l) => ({
    id: l.id,
    tempCode: l.tempCode,
    sampleName: l.sampleName,
    matrixId: l.matrixId,
    sampleType: l.sampleType,
    quantity: l.quantity != null ? String(l.quantity) : "",
    unit: l.unit,
    conditionNote: l.conditionNote,
    testMethodIds: l.tests.map((t) => t.testMethodId),
    testCount: l.tests.length,
    status: l.status,
  }));
}
