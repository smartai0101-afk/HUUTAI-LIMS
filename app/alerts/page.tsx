"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AlertPanel } from "@/components/AlertPanel";
import { useToast } from "@/components/ToastProvider";
import { alerts as defaultAlerts } from "@/lib/data";
import { downloadCsv, readStorage, writeStorage, STORAGE_KEYS } from "@/lib/storage";

export default function AlertsPage() {
  const [query, setQuery] = useState("");
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    const stored = readStorage<string[]>(STORAGE_KEYS.reviewedAlerts, []);
    setReviewedIds(stored);
  }, []);

  const alertsWithReview = useMemo(
    () =>
      defaultAlerts.map((alert) => ({
        ...alert,
        reviewed: reviewedIds.includes(alert.id),
      })),
    [reviewedIds],
  );

  const filtered = useMemo(() => {
    return alertsWithReview.filter(
      (alert) =>
        alert.title.toLowerCase().includes(query.toLowerCase()) ||
        alert.description.toLowerCase().includes(query.toLowerCase()) ||
        (alert.itemCode?.toLowerCase().includes(query.toLowerCase()) ?? false),
    );
  }, [alertsWithReview, query]);

  const handleMarkReviewed = (id: string) => {
    setReviewedIds((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      writeStorage(STORAGE_KEYS.reviewedAlerts, next);
      return next;
    });
    addToast("Đã đánh dấu cảnh báo là reviewed", "success");
  };

  const handleExport = () => {
    downloadCsv(
      "alerts-export",
      filtered.map((item) => ({
        title: item.title,
        severity: item.severity,
        type: item.type,
        date: item.date,
        itemCode: item.itemCode ?? "",
        reviewed: item.reviewed ? "Yes" : "No",
      })),
    );
    addToast("Đã export CSV thành công", "success");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Monitoring</p>
            <h1 className="text-2xl font-semibold text-slate-900">Cảnh báo</h1>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm cảnh báo..."
              className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"
            />
          </div>
        </div>
        <AlertPanel alerts={filtered} showActions onMarkReviewed={handleMarkReviewed} />
      </div>
    </AppShell>
  );
}
