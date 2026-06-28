import { Suspense } from "react";
import { DisposalClient } from "@/components/equipment/DisposalClient";
import { getEquipmentOptions } from "@/lib/services/equipment-catalog";
import { listDisposals, parseDisposalListParams } from "@/lib/services/equipment-disposal";

export default async function DisposalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseDisposalListParams(params);
  const [result, equipmentOptions] = await Promise.all([
    listDisposals(query),
    getEquipmentOptions(),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <DisposalClient result={result} equipmentOptions={equipmentOptions} listQuery={query} />
    </Suspense>
  );
}
