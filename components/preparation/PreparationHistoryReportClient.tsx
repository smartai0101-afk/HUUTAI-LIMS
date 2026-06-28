"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Download, ExternalLink, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { FilterChipBar } from "@/components/FilterChipBar";
import { ListPaginationBar } from "@/components/ListPaginationBar";
import { useToast } from "@/components/ToastProvider";
import { fetchPreparationHistoryExport } from "@/lib/actions/list-export";
import { useListQueryState } from "@/lib/hooks/useListQueryState";
import type { PaginatedResult } from "@/lib/list-query";
import { exportToXlsx } from "@/lib/excel";
import { PREPARATION_WORKFLOW_FILTERS } from "@/lib/preparation-workflow-labels";
import {
  PREPARATION_HISTORY_REPORT_COLUMNS,
  preparationHistoryReportToExcelRows,
  type PreparationHistoryListParams,
  type PreparationHistoryReportRow,
} from "@/lib/services/preparation-history-report";

const TYPE_FILTERS = [
  { value: "All", label: "Tất cả loại" },
  { value: "CHEMICAL", label: "Hóa chất pha chế" },
  { value: "STANDARD", label: "Chuẩn pha chế" },
  { value: "STRAIN", label: "Chủng pha chế" },
] as const;

const WORKFLOW_FILTER_LABELS: Record<(typeof PREPARATION_WORKFLOW_FILTERS)[number], string> = {
  All: "Tất cả trạng thái",
  Draft: "Nháp",
  Prepared: "Đã pha chế",
  Checked: "Đã kiểm tra",
  Approved: "Đã duyệt",
  Rejected: "Bị từ chối",
  Cancelled: "Đã hủy",
};

export function PreparationHistoryReportClient({
  result,
  listQuery,
}: {
  result: PaginatedResult<PreparationHistoryReportRow>;
  listQuery: PreparationHistoryListParams;
}) {
  const { addToast } = useToast();
  const [pending, startTransition] = useTransition();
  const { setQuery, setFilter, setFilters, toggleSort, setPage, setLimit } = useListQueryState();

  const handleExport = () => {
    startTransition(async () => {
      const rows = await fetchPreparationHistoryExport(listQuery);
      exportToXlsx(
        "lich-su-pha-che",
        preparationHistoryReportToExcelRows(rows),
        PREPARATION_HISTORY_REPORT_COLUMNS,
      );
      addToast(`Đã export ${rows.length} dòng Excel`, "success");
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">ISO/IEC 17025</p>
            <h1 className="text-2xl font-semibold text-slate-900">Lịch sử pha chế</h1>
            <p className="mt-1 text-sm text-slate-600">
              Báo cáo truy xuất nguồn gốc — {result.total} lô · trang {result.page}/{result.totalPages}
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export Excel (15 cột)
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-3">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={listQuery.q}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm mã lô, tên, nguồn gốc, lô, người pha..."
              className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"
            />
          </div>
          <div className="relative w-full md:max-w-xs">
            <input
              value={listQuery.parentCodeFilter}
              onChange={(e) => setFilter("parentCodeFilter", e.target.value || null)}
              placeholder="Lọc mã nhóm (parentCode)..."
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300"
            />
          </div>

          <FilterChipBar
            options={TYPE_FILTERS.map((item) => ({ value: item.value, label: item.label }))}
            value={listQuery.typeFilter}
            onChange={(value) => setFilter("typeFilter", value === "All" ? null : value)}
          />

          <FilterChipBar
            options={PREPARATION_WORKFLOW_FILTERS.map((value) => ({
              value,
              label: WORKFLOW_FILTER_LABELS[value],
            }))}
            value={listQuery.statusFilter}
            onChange={(value) => setFilter("statusFilter", value === "All" ? null : value)}
          />

          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Từ ngày
              <input
                type="date"
                value={listQuery.dateFrom}
                onChange={(e) => setFilters({ dateFrom: e.target.value || null })}
                className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Đến ngày
              <input
                type="date"
                value={listQuery.dateTo}
                onChange={(e) => setFilters({ dateTo: e.target.value || null })}
                className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
              />
            </label>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <DataTable
            columns={[
              { key: "parentCode", header: "Mã nhóm", sortable: true, sortKey: "parentCode" },
              {
                key: "code",
                header: "Mã lô",
                sortable: true,
                sortKey: "code",
                render: (_value, row) => (
                  <Link href={row.detailHref} className="text-sky-700 hover:underline">
                    {row.code}
                  </Link>
                ),
              },
              { key: "type", header: "Loại", sortable: true, sortKey: "type" },
              { key: "name", header: "Tên thành phẩm", sortable: true, sortKey: "name" },
              { key: "preparedDate", header: "Ngày pha", sortable: true, sortKey: "preparedDate" },
              { key: "preparedBy", header: "Người pha", sortable: true, sortKey: "preparedBy" },
              { key: "approvedBy", header: "Người duyệt" },
              { key: "sourceOrigin", header: "Nguồn gốc" },
              { key: "sourceLot", header: "Số lô gốc" },
              { key: "quantityUsed", header: "Lượng sử dụng" },
              { key: "originalConcentration", header: "Nồng độ lý thuyết" },
              { key: "finalConcentration", header: "Nồng độ thực tế" },
              { key: "expiryDate", header: "Hạn sử dụng" },
              { key: "status", header: "Trạng thái", sortable: true, sortKey: "status" },
              { key: "notes", header: "Ghi chú" },
              {
                key: "detailHref",
                header: "",
                render: (_value, row) => (
                  <div className="flex flex-col gap-1">
                    <Link
                      href={row.detailHref}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-sky-700"
                    >
                      Chi tiết
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <Link
                      href={`/inventory-ledger?preparationId=${encodeURIComponent(row.preparationId)}`}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-sky-700"
                    >
                      Sổ cái
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                ),
              },
            ]}
            rows={result.items}
            sort={{
              sortBy: listQuery.sortBy,
              sortOrder: listQuery.sortOrder,
              sortActive: listQuery.sortActive,
              onSort: toggleSort,
            }}
            getRowKey={(row) => row.id}
          />
          <ListPaginationBar
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            limit={result.limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </div>
      </div>
    </AppShell>
  );
}
