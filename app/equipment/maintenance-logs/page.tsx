import { Suspense } from "react";
import { MaintenanceLogsClient } from "@/components/equipment/MaintenanceLogsClient";
import { getEquipmentOptions } from "@/lib/services/equipment-catalog";
import { getMaintenanceLogs } from "@/lib/services/equipment-maintenance";

export default async function MaintenanceLogsPage() {
  const [items, equipmentOptions] = await Promise.all([
    getMaintenanceLogs(),
    getEquipmentOptions(),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <MaintenanceLogsClient items={items} equipmentOptions={equipmentOptions} />
    </Suspense>
  );
}
