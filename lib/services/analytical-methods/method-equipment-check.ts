import { db } from "@/lib/db";
import { computeScheduleStatus, scheduleStatusLabel } from "@/lib/equipment-schedule";
import { mapMethodEquipment } from "@/lib/mappers/analytical-methods";
import type { MethodEquipmentView } from "@/types/analytical-methods";

export async function listMethodEquipment(methodVersionId: string): Promise<MethodEquipmentView[]> {
  const rows = await db.methodEquipment.findMany({
    where: { methodVersionId },
    include: {
      equipment: {
        select: {
          code: true,
          name: true,
          status: true,
          calibrationExpiryDate: true,
        },
      },
    },
  });

  return rows.map((row) => {
    const calStatus = computeScheduleStatus(row.equipment.calibrationExpiryDate);
    return mapMethodEquipment({
      ...row,
      calibrationStatus: scheduleStatusLabel(calStatus),
    });
  });
}

export async function saveMethodEquipment(data: {
  id?: string;
  methodVersionId: string;
  workflowNodeKey?: string;
  equipmentId: string;
  role?: string;
}) {
  const payload = {
    methodVersionId: data.methodVersionId,
    workflowNodeKey: data.workflowNodeKey ?? "",
    equipmentId: data.equipmentId,
    role: data.role ?? "",
  };
  if (data.id) {
    return db.methodEquipment.update({ where: { id: data.id }, data: payload });
  }
  return db.methodEquipment.create({ data: payload });
}

export async function deleteMethodEquipment(id: string) {
  return db.methodEquipment.delete({ where: { id } });
}

export type EquipmentWarning = {
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  warnings: string[];
};

export async function checkMethodEquipmentWarnings(
  methodVersionId: string,
): Promise<EquipmentWarning[]> {
  const links = await listMethodEquipment(methodVersionId);
  const results: EquipmentWarning[] = [];

  for (const link of links) {
    const warnings: string[] = [];
    if (link.equipmentStatus !== "InUse") {
      warnings.push(`Thiết bị không ở trạng thái đang sử dụng (${link.equipmentStatus})`);
    }
    if (link.calibrationStatus.includes("Quá hạn")) {
      warnings.push("Hiệu chuẩn đã quá hạn");
    } else if (link.calibrationStatus.includes("Sắp đến hạn")) {
      warnings.push("Hiệu chuẩn sắp đến hạn (≤30 ngày)");
    }
    if (warnings.length > 0) {
      results.push({
        equipmentId: link.equipmentId,
        equipmentCode: link.equipmentCode,
        equipmentName: link.equipmentName,
        warnings,
      });
    }
  }

  return results;
}
