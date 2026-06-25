"use client";

import type { StockInSourceType } from "@prisma/client";
import { Download } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { useToast } from "@/components/ToastProvider";
import { downloadCsv } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import type { StockInLogView } from "@/types";

const typeFilters: Array<{ value: "all" | StockInSourceType; label: string }> = [
  { value: "all", label: "Tất cả loại" },
  { value: "Chemical", label: "Hoá chất gốc" },
  { value: "Standard", label: "Chất chuẩn gốc" },
  { value: "MicrobialStrain", label: "Chủng gốc vi sinh" },
];

export function StockInHistoryTable({
  items,
  filter,
  onFilterChange,
}: {
  items: StockInLogView[];
  filter: "all" | StockInSourceType;
  onFilterChange: (value: "all" | StockInSourceType) => void;
}) {
  const { addToast } = useToast();

  const filtered = items.filter((item) => filter === "all" || item.sourceType === filter);

  const handleExport = () => {
    downloadCsv(
      "lich-su-nhap-kho",
      filtered.map((item) => ({
        ngayNhap: formatDate(item.time),
        loai: item.sourceLabel,
        ma: item.sourceCode,
        ten: item.sourceName,
        lot: item.lot,
        soLuongNhap: item.quantityIn,
        donVi: item.unit,
        nguoiNhap: item.user,
        ghiChu: item.notes,
        referenceId: item.referenceId,
      })),
    );
    addToast("Đã export CSV thành công", "success");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {typeFilters.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onFilterChange(option.value)}
              className={`rounded-xl px-3 py-2 text-sm ${
                filter === option.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <DataTable
        columns={[
          { key: "time", header: "Ngày nhập", render: (v) => formatDate(String(v)) },
          { key: "sourceLabel", header: "Loại" },
          { key: "sourceCode", header: "Mã" },
          { key: "sourceName", header: "Tên" },
          { key: "lot", header: "Lot" },
          { key: "quantityIn", header: "Số lượng nhập" },
          { key: "unit", header: "Đơn vị" },
          { key: "user", header: "Người nhập" },
          { key: "notes", header: "Ghi chú" },
        ]}
        rows={filtered}
      />
    </div>
  );
}
