"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Beaker,
  Boxes,
  ChartColumn,
  Package,
  ShieldCheck,
  Syringe,
  Wrench,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AlertPanel } from "@/components/AlertPanel";
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { AlertItem, DashboardStats, EquipmentDashboardStats, UsageLogView } from "@/types";

type CriticalRow = {
  code: string;
  name: string;
  quantity: string;
  expiryDate: string;
  status: string;
};

type InventoryGroup = { label: string; value: number; color: string };

export function DashboardClient({
  stats,
  alerts: initialAlerts,
  inventoryMix,
  recentLogs,
  criticalRows,
  equipmentStats,
}: {
  stats: DashboardStats;
  alerts: AlertItem[];
  inventoryMix: InventoryGroup[];
  recentLogs: UsageLogView[];
  criticalRows: CriticalRow[];
  equipmentStats: EquipmentDashboardStats;
}) {
  const [alerts] = useState(initialAlerts);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Overview</p>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          </div>
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
          >
            <ChartColumn className="h-4 w-4" />
            Báo cáo
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          <StatCard title="Hoá chất gốc" value={`${stats.chemicalCount}`} change="Catalog" icon={Beaker} />
          <StatCard title="Chuẩn gốc" value={`${stats.standardCount}`} change="Catalog" icon={ShieldCheck} />
          <StatCard title="Chủng gốc VS" value={`${stats.microbialStrainCount}`} change="Catalog" icon={Package} />
          <StatCard title="HC pha chế" value={`${stats.preparedChemicalCount}`} change="Prepared" icon={Beaker} />
          <StatCard title="Chuẩn pha chế" value={`${stats.preparedStandardCount}`} change="Prepared" icon={ShieldCheck} />
          <StatCard title="Chủng pha chế" value={`${stats.preparedStrainCount}`} change="Prepared" icon={Syringe} />
          <StatCard title="Lot tồn kho" value={`${stats.containerCount}`} change="StockLot" icon={Package} />
          <StatCard title="Sắp hết hạn" value={`${stats.expiringSoon}`} change="30 ngày" icon={AlertTriangle} tone="warning" />
          <StatCard title="Tồn kho thấp" value={`${stats.lowStock}`} change="Review" icon={Boxes} tone="warning" />
          <StatCard title="Chờ huỷ" value={`${stats.pendingDisposal}`} change="Pending" icon={Syringe} tone="danger" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Thiết bị" value={`${equipmentStats.totalCount}`} icon={Wrench} />
          <StatCard title="HC quá hạn" value={`${equipmentStats.overdueCalibrationCount}`} icon={AlertTriangle} tone="danger" />
          <StatCard title="BT quá hạn" value={`${equipmentStats.overdueMaintenanceCount}`} icon={AlertTriangle} tone="danger" />
          <StatCard title="Phụ kiện thấp" value={`${equipmentStats.lowSparePartCount}`} icon={AlertTriangle} tone="warning" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/stock-in" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200">Nhập kho</Link>
          <Link href="/containers" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200">Thống kê</Link>
          <Link href="/equipment/catalog" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200">Danh mục TB</Link>
          <Link href="/inventory-ledger" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200">Sổ cái tồn</Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Inventory mix</p>
                <h3 className="mt-1 font-semibold text-slate-900">Tồn kho theo nhóm</h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Live
              </span>
            </div>
            <div className="mt-5 flex items-end gap-3">
              {inventoryMix.map((group) => (
                <div key={group.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-52 w-full items-end rounded-2xl bg-slate-50 p-3">
                    <div className={`${group.color} w-full rounded-xl`} style={{ height: `${Math.max(group.value, 8)}%` }} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{group.label}</span>
                  <span className="text-xs text-slate-500">{group.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900">Compliance status</h3>
            <div className="mt-4 space-y-3">
              {[
                { label: "Lot đang tồn", value: `${stats.containerCount} lot`, tone: "bg-cyan-500", width: "85%" },
                { label: "Expiry risk", value: `${stats.expiringSoon} items`, tone: "bg-amber-500", width: `${Math.min(stats.expiringSoon * 15, 100)}%` },
                { label: "Low stock", value: `${stats.lowStock} items`, tone: "bg-rose-500", width: `${Math.min(stats.lowStock * 20, 100)}%` },
                { label: "Pending disposal", value: `${stats.pendingDisposal} items`, tone: "bg-violet-500", width: `${Math.min(stats.pendingDisposal * 25, 100)}%` },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div className={`h-2 rounded-full ${item.tone}`} style={{ width: item.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Hoạt động gần đây</h3>
              <Link href="/usage-logs" className="text-sm text-cyan-700">Xem tất cả</Link>
            </div>
            <div className="mt-4 space-y-3">
              {recentLogs.length === 0 ? (
                <p className="text-sm text-slate-500">Chưa có nhật ký sử dụng</p>
              ) : (
                recentLogs.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                    <div>
                      <p className="font-medium text-slate-900">{tx.itemName}</p>
                      <p className="text-sm text-slate-500">
                        {tx.sourceLabel} · {tx.itemCode} · {tx.performedBy} · {tx.purpose}
                      </p>
                    </div>
                    <StatusBadge status={tx.type} />
                  </div>
                ))
              )}
            </div>
          </div>

          <AlertPanel alerts={alerts.slice(0, 8)} showActions />
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-slate-900">Tồn kho quan trọng</h3>
          <DataTable
            columns={[
              { key: "code", header: "Mã" },
              { key: "name", header: "Tên" },
              { key: "quantity", header: "Tồn kho" },
              { key: "expiryDate", header: "Hạn dùng", render: (value) => formatDate(String(value)) },
              { key: "status", header: "Trạng thái", render: (value) => <StatusBadge status={String(value)} /> },
            ]}
            rows={criticalRows}
          />
        </div>
      </div>
    </AppShell>
  );
}
