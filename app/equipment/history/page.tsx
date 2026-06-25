import { Suspense } from "react";
import { EquipmentHistoryClient } from "@/components/equipment/EquipmentHistoryClient";
import { getEquipmentOptions } from "@/lib/services/equipment-catalog";
import { getHistoryEvents } from "@/lib/services/equipment-history";

export default async function EquipmentHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ equipmentId?: string }>;
}) {
  const { equipmentId } = await searchParams;
  const [events, equipmentOptions] = await Promise.all([
    getHistoryEvents(),
    getEquipmentOptions(),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <EquipmentHistoryClient
        events={events}
        equipmentOptions={equipmentOptions}
        initialEquipmentId={equipmentId}
      />
    </Suspense>
  );
}
