"use client";

import { useMemo, useState } from "react";
import { BulkActionToolbar } from "./BulkActionToolbar";
import { MatrixCellSelect, matrixGroup } from "./MatrixCellSelect";
import type { SampleLineDraft } from "./SampleTable";
import type { SampleMatrixView } from "@/types/catalog";

export type { SampleLineDraft };

type Props = {
  lines: SampleLineDraft[];
  matrices: SampleMatrixView[];
  allMatrices?: SampleMatrixView[];
  defaultSampleType?: string;
  showAllMatrices?: boolean;
  onToggleShowAllMatrices?: () => void;
  onChange: (lines: SampleLineDraft[]) => void;
  onSelectLine: (index: number) => void;
  selectedIndex: number | null;
  readOnly?: boolean;
  onDuplicate?: (index: number) => void;
  onRemove?: (index: number) => void;
  onImport?: () => void;
  onCopyTests?: () => void;
  onBulkApply?: () => void;
};

const cellInput =
  "w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const readOnlyCell =
  "inline-flex min-h-[34px] items-center rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5 text-sm text-slate-600";

function lineDisplayName(line: SampleLineDraft): string {
  const name = line.sampleName.trim();
  if (name) return name;
  return line.tempCode.trim() || "Mẫu chưa đặt tên";
}

