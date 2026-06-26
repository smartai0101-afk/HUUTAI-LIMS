"use client";

import Link from "next/link";
import { AlertTriangle, Wrench } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { StatCard } from "@/components/StatCard";
import { ScheduleStatusBadge } from "@/components/equipment/ScheduleStatusBadge";
import { formatDate } from "@/lib/utils";
import { DASHBOARD_LABELS, EQUIPMENT_COLUMN, EQUIPMENT_SUBTITLE, SPARE_PART } from "@/lib/equipment-labels";
import type {
  CalibrationPlanView,
  EquipmentDashboardStats,
  MaintenancePlanView,
  SparePartView,
} from "@/types";

type Props = {
  stats: EquipmentDashboardStats;
  upcomingCalibrations: CalibrationPlanView[];
  upcomingMaintenance: MaintenancePlanView[];
  lowSpareParts: SparePartView[];
};

export function EquipmentDashboardClient({
  stats,
  upcomingCalibrations,
  upcomingMaintenance,
  lowSpareParts,
}: Props) {
  return (
    <div className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">{EQUIPMENT_SUBTITLE}</p>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard thiết bị</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Tổng thiết bị" value={`${stats.totalCount}`} icon={Wrench} />
          <StatCard title="Đang dùng" value={`${stats.inUseCount}`} icon={Wrench} />
          <StatCard title="Bảo trì" value={`${stats.maintenanceCount}`} icon={Wrench} tone="warning" />
          <StatCard title="Hỏng" value={`${stats.brokenCount}`} icon={AlertTriangle} tone="danger" />
          <StatCard title={DASHBOARD_LABELS.overdueCalibration} value={`${stats.overdueCalibrationCount}`} icon={AlertTriangle} tone="danger" />
          <StatCard title={DASHBOARD_LABELS.upcomingCalibration} value={`${stats.upcomingCalibrationCount}`} icon={AlertTriangle} tone="warning" />
          <StatCard title={DASHBOARD_LABELS.overdueMaintenance} value={`${stats.overdueMaintenanceCount}`} icon={AlertTriangle} tone="danger" />
          <StatCard title="Phụ kiện thấp" value={`${stats.lowSparePartCount}`} icon={AlertTriangle} tone="warning" />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Hiệu chuẩn sắp đến / quá hạn</h2>
              <Link href="/equipment/calibration-plans" className="text-sm text-cyan-700 hover:underline">
                Xem tất cả
              </Link>
            </div>
            <DataTable
              columns={[
                { key: "equipmentCode", header: EQUIPMENT_COLUMN.equipmentCode },
                { key: "name", header: "Kế hoạch" },
                { key: "nextDate", header: EQUIPMENT_COLUMN.nextCalibration, render: (v) => (v ? formatDate(String(v)) : "-") },
                { key: "status", header: "Trạng thái", render: (v) => <ScheduleStatusBadge status={String(v)} /> },
              ]}
              rows={upcomingCalibrations}
              getRowKey={(row) => row.id}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Bảo trì sắp đến / quá hạn</h2>
              <Link href="/equipment/maintenance-plans" className="text-sm text-cyan-700 hover:underline">
                Xem tất cả
              </Link>
            </div>
            <DataTable
              columns={[
                { key: "equipmentCode", header: EQUIPMENT_COLUMN.equipmentCode },
                { key: "name", header: "Kế hoạch" },
                { key: "nextDate", header: EQUIPMENT_COLUMN.maintenanceNext, render: (v) => (v ? formatDate(String(v)) : "-") },
                { key: "status", header: "Trạng thái", render: (v) => <ScheduleStatusBadge status={String(v)} /> },
              ]}
              rows={upcomingMaintenance}
              getRowKey={(row) => row.id}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Phụ kiện tồn kho thấp</h2>
            <Link href="/equipment/spare-parts" className="text-sm text-cyan-700 hover:underline">
              Xem tất cả
            </Link>
          </div>
          <DataTable
            columns={[
              { key: "code", header: SPARE_PART.code },
              { key: "name", header: SPARE_PART.name },
              { key: "manufacturer", header: SPARE_PART.manufacturer },
              { key: "stockQty", header: SPARE_PART.stockQty },
              { key: "minQty", header: SPARE_PART.minQty },
              { key: "unit", header: SPARE_PART.unit },
            ]}
            rows={lowSpareParts}
            getRowKey={(row) => row.id}
          />
        </div>
      </div>
  );
}
