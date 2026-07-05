"use client";

import { useState } from "react";
import type { SampleMatrixView } from "@/types/catalog";
import type { SampleLineDraft } from "./SampleTable";

type Props = {
  open: boolean;
  onClose: () => void;
  matrices: SampleMatrixView[];
  sourceTestMethodIds: string[];
  onApplyLocal: (filter: { matrixId?: string; lineIndices?: number[] }) => void;
  onApplyServer?: (filter: { matrixId?: string }) => void;
  hasPersistedRequest: boolean;
};

export function BulkApplyTestsModal({
  open,
  onClose,
  matrices,
  sourceTestMethodIds,
  onApplyLocal,
  onApplyServer,
  hasPersistedRequest,
}: Props) {
  const [matrixId, setMatrixId] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Áp dụng bộ chỉ tiêu hàng loạt</h3>
        <p className="mt-1 text-sm text-slate-500">
          Áp dụng {sourceTestMethodIds.length} chỉ tiêu đang chọn cho các mẫu cùng nền.
        </p>
        <label className="mt-4 block text-sm">
          <span className="mb-1 block font-medium">Lọc theo nền mẫu</span>
          <select
            value={matrixId}
            onChange={(e) => setMatrixId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Tất cả mẫu (cùng nền với mẫu đang chọn)</option>
            {matrices.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-slate-600">
            Hủy
          </button>
          <button
            type="button"
            onClick={() => {
              const filter = { matrixId: matrixId || undefined };
              if (hasPersistedRequest && onApplyServer) {
                onApplyServer(filter);
              } else {
                onApplyLocal(filter);
              }
              onClose();
            }}
            className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
}

export function applyTestsBulkLocal(
  lines: SampleLineDraft[],
  sourceTestMethodIds: string[],
  selectedIndex: number | null,
  filter: { matrixId?: string },
): SampleLineDraft[] {
  if (sourceTestMethodIds.length === 0) return lines;
  const sourceMatrix = selectedIndex != null ? lines[selectedIndex]?.matrixId : null;
  const targetMatrix = filter.matrixId ?? sourceMatrix;

  return lines.map((line) => {
    if (targetMatrix && line.matrixId !== targetMatrix) return line;
    if (!line.matrixId) return line;
    const merged = [...new Set([...line.testMethodIds, ...sourceTestMethodIds])];
    return { ...line, testMethodIds: merged };
  });
}

/** Parse pasted TSV/CSV rows into sample line drafts */
export function parsePastedSampleLines(
  text: string,
  defaultSampleType: string,
): SampleLineDraft[] {
  const rows = text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(/\t|,/).map((c) => c.trim()))
    .filter((cells) => cells.some((c) => c.length > 0));

  return rows.map((cells, i) => ({
    tempCode: cells[0] || `TMP-${String(i + 1).padStart(3, "0")}`,
    sampleName: cells[1] || cells[0] || "",
    matrixId: null,
    sampleType: cells[2] || defaultSampleType,
    quantity: cells[3] ?? "",
    unit: cells[4] ?? "",
    conditionNote: cells[5] ?? "",
    testMethodIds: [],
  }));
}

export const SAMPLE_LINE_IMPORT_COLUMNS: Record<string, string> = {
  "Mã tạm": "tempCode",
  "Tên mẫu": "sampleName",
  "Loại mẫu": "sampleType",
  "Khối lượng": "quantity",
  "ĐVT": "unit",
  "Điều kiện": "conditionNote",
  tempCode: "tempCode",
  sampleName: "sampleName",
  sampleType: "sampleType",
  quantity: "quantity",
  unit: "unit",
  conditionNote: "conditionNote",
};

export function rowsToSampleLineDrafts(
  rows: Record<string, string>[],
  defaultSampleType: string,
): SampleLineDraft[] {
  return rows.map((row, i) => ({
    tempCode: row.tempCode?.trim() || `TMP-${String(i + 1).padStart(3, "0")}`,
    sampleName: row.sampleName?.trim() || "",
    matrixId: null,
    sampleType: row.sampleType?.trim() || defaultSampleType,
    quantity: row.quantity?.trim() ?? "",
    unit: row.unit?.trim() ?? "",
    conditionNote: row.conditionNote?.trim() ?? "",
    testMethodIds: [],
  }));
}
