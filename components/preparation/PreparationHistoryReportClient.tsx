"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, ExternalLink, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { FilterChipBar } from "@/components/FilterChipBar";
import { useToast } from "@/components/ToastProvider";
import { exportToXlsx } from "@/lib/excel";
import {
  PREPARATION_HISTORY_REPORT_COLUMNS,
  preparationHistoryReportToExcelRows,
  type PreparationHistoryReportRow,
} from "@/lib/services/preparation-history-report";
import { PREPARATION_WORKFLOW_FILTERS } from "@/lib/preparation-workflow-labels";

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
  Cancelled: "Đã hủy",
};

export function PreparationHistoryReportClient({ rows }: { rows: PreparationHistoryReportRow[] }) {
  const { addToast } = useToast();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_FILTERS)[number]["value"]>("All");
  const [statusFilter, setStatusFilter] =
    useState<(typeof PREPARATION_WORKFLOW_FILTERS)[number]>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const matchType = typeFilter === "All" || row.preparationType === typeFilter;
      const matchStatus =
        statusFilter === "All" || row.status === WORKFLOW_FILTER_LABELS[statusFilter];
      const matchFrom = !dateFrom || row.preparedDate >= dateFrom;
      const matchTo = !dateTo || row.preparedDate <= dateTo;
      const q = query.toLowerCase();
      const matchQuery =
        !q ||
        [
          row.code,
          row.name,
          row.preparedBy,
          row.approvedBy,
          row.sourceOrigin,
          row.sourceLot,
          row.notes,
        ].some((value) => value.toLowerCase().includes(q));
      return matchType && matchStatus && matchFrom && matchTo && matchQuery;
    });
  }, [rows, query, typeFilter, statusFilter, dateFrom, dateTo]);

  const handleExport = () => {
    exportToXlsx(
      "lich-su-pha-che",
      preparationHistoryReportToExcelRows(filtered),
      PREPARATION_HISTORY_REPORT_COLUMNS,
    );
    addToast(`Đã export ${filtered.length} dòng Excel`, "success");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">ISO/IEC 17025</p>
            <h1 className="text-2xl font-semibold text-slate-900">Lịch sử pha chế</h1>
            <p className="mt-1 text-sm text-slate-600">
              Báo cáo truy xuất nguồn gốc — {filtered.length}/{rows.length} dòng
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
          >
            <Download className="h-4 w-4" />
            Export Excel (14 cột)
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-3">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm mã, tên, nguồn gốc, lô, người pha..."
              className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"
            />
          </div>

          <FilterChipBar
            options={TYPE_FILTERS.map((item) => ({ value: item.value, label: item.label }))}
            value={typeFilter}
            onChange={(value) => setTypeFilter(value as (typeof TYPE_FILTERS)[number]["value"])}
          />

          <FilterChipBar
            options={PREPARATION_WORKFLOW_FILTERS.map((value) => ({
              value,
              label: WORKFLOW_FILTER_LABELS[value],
            }))}
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(value as (typeof PREPARATION_WORKFLOW_FILTERS)[number])
            }
          />

          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Từ ngày
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Đến ngày
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
              />
            </label>
          </div>
        </div>

        <DataTable
          columns={[
            {
              key: "code",
              header: "Mã pha chế",
              render: (_value, row) => (
                <Link href={row.detailHref} className="text-sky-700 hover:underline">
                  {row.code}
                </Link>
              ),
            },
            { key: "type", header: "Loại" },
            { key: "name", header: "Tên thành phẩm" },
            { key: "preparedDate", header: "Ngày pha" },
            { key: "preparedBy", header: "Người pha" },
            { key: "approvedBy", header: "Người duyệt" },
            { key: "sourceOrigin", header: "Nguồn gốc" },
            { key: "sourceLot", header: "Số lô gốc" },
            { key: "quantityUsed", header: "Lượng sử dụng" },
            { key: "originalConcentration", header: "Nồng độ gốc" },
            { key: "finalConcentration", header: "Nồng độ sau pha" },
            { key: "expiryDate", header: "Hạn sử dụng" },
            { key: "status", header: "Trạng thái" },
            { key: "notes", header: "Ghi chú" },
            {
              key: "detailHref",
              header: "",
              render: (_value, row) => (
                <Link
                  href={row.detailHref}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-sky-700"
                >
                  Chi tiết
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ),
            },
          ]}
          rows={filtered}
          getRowKey={(row) => row.id}
        />
      </div>
    </AppShell>
  );
}
