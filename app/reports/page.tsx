"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuditTrail } from "@/components/AuditTrail";
import { StatCard } from "@/components/StatCard";
import { useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import { auditLogs, chemicals, solutions, standards } from "@/lib/data";
import { downloadCsv } from "@/lib/storage";
import {
  AlertTriangle,
  Archive,
  Beaker,
  Boxes,
  CalendarRange,
  FileDown,
  FlaskConical,
  Search,
  ShieldAlert,
} from "lucide-react";

const reportCards = [
  { id: "chemicals", title: "Tồn kho hoá chất", icon: Beaker, getValue: () => `${chemicals.length} items` },
  { id: "standards", title: "Tồn kho chất chuẩn", icon: Archive, getValue: () => `${standards.length} items` },
  { id: "solutions", title: "Dung dịch chuẩn", icon: FlaskConical, getValue: () => `${solutions.length} items` },
  { id: "expiry", title: "Hết hạn", icon: CalendarRange, getValue: () => "6 items" },
  { id: "usage", title: "Lịch sử sử dụng", icon: Boxes, getValue: () => "128 events" },
  { id: "dispose", title: "Huỷ", icon: ShieldAlert, getValue: () => "7 items" },
  { id: "audit", title: "Audit trail", icon: AlertTriangle, getValue: () => `${auditLogs.length} logs` },
];

export default function ReportsPage() {
  const [query, setQuery] = useState("");
  const { canViewAuditReports } = useRole();
  const { addToast } = useToast();

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) =>
      [log.user, log.action, log.object].some((value) =>
        value.toLowerCase().includes(query.toLowerCase()),
      ),
    );
  }, [query]);

  const handleExportCsv = () => {
    downloadCsv(
      "audit-export",
      filteredLogs.map((log) => ({
        time: log.time,
        user: log.user,
        action: log.action,
        object: log.object,
      })),
    );
    addToast("Đã export CSV thành công", "success");
  };

  const handleExportPdf = () => {
    addToast("Export started — PDF generation simulated", "info");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Analytics</p>
            <h1 className="text-2xl font-semibold text-slate-900">Báo cáo</h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
            >
              <FileDown className="h-4 w-4" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm text-white"
            >
              <FileDown className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reportCards.map((card) => (
            <StatCard key={card.id} title={card.title} value={card.getValue()} icon={card.icon} />
          ))}
        </div>

        {canViewAuditReports ? (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm audit log..."
                  className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-cyan-300"
                />
              </div>
            </div>
            <AuditTrail logs={filteredLogs} />
          </>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="font-medium text-slate-900">Audit trail không khả dụng</p>
            <p className="mt-1 text-sm text-slate-500">
              Role hiện tại không có quyền xem audit trail. Chuyển sang QA/QC, Analyst, Admin hoặc Lab Manager.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
