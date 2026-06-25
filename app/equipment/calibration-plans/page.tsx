import { Suspense } from "react";
import { CalibrationPlansClient } from "@/components/equipment/CalibrationPlansClient";
import { getEquipmentOptions } from "@/lib/services/equipment-catalog";
import { getCalibrationPlans } from "@/lib/services/equipment-calibration";

export default async function CalibrationPlansPage() {
  const [items, equipmentOptions] = await Promise.all([
    getCalibrationPlans(),
    getEquipmentOptions(),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <CalibrationPlansClient items={items} equipmentOptions={equipmentOptions} />
    </Suspense>
  );
}
