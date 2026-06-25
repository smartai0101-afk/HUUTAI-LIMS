import { Suspense } from "react";
import { EquipmentCatalogClient } from "@/components/equipment/EquipmentCatalogClient";
import { getDepartments, getEquipmentList } from "@/lib/services/equipment-catalog";

export default async function EquipmentCatalogPage() {
  const [items, departments] = await Promise.all([getEquipmentList(), getDepartments()]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <EquipmentCatalogClient items={items} departments={departments} />
    </Suspense>
  );
}
