import type { PrismaClient } from "@prisma/client";
import { CalibrationResult } from "@prisma/client";
import { SEED_ASSETS } from "./assets";
import { parseDate } from "./helpers";

export async function seedExtendedEquipmentLifecycle(prisma: PrismaClient) {
  const gc = await prisma.equipment.findUnique({ where: { code: "EQ-GC-001" } });
  const hplc3 = await prisma.equipment.findUnique({ where: { code: "EQ-HPLC-003" } });
  const bal = await prisma.equipment.findUnique({ where: { code: "EQ-BAL-001" } });
  const hplc1 = await prisma.equipment.findUnique({ where: { code: "EQ-HPLC-001" } });
  const spCol = await prisma.sparePart.findUnique({ where: { code: "SP-COL-HPLC" } });

  if (gc) {
    const passRec = await prisma.calibrationRecord.create({
      data: {
        equipmentId: gc.id,
        calibrationDate: parseDate("2025-10-01"),
        certificateNo: "GC-HC-2025-001",
        result: CalibrationResult.Pass,
        deviation: "0.02 min RT",
        calibrationResults: [
          { result: "RT toluene 8.12 min", error: "±0.02", standardResult: "8.10 min", correctiveAction: "", notes: "" },
        ],
        certificatePath: SEED_ASSETS.equipment.hplc,
        vendor: "VietCal Lab",
        createdBy: "Seed",
        updatedBy: "Seed",
      },
    });
    await prisma.equipmentHistoryEvent.create({
      data: {
        equipmentId: gc.id,
        eventType: "Calibration",
        eventDate: parseDate("2025-10-01"),
        title: "Hiệu chuẩn GC Pass",
        description: "Kiểm tra RT và độ phân giải",
        sourceType: "CalibrationRecord",
        sourceId: passRec.id,
        createdBy: "Seed",
        updatedBy: "Seed",
      },
    });

    const failRec = await prisma.calibrationRecord.create({
      data: {
        equipmentId: gc.id,
        calibrationDate: parseDate("2024-10-05"),
        certificateNo: "GC-HC-2024-002",
        result: CalibrationResult.Fail,
        deviation: "Leak detector",
        calibrationResults: [
          { result: "Leak > 5 mL/min", error: "N/A", standardResult: "< 1 mL/min", correctiveAction: "Thay septa", notes: "" },
        ],
        certificatePath: SEED_ASSETS.equipment.maintenance,
        vendor: "VietCal Lab",
        createdBy: "Seed",
        updatedBy: "Seed",
      },
    });
    await prisma.equipmentHistoryEvent.create({
      data: {
        equipmentId: gc.id,
        eventType: "Calibration",
        eventDate: parseDate("2024-10-05"),
        title: "Hiệu chuẩn GC Fail",
        description: "Rò rỉ — đã khắc phục",
        sourceType: "CalibrationRecord",
        sourceId: failRec.id,
        createdBy: "Seed",
        updatedBy: "Seed",
      },
    });
  }

  if (hplc3) {
    const maint = await prisma.maintenanceLog.create({
      data: {
        equipmentId: hplc3.id,
        issueDate: parseDate("2026-05-10"),
        description: "Áp suất pump cao bất thường",
        rootCause: "Lọc mobile phase bị bít",
        action: "Thay filter + flush system",
        vendor: "Shimadzu VN",
        completedDate: parseDate("2026-05-12"),
        attachmentPaths: JSON.stringify([
          SEED_ASSETS.equipment.maintenance,
          SEED_ASSETS.equipment.hplc,
        ]),
        createdBy: "Seed",
        updatedBy: "Seed",
      },
    });
    await prisma.equipmentHistoryEvent.create({
      data: {
        equipmentId: hplc3.id,
        eventType: "Maintenance",
        eventDate: parseDate("2026-05-12"),
        title: "Bảo trì pump HPLC",
        description: "Hoàn thành — áp suất ổn định",
        sourceType: "MaintenanceLog",
        sourceId: maint.id,
        createdBy: "Seed",
        updatedBy: "Seed",
      },
    });

    const manual = await prisma.equipmentHistoryEvent.create({
      data: {
        equipmentId: hplc3.id,
        eventType: "Manual",
        eventDate: parseDate("2026-05-15"),
        title: "Lắp cột mới C18",
        description: "Ghi nhận sau thay SP-COL-HPLC",
        sourceType: "Manual",
        createdBy: "Seed",
        updatedBy: "Seed",
      },
    });
    await prisma.equipmentAttachment.createMany({
      data: [
        {
          entityType: "EquipmentHistoryEvent",
          entityId: manual.id,
          filePath: SEED_ASSETS.equipment.hplc,
          fileName: "hplc-column-install.jpg",
          createdBy: "Seed",
        },
        {
          entityType: "EquipmentHistoryEvent",
          entityId: manual.id,
          filePath: SEED_ASSETS.equipment.uvVis,
          fileName: "uv-detector-check.jpg",
          createdBy: "Seed",
        },
      ],
    });
  }

  if (bal) {
    const cal1 = await prisma.calibrationRecord.create({
      data: {
        equipmentId: bal.id,
        calibrationDate: parseDate("2026-03-01"),
        certificateNo: "BAL-HC-2026-001",
        result: CalibrationResult.Pass,
        calibrationResults: [{ result: "100g", error: "±0.0002 g", standardResult: "100.0000 g", correctiveAction: "", notes: "" }],
        certificatePath: SEED_ASSETS.equipment.balance,
        vendor: "Mettler Service",
        createdBy: "Seed",
        updatedBy: "Seed",
      },
    });
    const cal2 = await prisma.calibrationRecord.create({
      data: {
        equipmentId: bal.id,
        calibrationDate: parseDate("2025-09-01"),
        certificateNo: "BAL-HC-2025-002",
        result: CalibrationResult.Pass,
        calibrationResults: [{ result: "200g", error: "±0.0003 g", standardResult: "200.0000 g", correctiveAction: "", notes: "" }],
        certificatePath: SEED_ASSETS.equipment.balance,
        vendor: "Mettler Service",
        createdBy: "Seed",
        updatedBy: "Seed",
      },
    });
    await prisma.equipmentHistoryEvent.createMany({
      data: [
        {
          equipmentId: bal.id,
          eventType: "Calibration",
          eventDate: parseDate("2026-03-01"),
          title: "HC cân Pass 2026",
          sourceType: "CalibrationRecord",
          sourceId: cal1.id,
          createdBy: "Seed",
          updatedBy: "Seed",
        },
        {
          equipmentId: bal.id,
          eventType: "Calibration",
          eventDate: parseDate("2025-09-01"),
          title: "HC cân Pass 2025",
          sourceType: "CalibrationRecord",
          sourceId: cal2.id,
          createdBy: "Seed",
          updatedBy: "Seed",
        },
      ],
    });
  }

  if (hplc1 && spCol) {
    await prisma.sparePartUsage.create({
      data: {
        equipmentId: hplc1.id,
        sparePartId: spCol.id,
        quantity: 1,
        usedDate: parseDate("2026-05-20"),
        notes: "Thay cột C18 sau 2000 injection",
        createdBy: "Seed",
      },
    });
    await prisma.sparePart.update({
      where: { id: spCol.id },
      data: { stockQty: { decrement: 1 } },
    });
    await prisma.equipmentHistoryEvent.create({
      data: {
        equipmentId: hplc1.id,
        eventType: "SparePartReplacement",
        eventDate: parseDate("2026-05-20"),
        title: "Thay cột HPLC C18",
        description: `Xuất ${spCol.code} — còn tồn sau trừ`,
        sourceType: "Manual",
        createdBy: "Seed",
        updatedBy: "Seed",
      },
    });
  }

  console.log("  Extended equipment lifecycle: HC/BT/history/attachments");
}
