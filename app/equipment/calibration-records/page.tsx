import { Suspense } from "react";
import { CalibrationRecordsClient } from "@/components/equipment/CalibrationRecordsClient";
import { getEquipmentOptions } from "@/lib/services/equipment-catalog";
import { listCalibrationRecords, parseCalibrationRecordListParams } from "@/lib/services/equipment-calibration";

export default async function CalibrationRecordsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseCalibrationRecordListParams(params);
  const [result, equipmentOptions] = await Promise.all([
    listCalibrationRecords(query),
    getEquipmentOptions(),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <CalibrationRecordsClient result={result} equipmentOptions={equipmentOptions} listQuery={query} />
    </Suspense>
  );
}
