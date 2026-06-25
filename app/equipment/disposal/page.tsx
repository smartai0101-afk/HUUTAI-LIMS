import { Suspense } from "react";
import { DisposalClient } from "@/components/equipment/DisposalClient";
import { getEquipmentOptions } from "@/lib/services/equipment-catalog";
import { getDisposals } from "@/lib/services/equipment-disposal";

export default async function DisposalPage() {
  const [items, equipmentOptions] = await Promise.all([
    getDisposals(),
    getEquipmentOptions(),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <DisposalClient items={items} equipmentOptions={equipmentOptions} />
    </Suspense>
  );
}
