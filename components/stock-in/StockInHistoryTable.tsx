"use client";

import type { StockInSourceType } from "@prisma/client";
import { Download, Search } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { ListPaginationBar } from "@/components/ListPaginationBar";
import { useToast } from "@/components/ToastProvider";
import { useListQueryState } from "@/lib/hooks/useListQueryState";
import type { PaginatedResult } from "@/lib/list-query";
import type { StockInHistoryListParams } from "@/lib/services/stock-in-history";
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
  listResult,
  listQuery,
}: {
  listResult: PaginatedResult<StockInLogView>;
  listQuery: StockInHistoryListParams;
}) {
  const { addToast } = useToast();
  const { setQuery, setFilter, toggleSort, setPage, setLimit } = useListQueryState();

  const handleExport = () => {
    downloadCsv(
      "lich-su-nhap-kho",
      listResult.items.map((item) => ({
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
              onClick={() => setFilter("sourceFilter", option.value === "all" ? null : option.value)}
              className={`rounded-xl px-3 py-2 text-sm ${
                listQuery.sourceFilter === option.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={listQuery.q}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm mã, tên, lot, người nhập..."
          className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <DataTable
          columns={[
            {
              key: "time",
              header: "Ngày nhập",
              sortable: true,
              sortKey: "time",
              render: (v) => formatDate(String(v)),
            },
            {
              key: "sourceLabel",
              header: "Loại",
              sortable: true,
              sortKey: "sourceType",
            },
            { key: "sourceCode", header: "Mã", sortable: true, sortKey: "sourceCode" },
            { key: "sourceName", header: "Tên", sortable: true, sortKey: "sourceName" },
            { key: "lot", header: "Lot", sortable: true, sortKey: "lot" },
            { key: "quantityIn", header: "Số lượng nhập", sortable: true, sortKey: "quantityIn" },
            { key: "unit", header: "Đơn vị", sortable: true, sortKey: "unit" },
            { key: "user", header: "Người nhập", sortable: true, sortKey: "user" },
            { key: "notes", header: "Ghi chú", sortable: true, sortKey: "notes" },
          ]}
          rows={listResult.items}
          sort={{
            sortBy: listQuery.sortBy,
            sortOrder: listQuery.sortOrder,
            sortActive: listQuery.sortActive,
            onSort: toggleSort,
          }}
        />
        <ListPaginationBar
          page={listResult.page}
          totalPages={listResult.totalPages}
          total={listResult.total}
          limit={listResult.limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>
    </div>
  );
}
