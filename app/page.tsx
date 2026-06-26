import {
  getCriticalStockRows,
  getDashboardStats,
  getInventoryMix,
  getRecentUsageLogs,
} from "@/lib/services/dashboard";
import { getAlerts } from "@/lib/services/alerts";
import { getEquipmentDashboardStats } from "@/lib/services/equipment-dashboard";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function HomePage() {
  const [stats, alerts, inventoryMix, recentLogs, criticalRows, equipmentStats] = await Promise.all([
    getDashboardStats(),
    getAlerts(),
    getInventoryMix(),
    getRecentUsageLogs(5),
    getCriticalStockRows(8),
    getEquipmentDashboardStats(),
  ]);

  return (
    <DashboardClient
      stats={stats}
      alerts={alerts}
      inventoryMix={inventoryMix}
      recentLogs={recentLogs}
      criticalRows={criticalRows}
      equipmentStats={equipmentStats}
    />
  );
}
