import {
  getCriticalStockRows,
  getDashboardStats,
  getInventoryMix,
  getRecentUsageLogs,
} from "@/lib/services/dashboard";
import { getAlerts } from "@/lib/services/alerts";
import { getEquipmentDashboardStats } from "@/lib/services/equipment-dashboard";
import { getLimsIsoKpis } from "@/lib/services/lims-dashboard-kpi";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function HomePage() {
  const [stats, alerts, inventoryMix, recentLogs, criticalRows, equipmentStats, limsKpis] =
    await Promise.all([
    getDashboardStats(),
    getAlerts(),
    getInventoryMix(),
    getRecentUsageLogs(5),
    getCriticalStockRows(8),
    getEquipmentDashboardStats(),
    getLimsIsoKpis(),
  ]);

  return (
    <DashboardClient
      stats={stats}
      alerts={alerts}
      inventoryMix={inventoryMix}
      recentLogs={recentLogs}
      criticalRows={criticalRows}
      equipmentStats={equipmentStats}
      limsKpis={limsKpis}
    />
  );
}
