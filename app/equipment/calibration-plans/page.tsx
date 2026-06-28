import { Suspense } from "react";
import { CalibrationPlansClient } from "@/components/equipment/CalibrationPlansClient";
import { getEquipmentOptions } from "@/lib/services/equipment-catalog";
import { listCalibrationPlans, parseCalibrationPlanListParams } from "@/lib/services/equipment-calibration";

export default async function CalibrationPlansPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseCalibrationPlanListParams(params);
  const [result, equipmentOptions] = await Promise.all([
    listCalibrationPlans(query),
    getEquipmentOptions(),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <CalibrationPlansClient result={result} equipmentOptions={equipmentOptions} listQuery={query} />
    </Suspense>
  );
}
