"use client";

import type { SampleMatrixView } from "@/types/catalog";

type Props = {
  lineCount: number;
  visibleCount: number;
  selectedRowCount: number;
  matrixFilter: string;
  searchQuery: string;
  matrices: SampleMatrixView[];
  filterActive: boolean;
  readOnly?: boolean;
  onMatrixFilterChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onClearFilters: () => void;
  onAddLine: () => void;
  onImport?: () => void;
  onCopyTests?: () => void;
  onBulkApply?: () => void;
  onDeleteSelected?: () => void;
  bulkMatrixId?: string;
  onBulkMatrixChange?: (v: string) => void;
  onApplyBulkMatrix?: () => void;
};

export function BulkActionToolbar({
  lineCount,
  visibleCount,
  selectedRowCount,
  matrixFilter,
  searchQuery,
  matrices,
  filterActive,
  readOnly,
  onMatrixFilterChange,
  onSearchChange,
  onClearFilters,
  onAddLine,
  onImport,
  onCopyTests,
  onBulkApply,
  onDeleteSelected,
  bulkMatrixId = "",
  onBulkMatrixChange,
  onApplyBulkMatrix,
}: Props) {
  const filterMatrixName = matrices.find((m) => m.id === matrixFilter)?.name;

  return (
    <div className="shrink-0 border-b border-slate-100 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-1 text-sm font-semibold text-slate-800">
          Danh sách mẫu
          <span className="ml-1 font-normal text-slate-500">
            ({filterActive ? `${visibleCount}/${lineCount}` : lineCount})
          </span>
        </h2>
        <input
          type="search"
          placeholder="Tìm tên / mã tạm..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="min-w-[140px] flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm sm:max-w-[180px]"
        />
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="whitespace-nowrap">Lọc xem:</span>
          <select
            value={matrixFilter}
            onChange={(e) => onMatrixFilterChange(e.target.value)}
            title="Chỉ lọc bảng — không gán nền mẫu. Gán nền ở cột Nền mẫu từng dòng."
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-800"
          >
            <option value="">Tất cả nền</option>
            {matrices.map((m) => (
              <option key={m.id} value={m.id}>
                {m.groupName ? `${m.groupName} · ` : ""}
                {m.name}
              </option>
            ))}
          </select>
        </label>
        {filterActive ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900 hover:bg-amber-100"
          >
            Xóa bộ lọc
          </button>
        ) : null}
        {!readOnly ? (
          <>
            <button
              type="button"
              onClick={onAddLine}
              className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-700"
            >
              + Thêm mẫu
            </button>
            {onImport ? (
              <button type="button" onClick={onImport} className="rounded-lg border px-3 py-1.5 text-xs">
                Import Excel
              </button>
            ) : null}
            {onCopyTests ? (
              <button type="button" onClick={onCopyTests} className="rounded-lg border px-3 py-1.5 text-xs">
                Copy chỉ tiêu
              </button>
            ) : null}
            {onBulkApply ? (
              <button type="button" onClick={onBulkApply} className="rounded-lg border px-3 py-1.5 text-xs">
                Áp dụng hàng loạt
              </button>
            ) : null}
            {selectedRowCount > 0 && onDeleteSelected ? (
              <button
                type="button"
                onClick={onDeleteSelected}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600"
              >
                Xóa ({selectedRowCount})
              </button>
            ) : null}
          </>
        ) : null}
      </div>
      {!readOnly && selectedRowCount > 0 && onBulkMatrixChange && onApplyBulkMatrix ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-cyan-100 bg-cyan-50/60 px-2.5 py-2">
          <span className="text-xs font-medium text-cyan-900">
            Gán nền cho {selectedRowCount} mẫu đã chọn:
          </span>
          <select
            value={bulkMatrixId}
            onChange={(e) => onBulkMatrixChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
          >
            <option value="">— Chọn nền mẫu —</option>
            {matrices.map((m) => (
              <option key={m.id} value={m.id}>
                {m.groupName ? `[${m.groupName}] ` : ""}
                {m.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!bulkMatrixId}
            onClick={onApplyBulkMatrix}
            className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            Áp dụng nền
          </button>
        </div>
      ) : null}
      {filterActive && visibleCount === 0 ? (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Đang lọc{filterMatrixName ? ` theo nền “${filterMatrixName}”` : ""}
          {searchQuery.trim() ? ` và từ khóa “${searchQuery.trim()}”` : ""} — không có dòng nào khớp
          trong {lineCount} mẫu. Các mẫu chưa gán nền sẽ không hiện khi lọc theo nền cụ thể.{" "}
          <button type="button" onClick={onClearFilters} className="font-medium underline">
            Xóa bộ lọc
          </button>{" "}
          hoặc gán nền ở cột <strong>Nền mẫu</strong>.
        </p>
      ) : null}
    </div>
  );
}
