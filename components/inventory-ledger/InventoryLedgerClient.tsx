"use client";

import { useTransition } from "react";
import { Download, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { FilterChipBar } from "@/components/FilterChipBar";
import { ListPaginationBar } from "@/components/ListPaginationBar";
import { useToast } from "@/components/ToastProvider";
import { fetchInventoryLedgerExport } from "@/lib/actions/list-export";
import { useListQueryState } from "@/lib/hooks/useListQueryState";
import type { PaginatedResult } from "@/lib/list-query";
import type { InventoryLedgerListParams, InventoryLedgerRow } from "@/lib/services/inventory-ledger";
import { INVENTORY_TRANSACTION_TYPE_LABELS } from "@/lib/services/inventory-transaction-types";
import { downloadCsv } from "@/lib/storage";

const actionFilters = ["All", "Deduct", "Restore"];
const txTypeFilters = ["All", ...Object.keys(INVENTORY_TRANSACTION_TYPE_LABELS)];

export function InventoryLedgerClient({
  result,
  listQuery,
}: {
  result: PaginatedResult<InventoryLedgerRow>;
  listQuery: InventoryLedgerListParams;
}) {
  const { addToast } = useToast();
  const [pending, startTransition] = useTransition();
  const { setQuery, setFilter, toggleSort, setPage, setLimit } = useListQueryState();

  const handleExport = () => {
    startTransition(async () => {
      const rows = await fetchInventoryLedgerExport(listQuery);
      downloadCsv(
        "so-cai-ton-kho",
        rows.map((row) => ({
          ...row,
          stockLotId: row.stockLotId ?? "",
        })),
      );
      addToast(`Đã export ${rows.length} dòng CSV`, "success");
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Inventory</p>
            <h1 className="text-2xl font-semibold text-slate-900">Sổ cái tồn kho</h1>
            <p className="mt-1 text-sm text-slate-600">
              {result.total} bản ghi · trang {result.page}/{result.totalPages}
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={listQuery.q}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm mã vật tư, lot, user..."
                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"
              />
            </div>
            <input
              value={listQuery.preparationFilter}
              onChange={(e) => setFilter("preparationFilter", e.target.value || null)}
              placeholder="Lọc theo preparationId..."
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300 md:max-w-xs"
            />
          </div>
          <FilterChipBar
            options={actionFilters.map((v) => ({ value: v, label: v === "All" ? "Action cũ" : v }))}
            value={listQuery.actionFilter}
            onChange={(value) => setFilter("actionFilter", value === "All" ? null : value)}
          />
          <FilterChipBar
            options={txTypeFilters.map((v) => ({
              value: v,
              label:
                v === "All"
                  ? "Loại TX"
                  : INVENTORY_TRANSACTION_TYPE_LABELS[
                      v as keyof typeof INVENTORY_TRANSACTION_TYPE_LABELS
                    ] ?? v,
            }))}
            value={listQuery.txTypeFilter}
            onChange={(value) => setFilter("txTypeFilter", value === "All" ? null : value)}
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <DataTable
            columns={[
              { key: "time", header: "Thời gian", sortable: true, sortKey: "time" },
              { key: "sourceCode", header: "Mã vật tư", sortable: true, sortKey: "sourceCode" },
              { key: "lotNumber", header: "Lot" },
              { key: "transactionType", header: "TX Engine", sortable: true, sortKey: "transactionType" },
              { key: "actionType", header: "Action" },
              { key: "reason", header: "Lý do" },
              { key: "quantityBefore", header: "Trước" },
              { key: "quantityUsed", header: "Biến động" },
              { key: "quantityAfter", header: "Sau" },
              { key: "unit", header: "ĐVT" },
              { key: "module", header: "Module", sortable: true, sortKey: "module" },
              { key: "user", header: "User", sortable: true, sortKey: "user" },
              { key: "referenceType", header: "Tham chiếu" },
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