export function SampleGrid({
  lines,
  matrices,
  allMatrices,
  defaultSampleType = "",
  showAllMatrices,
  onToggleShowAllMatrices,
  onChange,
  onSelectLine,
  selectedIndex,
  readOnly,
  onDuplicate,
  onRemove,
  onImport,
  onCopyTests,
  onBulkApply,
}: Props) {
  const lookupMatrices = allMatrices ?? matrices;
  const [searchQuery, setSearchQuery] = useState("");
  const [matrixFilter, setMatrixFilter] = useState("");
  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set());
  const [bulkMatrixId, setBulkMatrixId] = useState("");

  const filteredIndices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => {
        if (matrixFilter && line.matrixId !== matrixFilter) return false;
        if (!q) return true;
        return (
          line.sampleName.toLowerCase().includes(q) ||
          line.tempCode.toLowerCase().includes(q)
        );
      })
      .map(({ index }) => index);
  }, [lines, searchQuery, matrixFilter]);

  const filterActive = Boolean(matrixFilter || searchQuery.trim());
  const unassignedCount = lines.filter((l) => !l.matrixId).length;

  function clearFilters() {
    setMatrixFilter("");
    setSearchQuery("");
  }

  function updateLine(index: number, patch: Partial<SampleLineDraft>) {
    onChange(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    onChange([
      ...lines,
      {
        tempCode: `TMP-${String(lines.length + 1).padStart(3, "0")}`,
        sampleName: "",
        matrixId: null,
        sampleType: defaultSampleType,
        quantity: "",
        unit: "",
        conditionNote: "",
        testMethodIds: [],
      },
    ]);
  }

  function toggleRowCheck(index: number) {
    setCheckedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function deleteSelected() {
    if (checkedRows.size === 0 || lines.length <= checkedRows.size) return;
    const toRemove = new Set(checkedRows);
    onChange(lines.filter((_, i) => !toRemove.has(i)));
    setCheckedRows(new Set());
  }

  function applyBulkMatrix() {
    if (!bulkMatrixId || checkedRows.size === 0) return;
    onChange(
      lines.map((l, i) =>
        checkedRows.has(i) ? { ...l, matrixId: bulkMatrixId, testMethodIds: [] } : l,
      ),
    );
    setCheckedRows(new Set());
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <BulkActionToolbar
        lineCount={lines.length}
        visibleCount={filteredIndices.length}
        selectedRowCount={checkedRows.size}
        matrixFilter={matrixFilter}
        searchQuery={searchQuery}
        matrices={matrices}
        filterActive={filterActive}
        readOnly={readOnly}
        onMatrixFilterChange={setMatrixFilter}
        onSearchChange={setSearchQuery}
        onClearFilters={clearFilters}
        onAddLine={addLine}
        onImport={onImport}
        onCopyTests={onCopyTests}
        onBulkApply={onBulkApply}
        onDeleteSelected={deleteSelected}
        bulkMatrixId={bulkMatrixId}
        onBulkMatrixChange={setBulkMatrixId}
        onApplyBulkMatrix={applyBulkMatrix}
      />
      {!readOnly && onToggleShowAllMatrices ? (
        <div className="shrink-0 border-b border-slate-100 px-3 py-1.5">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={Boolean(showAllMatrices)}
              onChange={onToggleShowAllMatrices}
              className="h-3.5 w-3.5"
            />
            Xem tất cả nền mẫu (không chỉ nhóm đã chọn ở header)
          </label>
        </div>
      ) : null}
      {!readOnly && unassignedCount > 0 && !filterActive ? (
        <p className="shrink-0 border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
          {unassignedCount}/{lines.length} mẫu chưa chọn nền — chọn ở cột{" "}
          <strong>Nền mẫu</strong> hoặc tick nhiều dòng rồi <strong>Gán nền hàng loạt</strong>.
        </p>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 shadow-sm">
            <tr>
              {!readOnly ? <th className="w-10 px-2 py-2" /> : null}
              <th className="w-12 px-2 py-2">STT</th>
              <th className="min-w-[100px] px-2 py-2">Mã tạm</th>
              <th className="min-w-[280px] px-2 py-2">Tên mẫu</th>
              <th className="min-w-[200px] px-2 py-2">
                Nền mẫu <span className="normal-case text-slate-400">(gán tại đây)</span>
              </th>
              <th className="min-w-[100px] px-2 py-2">
                Nhóm nền <span className="normal-case text-slate-400">(tự động)</span>
              </th>
              <th className="w-24 px-2 py-2">SL</th>
              <th className="w-24 px-2 py-2">ĐVT</th>
              <th className="min-w-[140px] px-2 py-2">Điều kiện</th>
              <th className="w-16 px-2 py-2 text-center">#CT</th>
              <th className="min-w-[100px] px-2 py-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredIndices.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 10 : 11} className="px-4 py-8 text-center">
                  {lines.length === 0 ? (
                    <span className="text-slate-500">Chưa có mẫu — bấm + Thêm mẫu hoặc Import Excel</span>
                  ) : filterActive ? (
                    <div className="space-y-2 text-sm text-slate-600">
                      <p>Không có mẫu phù hợp bộ lọc (0/{lines.length}).</p>
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm text-cyan-800"
                      >
                        Xóa bộ lọc — hiện tất cả {lines.length} mẫu
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-500">Không có mẫu</span>
                  )}
                </td>
              </tr>
            ) : (
              filteredIndices.map((index) => {
                const line = lines[index]!;
                const selected = selectedIndex === index;
                const missingMatrix = !line.matrixId;
                return (
                  <tr
                    key={line.id ?? index}
                    className={`cursor-pointer border-t border-slate-100 ${selected ? "bg-cyan-50/70" : "hover:bg-slate-50/80"} ${missingMatrix ? "bg-amber-50/30" : ""}`}
                    onClick={() => onSelectLine(index)}
                  >
                    {!readOnly ? (
                      <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={checkedRows.has(index)}
                          onChange={() => toggleRowCheck(index)}
                        />
                      </td>
                    ) : null}
                    <td className="px-2 py-1.5 text-slate-600">{index + 1}</td>
                    <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        className={cellInput}
                        value={line.tempCode}
                        disabled={readOnly}
                        onChange={(e) => updateLine(index, { tempCode: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        className={cellInput}
                        value={line.sampleName}
                        disabled={readOnly}
                        placeholder="Tên mẫu *"
                        onChange={(e) => updateLine(index, { sampleName: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <MatrixCellSelect
                        matrices={matrices}
                        value={line.matrixId}
                        disabled={readOnly}
                        onChange={(matrixId) =>
                          updateLine(index, { matrixId, testMethodIds: [] })
                        }
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className={readOnlyCell}
                        title="Tự động theo Nền mẫu — không nhập trực tiếp"
                      >
                        {matrixGroup(lookupMatrices, line.matrixId)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        className={`${cellInput} min-w-[72px]`}
                        value={line.quantity}
                        disabled={readOnly}
                        placeholder="SL"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateLine(index, { quantity: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        className={`${cellInput} min-w-[72px]`}
                        value={line.unit}
                        placeholder="đvt"
                        disabled={readOnly}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateLine(index, { unit: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        className={cellInput}
                        value={line.conditionNote}
                        disabled={readOnly}
                        placeholder="VD: 2–8°C"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateLine(index, { conditionNote: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center font-medium text-cyan-700">
                      {line.testMethodIds.length || line.testCount || 0}
                    </td>
                    <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        {!readOnly && onDuplicate ? (
                          <button
                            type="button"
                            className="rounded border px-2 py-0.5 text-xs"
                            onClick={() => onDuplicate(index)}
                          >
                            Nhân bản
                          </button>
                        ) : null}
                        {!readOnly && onRemove && lines.length > 1 ? (
                          <button
                            type="button"
                            className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600"
                            onClick={() => onRemove(index)}
                          >
                            Xóa
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { lineDisplayName };
