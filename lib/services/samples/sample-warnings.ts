import type { EquipmentStatus, SampleTest } from "@prisma/client";
import { db } from "@/lib/db";
import { computeScheduleStatus, scheduleStatusLabel } from "@/lib/equipment-schedule";

type TestWithLinks = SampleTest & {
  equipment?: {
    status: EquipmentStatus;
    calibrationExpiryDate: Date | null;
  } | null;
  chemicals?: { chemicalId: string }[];
  standards?: { standardId: string }[];
};

export async function getTestWarnings(test: TestWithLinks): Promise<string[]> {
  const warnings: string[] = [];

  if (test.equipment) {
    if (test.equipment.status !== "InUse") {
      warnings.push("Thiết bị không khả dụng hoặc cần kiểm tra hiệu chuẩn.");
    }
    const calStatus = computeScheduleStatus(test.equipment.calibrationExpiryDate);
    const label = scheduleStatusLabel(calStatus);
    if (label.includes("Quá hạn")) {
      warnings.push("Thiết bị không khả dụng hoặc cần kiểm tra hiệu chuẩn.");
    } else if (label.includes("Sắp đến hạn")) {
      warnings.push("Hiệu chuẩn thiết bị sắp đến hạn.");
    }
  }

  for (const link of test.chemicals ?? []) {
    const chemical = await db.chemical.findUnique({
      where: { id: link.chemicalId },
      select: { code: true, name: true, quantity: true, status: true, expiryDate: true },
    });
    if (!chemical) continue;
    if (chemical.status === "Expired" || (chemical.expiryDate && chemical.expiryDate < new Date())) {
      warnings.push("Hóa chất hoặc chất chuẩn không hợp lệ cho phép thử này.");
    }
    if (chemical.quantity <= 0) {
      warnings.push(`Hóa chất ${chemical.code} tồn kho không đủ.`);
    }
  }

  for (const link of test.standards ?? []) {
    const standard = await db.standard.findUnique({
      where: { id: link.standardId },
      select: { code: true, name: true, quantity: true, status: true, expiryDate: true },
    });
    if (!standard) continue;
    if (standard.status === "Expired" || (standard.expiryDate && standard.expiryDate < new Date())) {
      warnings.push("Hóa chất hoặc chất chuẩn không hợp lệ cho phép thử này.");
    }
    if (standard.quantity <= 0) {
      warnings.push(`Chuẩn ${standard.code} tồn kho không đủ.`);
    }
  }

  return [...new Set(warnings)];
}
