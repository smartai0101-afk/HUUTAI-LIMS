import { Suspense } from "react";
import { MaintenancePlansClient } from "@/components/equipment/MaintenancePlansClient";
import { getEquipmentOptions } from "@/lib/services/equipment-catalog";
import { listMaintenancePlans, parseMaintenancePlanListParams } from "@/lib/services/equipment-maintenance";

export default async function MaintenancePlansPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseMaintenancePlanListParams(params);
  const [result, equipmentOptions] = await Promise.all([
    listMaintenancePlans(query),
    getEquipmentOptions(),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <MaintenancePlansClient result={result} equipmentOptions={equipmentOptions} listQuery={query} />
    </Suspense>
  );
}
