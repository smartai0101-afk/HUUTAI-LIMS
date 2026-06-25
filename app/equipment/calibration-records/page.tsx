import { Suspense } from "react";
import { CalibrationRecordsClient } from "@/components/equipment/CalibrationRecordsClient";
import { getEquipmentOptions } from "@/lib/services/equipment-catalog";
import { getCalibrationRecords } from "@/lib/services/equipment-calibration";

export default async function CalibrationRecordsPage() {
  const [items, equipmentOptions] = await Promise.all([
    getCalibrationRecords(),
    getEquipmentOptions(),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <CalibrationRecordsClient items={items} equipmentOptions={equipmentOptions} />
    </Suspense>
  );
}
