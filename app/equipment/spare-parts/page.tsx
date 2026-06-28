import { Suspense } from "react";
import { SparePartsClient } from "@/components/equipment/SparePartsClient";
import { getEquipmentOptions } from "@/lib/services/equipment-catalog";
import { listSpareParts, parseSparePartListParams } from "@/lib/services/equipment-spare-parts";

export default async function SparePartsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseSparePartListParams(params);
  const [result, equipmentOptions] = await Promise.all([
    listSpareParts(query),
    getEquipmentOptions(),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <SparePartsClient result={result} equipmentOptions={equipmentOptions} listQuery={query} />
    </Suspense>
  );
}
