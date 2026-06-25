"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ScanLine } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import { inventoryItems as defaultInventoryItems } from "@/lib/data";
import { downloadCsv, readStorage, STORAGE_KEYS, writeStorage } from "@/lib/storage";
import { InventoryItem } from "@/types";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(defaultInventoryItems);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const { canEdit } = useRole();
  const { addToast } = useToast();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readStorage<InventoryItem[]>(STORAGE_KEYS.inventory, defaultInventoryItems);
      setItems(stored);
      setLoading(false);
    }, 250);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading) writeStorage(STORAGE_KEYS.inventory, items);
  }, [items, loading]);

  const rows = useMemo(() => {
    return items.filter(
      (item) =>
        item.code.toLowerCase().includes(query.toLowerCase()) ||
        item.name.toLowerCase().includes(query.toLowerCase()),
    );
  }, [items, query]);

  const handleStartCount = () => {
    if (!canEdit) {
      addToast("Role hiện tại không có quyền thực hiện kiểm kê", "error");
      return;
    }
    addToast("Đã bắt đầu phiên kiểm kê", "success");
  };

  const handleExport = () => {
    if (!rows.length) {
      addToast("Không có dữ liệu để export", "info");
      return;
    }
    downloadCsv(
      "inventory-report",
      rows.map((item) => ({
        code: item.code,
        name: item.name,
        expectedQty: item.expectedQty,
        countedQty: item.countedQty,
        difference: item.difference,
        location: item.location,
        status: item.status,
      })),
    );
    addToast("Đã export báo cáo kiểm kê", "success");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Cycle count</p>
            <h1 className="text-2xl font-semibold text-slate-900">Kiểm kê</h1>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
          >
            <Download className="h-4 w-4" />
            Export report
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
              <ScanLine className="h-4 w-4 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Scan / nhập QR giả lập (vd: CHEM-0001)"
                className="w-full bg-transparent text-sm outline-none sm:w-64"
              />
            </div>
            {canEdit ? (
              <button
                type="button"
                onClick={handleStartCount}
                className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-white"
              >
                Start inventory check
              </button>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
            <div className="mt-3 space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-12 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <ScanLine className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-medium text-slate-900">Chưa có dữ liệu kiểm kê</p>
            <p className="mt-1 text-sm text-slate-500">
              Nhấn &quot;Start inventory check&quot; để bắt đầu phiên kiểm kê mới.
            </p>
          </div>
        ) : (
          <DataTable
            columns={[
              { key: "code", header: "Code" },
              { key: "name", header: "Tên item" },
              { key: "expectedQty", header: "Expected" },
              { key: "countedQty", header: "Counted" },
              { key: "difference", header: "Difference" },
              { key: "location", header: "Vị trí" },
              {
                key: "status",
                header: "Trạng thái",
                render: (value) => <StatusBadge status={String(value)} />,
              },
            ]}
            rows={rows}
          />
        )}
      </div>
    </AppShell>
  );
}
