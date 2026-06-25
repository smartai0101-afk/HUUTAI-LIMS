"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { useToast } from "@/components/ToastProvider";
import { USAGE_STATS_PERIOD_PRESETS, type UsageStatsPeriodPreset } from "@/lib/usage-log-fields";
import { downloadCsv } from "@/lib/storage";
import type {
  UsageEmployeeStatRow,
  UsageItemStatRow,
  UsagePeriodStatRow,
  UsagePurposeStatRow,
} from "@/lib/services/usage-log-stats";

function formatQuantities(rows: Array<{ unit: string; total: number }>) {
  if (rows.length === 0) return "—";
  return rows.map((row) => `${row.total} ${row.unit}`).join(", ");
}

export function UsageStatsPanel({
  employeeStats,
  itemStats,
  periodStatsByDay,
  periodStatsByWeek,
  periodStatsByMonth,
  purposeStats,
  employeeNames,
  statsPeriod,
  onPeriodChange,
}: {
  employeeStats: UsageEmployeeStatRow[];
  itemStats: UsageItemStatRow[];
  periodStatsByDay: UsagePeriodStatRow[];
  periodStatsByWeek: UsagePeriodStatRow[];
  periodStatsByMonth: UsagePeriodStatRow[];
  purposeStats: UsagePurposeStatRow[];
  employeeNames: string[];
  statsPeriod: UsageStatsPeriodPreset;
  onPeriodChange: (period: UsageStatsPeriodPreset) => void;
}) {
  const { addToast } = useToast();
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [periodGroup, setPeriodGroup] = useState<"day" | "week" | "month">("day");

  const periodStats =
    periodGroup === "week" ? periodStatsByWeek : periodGroup === "month" ? periodStatsByMonth : periodStatsByDay;

  const filteredEmployees = useMemo(() => {
    if (employeeFilter === "all") return employeeStats;
    return employeeStats.filter((row) => row.performedBy === employeeFilter);
  }, [employeeFilter, employeeStats]);

  const handleExport = () => {
    downloadCsv(
      "usage-stats-export",
      filteredEmployees.flatMap((row) =>
        row.quantities.length
          ? row.quantities.map((qty) => ({
              nhanVien: row.performedBy,
              soLan: row.transactionCount,
              use: row.useCount,
              out: row.outCount,
              in: row.inCount,
              dispose: row.disposeCount,
              donVi: qty.unit,
              tongSoLuong: qty.total,
              mucDichPhoBien: row.topPurpose,
            }))
          : [
              {
                nhanVien: row.performedBy,
                soLan: row.transactionCount,
                use: row.useCount,
                out: row.outCount,
                in: row.inCount,
                dispose: row.disposeCount,
                donVi: "",
                tongSoLuong: 0,
                mucDichPhoBien: row.topPurpose,
              },
            ],
      ),
    );
    addToast("Đã export CSV thống kê", "success");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {USAGE_STATS_PERIOD_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onPeriodChange(preset.id)}
                className={`rounded-xl px-3 py-2 text-sm ${
                  statsPeriod === preset.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="all">Tất cả nhân viên</option>
              {employeeNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Thống kê theo khoảng thời gian đã chọn trên server. Tổng số lượng được gom theo từng đơn vị riêng biệt.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-900">Theo nhân viên</h3>
          <div className="mt-4">
            <DataTable
              columns={[
                { key: "performedBy", header: "Nhân viên" },
                { key: "transactionCount", header: "Số lần" },
                {
                  key: "quantities",
                  header: "Tổng SL",
                  render: (_v, row) => formatQuantities(row.quantities),
                },
                {
                  key: "useCount",
                  header: "USE/OUT/IN/DISPOSE",
                  render: (_v, row) => `${row.useCount}/${row.outCount}/${row.inCount}/${row.disposeCount}`,
                },
                { key: "topPurpose", header: "Mục đích phổ biến" },
              ]}
              rows={filteredEmployees}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-900">Top vật tư tiêu hao</h3>
          <div className="mt-4">
            <DataTable
              columns={[
                { key: "sourceLabel", header: "Loại" },
                { key: "itemCode", header: "Mã" },
                { key: "itemName", header: "Tên" },
                { key: "transactionCount", header: "Số lần" },
                {
                  key: "quantities",
                  header: "Tổng SL",
                  render: (_v, row) => formatQuantities(row.quantities),
                },
              ]}
              rows={itemStats}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-900">Theo thời gian</h3>
            <select
              value={periodGroup}
              onChange={(e) => setPeriodGroup(e.target.value as "day" | "week" | "month")}
              className="h-9 rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
            </select>
          </div>
          <div className="mt-4">
            <DataTable
              columns={[
                { key: "period", header: "Kỳ" },
                { key: "transactionCount", header: "Số giao dịch" },
                {
                  key: "quantities",
                  header: "Tổng SL",
                  render: (_v, row) => formatQuantities(row.quantities),
                },
              ]}
              rows={periodStats}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-900">Theo mục đích</h3>
          <div className="mt-4">
            <DataTable
              columns={[
                { key: "purpose", header: "Mục đích" },
                { key: "count", header: "Số lần" },
              ]}
              rows={purposeStats}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
