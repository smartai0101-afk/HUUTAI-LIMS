import { Suspense } from "react";
import { EquipmentDashboardClient } from "@/components/equipment/EquipmentDashboardClient";
import { getEquipmentDashboardData } from "@/lib/services/equipment-dashboard";

export default async function EquipmentDashboardPage() {
  const data = await getEquipmentDashboardData();

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <EquipmentDashboardClient
        stats={data.stats}
        upcomingCalibrations={[...data.overdueCalibrations, ...data.upcomingCalibrations]}
        upcomingMaintenance={[...data.overdueMaintenances, ...data.upcomingMaintenances]}
        lowSpareParts={data.lowSpareParts}
      />
    </Suspense>
  );
}
