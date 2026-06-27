import { db } from "@/lib/db";
import { toDateString } from "@/lib/mappers";

export type EquipmentOption = {
  id: string;
  code: string;
  name: string;
  calibrationExpiryDate: string;
  isCalibrationExpired: boolean;
};

export async function getEquipmentOptions(): Promise<EquipmentOption[]> {
  const now = new Date();
  const rows = await db.equipment.findMany({
    where: { status: { not: "Disposed" } },
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      calibrationExpiryDate: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    calibrationExpiryDate: row.calibrationExpiryDate ? toDateString(row.calibrationExpiryDate) : "",
    isCalibrationExpired: row.calibrationExpiryDate ? row.calibrationExpiryDate < now : false,
  }));
}
