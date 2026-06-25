import { Suspense } from "react";
import { SparePartsClient } from "@/components/equipment/SparePartsClient";
import { getEquipmentOptions } from "@/lib/services/equipment-catalog";
import { getSpareParts } from "@/lib/services/equipment-spare-parts";

export default async function SparePartsPage() {
  const [items, equipmentOptions] = await Promise.all([
    getSpareParts(),
    getEquipmentOptions(),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <SparePartsClient items={items} equipmentOptions={equipmentOptions} />
    </Suspense>
  );
}
