import { db } from "@/lib/db";
import {
  mapCalibrationPlan,
  mapCalibrationRecord,
  mapPostCalibrationEvaluation,
} from "@/lib/mappers/equipment";

const equipmentInclude = { equipment: { select: { id: true, code: true, name: true } } };

export async function getCalibrationPlans(equipmentId?: string) {
  const items = await db.calibrationPlan.findMany({
    where: equipmentId ? { equipmentId } : undefined,
    orderBy: [{ nextDate: "asc" }, { equipment: { code: "asc" } }],
    include: equipmentInclude,
  });
  return items.map(mapCalibrationPlan);
}

export async function getCalibrationRecords(equipmentId?: string) {
  const items = await db.calibrationRecord.findMany({
    where: equipmentId ? { equipmentId } : undefined,
    orderBy: [{ calibrationDate: "desc" }],
    include: {
      ...equipmentInclude,
      evaluation: true,
    },
  });
  return items.map(mapCalibrationRecord);
}

export async function getCalibrationEvaluations(equipmentId?: string) {
  const items = await db.postCalibrationEvaluation.findMany({
    where: equipmentId ? { equipmentId } : undefined,
    orderBy: [{ createdAt: "desc" }],
    include: {
      ...equipmentInclude,
      calibrationRecord: { select: { calibrationDate: true, certificateNo: true } },
    },
  });
  return items.map(mapPostCalibrationEvaluation);
}
