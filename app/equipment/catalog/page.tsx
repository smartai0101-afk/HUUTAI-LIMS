import { Suspense } from "react";
import { EquipmentCatalogClient } from "@/components/equipment/EquipmentCatalogClient";
import { getDepartments } from "@/lib/services/equipment-catalog";
import { getEquipmentManagers, listEquipment, parseEquipmentListParams } from "@/lib/services/equipment-list";

export default async function EquipmentCatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseEquipmentListParams(params);
  const [result, departments, managers] = await Promise.all([
    listEquipment(query, false),
    getDepartments(),
    getEquipmentManagers(),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <EquipmentCatalogClient
        result={result}
        departments={departments}
        managers={managers}
        listQuery={query}
      />
    </Suspense>
  );
}
