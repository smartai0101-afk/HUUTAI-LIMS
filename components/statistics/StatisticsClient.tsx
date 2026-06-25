"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Download, NotebookPen, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { CoaLink } from "@/components/standards/CoaLink";
import { useToast } from "@/components/ToastProvider";
import { STANDARD_STATUS_FILTERS } from "@/lib/standard-status";
import { downloadCsv } from "@/lib/storage";
import type { InventoryStatRow, InventoryStatSourceType } from "@/types";

const sourceFilters: Array<{ value: "all" | InventoryStatSourceType; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "chemical", label: "Hoá chất gốc" },
  { value: "standard", label: "Chất chuẩn gốc" },
  { value: "microbial", label: "Chủng gốc vi sinh" },
];

export function StatisticsClient({ items }: { items: InventoryStatRow[] }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<(typeof sourceFilters)[number]["value"]>("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STANDARD_STATUS_FILTERS)[number]>("All");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchQuery = [item.code, item.name, item.manufacturer, item.casOrProductNumber, item.lot, item.notes].some(
        (value) => value.toLowerCase().includes(query.toLowerCase()),
      );
      const matchSource = sourceFilter === "all" || item.sourceType === sourceFilter;
      const matchStatus = statusFilter === "All" || item.status === statusFilter;
      return matchQuery && matchSource && matchStatus;
    });
  }, [items, query, sourceFilter, statusFilter]);

  const handleExport = () => {
    downloadCsv(
      "thong-ke-export",
      filtered.map((item) => ({
        loai: item.sourceLabel,
        ma: item.code,
        ten: item.name,
        hangSanXuat: item.manufacturer,
        casOrProductNumber: item.casOrProductNumber,
        lotNumber: item.lot,
        purity: item.purity,
        coa: item.coaPath || "Không có COA",
        donVi: item.unit,
        soLuongTon: item.quantity,
        viTriLuu: item.storageLocation,
        trangThai: item.status,
        ghiChu: item.notes,
      })),
    );
    addToast("Đã export CSV thành công", "success");
  };

  const handleRowClick = (row: InventoryStatRow) => {
    router.push(`${row.detailHref}?code=${encodeURIComponent(row.code)}`);
  };

  const handleLogUsage = (row: InventoryStatRow) => {
    const sourceType =
      row.sourceType === "chemical"
        ? "Chemical"
        : row.sourceType === "standard"
          ? "Standard"
          : "MicrobialStrain";
    router.push(
      `/usage-logs?tab=journal&openForm=1&sourceType=${sourceType}&code=${encodeURIComponent(row.code)}`,
    );
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Tổng hợp vật tư gốc</p>
            <h1 className="text-2xl font-semibold text-slate-900">Thống kê</h1>
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

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm mã, tên, lot, hãng..."
                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {sourceFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setSourceFilter(filter.value)}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    sourceFilter === filter.value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {STANDARD_STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    statusFilter === status ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {status === "All" ? "Tất cả trạng thái" : status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DataTable
          columns={[
            {
              key: "code",
              header: "Mã",
              render: (_v, row) => (
                <div className="flex items-center gap-2">
                  {row.stockLots.length > 1 ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleExpanded(row.id);
                      }}
                      className="rounded p-0.5 text-slate-500 hover:bg-slate-100"
                      aria-label="Xem tồn theo lot"
                    >
                      {expandedIds.has(row.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  ) : null}
                  <span>{row.code}</span>
                </div>
              ),
            },
            { key: "name", header: "Tên" },
            { key: "manufacturer", header: "Hãng sản xuất" },
            { key: "casOrProductNumber", header: "CAS/PRODUCT NUMBER" },
            {
              key: "lot",
              header: "Lot number",
              render: (_v, row) =>
                row.stockLots.length > 1 ? `${row.stockLots.length} lot` : row.lot || row.stockLots[0]?.lot || "—",
            },
            { key: "purity", header: "Purity" },
            { key: "coaPath", header: "COA", render: (_v, row) => <CoaLink path={row.coaPath} /> },
            { key: "unit", header: "Đơn vị" },
            { key: "quantity", header: "Số lượng tồn" },
            { key: "storageLocation", header: "Vị trí lưu" },
            { key: "status", header: "Trạng thái", render: (v) => <StatusBadge status={String(v)} /> },
            { key: "notes", header: "Ghi chú" },
          ]}
          rows={filtered}
          onRowClick={handleRowClick}
          rowActionsHeader="Ghi nhật ký"
          rowActions={(row) => (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleLogUsage(row);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <NotebookPen className="h-3.5 w-3.5" />
              Ghi sử dụng
            </button>
          )}
          expandedRowKeys={[...expandedIds]}
          getRowKey={(row) => row.id}
          renderExpandedRow={(row) =>
            row.stockLots.length > 1 ? (
              <div className="space-y-2 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tồn theo lot</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="px-3 py-2">Lot</th>
                        <th className="px-3 py-2">Số lượng</th>
                        <th className="px-3 py-2">Đơn vị</th>
                        <th className="px-3 py-2">Hạn dùng</th>
                        <th className="px-3 py-2">Vị trí</th>
                        <th className="px-3 py-2">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.stockLots.map((lot) => (
                        <tr key={lot.id} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-medium text-slate-800">{lot.lot}</td>
                          <td className="px-3 py-2">{lot.quantity}</td>
                          <td className="px-3 py-2">{lot.unit}</td>
                          <td className="px-3 py-2">{lot.expiryDate || "—"}</td>
                          <td className="px-3 py-2">{lot.storageLocation || "—"}</td>
                          <td className="px-3 py-2">
                            <StatusBadge status={lot.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null
          }
        />
      </div>
    </AppShell>
  );
}
