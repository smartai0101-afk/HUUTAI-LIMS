import { Suspense } from "react";
import { CalibrationEvaluationsClient } from "@/components/equipment/CalibrationEvaluationsClient";
import { getEquipmentOptions } from "@/lib/services/equipment-catalog";
import {
  getCalibrationRecords,
  listCalibrationEvaluations,
  parseCalibrationEvaluationListParams,
} from "@/lib/services/equipment-calibration";

export default async function CalibrationEvaluationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseCalibrationEvaluationListParams(params);
  const [result, equipmentOptions, calibrationRecords] = await Promise.all([
    listCalibrationEvaluations(query),
    getEquipmentOptions(),
    getCalibrationRecords(),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <CalibrationEvaluationsClient
        result={result}
        equipmentOptions={equipmentOptions}
        calibrationRecords={calibrationRecords}
        listQuery={query}
      />
    </Suspense>
  );
}
