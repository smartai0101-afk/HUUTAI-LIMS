"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Beaker,
  Boxes,
  CalendarRange,
  FileDown,
  Search,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuditTrail } from "@/components/AuditTrail";
import { StatCard } from "@/components/StatCard";
import { useRole } from "@/components/RoleProvider";
import { useToast } from "@/components/ToastProvider";
import { downloadCsv } from "@/lib/storage";
import type { AuditLogView } from "@/types";

export function ReportsClient({
  auditLogs,
  stats,
}: {
  auditLogs: AuditLogView[];
  stats: {
    chemicalCount: number;
    standardCount: number;
    containerCount: number;
    microbialStrainCount: number;
    preparedChemicalCount: number;
    preparedStandardCount: number;
    preparedStrainCount: number;
    usageLogCount: number;
    expiringCount: number;
    disposeCount: number;
  };
  containerExport: Array<Record<string, string | number>>;
  usageExport: Array<Record<string, string | number>>;
}) {
  const [query, setQuery] = useState("");
  const { canViewAuditReports } = useRole();
  const { addToast } = useToast();

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) =>
      [log.user, log.action, log.object].some((value) =>
        value.toLowerCase().includes(query.toLowerCase()),
      ),
    );
  }, [auditLogs, query]);

  const reportCards = [
    { id: "chemicals", title: "Hoá chất gốc", icon: Beaker, value: `${stats.chemicalCount}` },
    { id: "standards", title: "Chuẩn gốc", icon: Archive, value: `${stats.standardCount}` },
    { id: "microbial", title: "Chủng gốc VS", icon: Archive, value: `${stats.microbialStrainCount}` },
    { id: "pchem", title: "HC pha chế", icon: Beaker, value: `${stats.preparedChemicalCount}` },
    { id: "pstd", title: "Chuẩn pha chế", icon: Archive, value: `${stats.preparedStandardCount}` },
    { id: "pstrain", title: "Chủng pha chế", icon: Archive, value: `${stats.preparedStrainCount}` },
    { id: "containers", title: "Thống kê", icon: Boxes, value: `${stats.chemicalCount + stats.standardCount + stats.microbialStrainCount}` },
    { id: "expiry", title: "Sắp hết hạn", icon: CalendarRange, value: `${stats.expiringCount} items` },
    { id: "usage", title: "Lịch sử sử dụng", icon: Boxes, value: `${stats.usageLogCount} events` },
    { id: "dispose", title: "Chờ huỷ", icon: ShieldAlert, value: `${stats.disposeCount} items` },
    { id: "audit", title: "Audit trail", icon: AlertTriangle, value: `${auditLogs.length} logs` },
  ];

  const handleExportAudit = () => {
    downloadCsv(
      "audit-export",
      filteredLogs.map((log) => ({
        time: log.time,
        user: log.user,
        action: log.action,
        object: log.object,
        before: log.before,
        after: log.after,
      })),
    );
    addToast("Đã export CSV thành công", "success");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Analytics</p>
            <h1 className="text-2xl font-semibold text-slate-900">Báo cáo</h1>
          </div>
          <button
            type="button"
            onClick={handleExportAudit}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
          >
            <FileDown className="h-4 w-4" />
            Export audit CSV
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reportCards.map((card) => (
            <StatCard key={card.id} title={card.title} value={card.value} icon={card.icon} />
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
