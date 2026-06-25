import { Suspense } from "react";
import { MaintenancePlansClient } from "@/components/equipment/MaintenancePlansClient";
import { getEquipmentOptions } from "@/lib/services/equipment-catalog";
import { getMaintenancePlans } from "@/lib/services/equipment-maintenance";

export default async function MaintenancePlansPage() {
  const [items, equipmentOptions] = await Promise.all([
    getMaintenancePlans(),
    getEquipmentOptions(),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <MaintenancePlansClient items={items} equipmentOptions={equipmentOptions} />
    </Suspense>
  );
}
