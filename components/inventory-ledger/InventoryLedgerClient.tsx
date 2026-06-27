"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { FilterChipBar } from "@/components/FilterChipBar";
import { useToast } from "@/components/ToastProvider";
import { downloadCsv } from "@/lib/storage";
import type { InventoryLedgerRow } from "@/lib/services/inventory-ledger";
import { INVENTORY_TRANSACTION_TYPE_LABELS } from "@/lib/services/inventory-transaction-types";

const actionFilters = ["All", "Deduct", "Restore"];
const txTypeFilters = ["All", ...Object.keys(INVENTORY_TRANSACTION_TYPE_LABELS)];

export function InventoryLedgerClient({
  rows,
  initialPreparationId = "",
}: {
  rows: InventoryLedgerRow[];
  initialPreparationId?: string;
}) {
  const { addToast } = useToast();
  const [query, setQuery] = useState("");
  const [preparationFilter, setPreparationFilter] = useState(initialPreparationId);
  const [actionFilter, setActionFilter] = useState("All");
  const [txTypeFilter, setTxTypeFilter] = useState("All");

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const matchAction = actionFilter === "All" || row.actionType === actionFilter;
      const matchTxType = txTypeFilter === "All" || row.transactionType === txTypeFilter;
      const matchPrep =
        !preparationFilter.trim() ||
        row.relatedPreparationId === preparationFilter.trim() ||
        row.referenceId === preparationFilter.trim();
      const matchQuery = [row.sourceCode, row.lotNumber, row.user, row.module, row.notes, row.reason].some(
        (v) => v.toLowerCase().includes(query.toLowerCase()),
      );
      return matchAction && matchTxType && matchPrep && matchQuery;
    });
  }, [rows, query, preparationFilter, actionFilter, txTypeFilter]);

  const handleExport = () => {
    downloadCsv(
      "so-cai-ton-kho",
      filtered.map((row) => ({
        ...row,
        stockLotId: row.stockLotId ?? "",
      })),
    );
    addToast("Đã export CSV", "success");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Inventory</p>
            <h1 className="text-2xl font-semibold text-slate-900">Sổ cái tồn kho</h1>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm mã vật tư, lot, user..."
                className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"
              />
            </div>
            <input
              value={preparationFilter}
              onChange={(e) => setPreparationFilter(e.target.value)}
              placeholder="Lọc theo preparationId..."
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-cyan-300 md:max-w-xs"
            />
          </div>
          <FilterChipBar
            options={actionFilters.map((v) => ({ value: v, label: v === "All" ? "Action cũ" : v }))}
            value={actionFilter}
            onChange={setActionFilter}
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
            value={txTypeFilter}
            onChange={setTxTypeFilter}
          />
        </div>

        <DataTable
          columns={[
            { key: "time", header: "Thời gian" },
            { key: "sourceCode", header: "Mã vật tư" },
            { key: "lotNumber", header: "Lot" },
            { key: "transactionType", header: "TX Engine" },
            { key: "actionType", header: "Action" },
            { key: "reason", header: "Lý do" },
            { key: "quantityBefore", header: "Trước" },
            { key: "quantityUsed", header: "Biến động" },
            { key: "quantityAfter", header: "Sau" },
            { key: "unit", header: "ĐVT" },
            { key: "module", header: "Module" },
            { key: "user", header: "User" },
            { key: "referenceType", header: "Tham chiếu" },
          ]}
          rows={filtered}
          getRowKey={(row) => row.id}
        />
      </div>
    </AppShell>
  );
}
