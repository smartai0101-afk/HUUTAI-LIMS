import { Suspense } from "react";
import { MaintenanceLogsClient } from "@/components/equipment/MaintenanceLogsClient";
import { getEquipmentOptions } from "@/lib/services/equipment-catalog";
import { listMaintenanceLogs, parseMaintenanceLogListParams } from "@/lib/services/equipment-maintenance";

export default async function MaintenanceLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseMaintenanceLogListParams(params);
  const [result, equipmentOptions] = await Promise.all([
    listMaintenanceLogs(query),
    getEquipmentOptions(),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <MaintenanceLogsClient result={result} equipmentOptions={equipmentOptions} listQuery={query} />
    </Suspense>
  );
}
