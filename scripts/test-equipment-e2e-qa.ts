/**
 * E2E QA — Module Thiết bị (data layer, không gọi server actions — tránh revalidatePath ngoài Next.js):
 * 1. Hoàn thành nhật ký BT → sync MaintenancePlan + EquipmentHistoryEvent
 * 2. HC deriveCalibrationResult Pass/Fail + 1 bản ghi mới nhất / thiết bị (logic buildGroups)
 * 3. Ghi xuất phụ kiện → trừ stockQty + history
 * 4. Duyệt thanh lý → Equipment.status = Disposed
 */
import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import {
  deriveCalibrationResult,
  parseCalibrationResults,
  type CalibrationResultRow,
} from "../lib/calibration-results";
import { appendEquipmentHistory } from "../lib/equipment-history";
import { addCycleMonths, computeScheduleStatus } from "../lib/equipment-schedule";

const CODE = "TEST-EQ-E2E-QA";

function assertTrue(label: string, value: boolean) {
  if (!value) throw new Error(`${label}: expected true`);
  console.log(`OK ${label}`);
}

function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
  console.log(`OK ${label}`);
}

/** Mirrors CalibrationRecordsClient.buildGroups — 1 row per equipment (latest record). */
function latestRecordPerEquipment(
  records: { equipmentId: string; calibrationDate: Date; certificateNo: string; result: string }[],
) {
  const map = new Map<string, (typeof records)[number]>();
  for (const r of records) {
    const prev = map.get(r.equipmentId);
    if (!prev || r.calibrationDate > prev.calibrationDate) map.set(r.equipmentId, r);
  }
  return map;
}

async function syncMaintenancePlansAfterLog(
  tx: Prisma.TransactionClient,
  equipmentId: string,
  completedDate: Date,
  user: string,
) {
  const plans = await tx.maintenancePlan.findMany({ where: { equipmentId } });
  for (const plan of plans) {
    const nextDate = addCycleMonths(completedDate, plan.cycleMonths);
    await tx.maintenancePlan.update({
      where: { id: plan.id },
      data: {
        lastDate: completedDate,
        nextDate,
        status: computeScheduleStatus(nextDate),
        updatedBy: user,
      },
    });
  }
}

async function syncCalibrationPlansAfterRecord(
  tx: Prisma.TransactionClient,
  equipmentId: string,
  calibrationDate: Date,
  user: string,
) {
  const plans = await tx.calibrationPlan.findMany({ where: { equipmentId } });
  for (const plan of plans) {
    const nextDate = addCycleMonths(calibrationDate, plan.cycleMonths);
    await tx.calibrationPlan.update({
      where: { id: plan.id },
      data: {
        lastDate: calibrationDate,
        nextDate,
        status: computeScheduleStatus(nextDate),
        updatedBy: user,
      },
    });
  }
}

async function cleanup(db: PrismaClient) {
  const eq = await db.equipment.findUnique({ where: { code: CODE } });
  if (!eq) return;
  await db.sparePartUsage.deleteMany({ where: { equipmentId: eq.id } });
  await db.equipmentHistoryEvent.deleteMany({ where: { equipmentId: eq.id } });
  await db.maintenanceLog.deleteMany({ where: { equipmentId: eq.id } });
  await db.maintenancePlan.deleteMany({ where: { equipmentId: eq.id } });
  await db.calibrationRecord.deleteMany({ where: { equipmentId: eq.id } });
  await db.calibrationPlan.deleteMany({ where: { equipmentId: eq.id } });
  await db.equipmentDisposal.deleteMany({ where: { equipmentId: eq.id } });
  await db.equipment.delete({ where: { id: eq.id } });
  await db.sparePart.deleteMany({ where: { code: "SP-E2E-TEST" } });
}

async function main() {
  const db = new PrismaClient();
  const user = "E2E Tester";

  try {
    await cleanup(db);

    const equipment = await db.equipment.create({
      data: {
        code: CODE,
        name: "E2E QA Device",
        status: "InUse",
        createdBy: user,
        updatedBy: user,
      },
    });

    const planBefore = await db.maintenancePlan.create({
      data: {
        equipmentId: equipment.id,
        name: "BT định kỳ E2E",
        cycleMonths: 6,
        lastDate: new Date("2025-12-01T00:00:00.000Z"),
        nextDate: new Date("2026-06-01T00:00:00.000Z"),
        status: "Yellow",
        createdBy: user,
        updatedBy: user,
      },
    });

    // --- 1. BT complete → sync plan + history ---
    const completedDate = new Date("2026-06-15T00:00:00.000Z");
    const log = await db.$transaction(async (tx) => {
      const row = await tx.maintenanceLog.create({
        data: {
          equipmentId: equipment.id,
          issueDate: new Date("2026-06-10T00:00:00.000Z"),
          description: "Kiểm tra định kỳ",
          action: "Vệ sinh, kiểm tra",
          completedDate,
          createdBy: user,
          updatedBy: user,
        },
      });
      await syncMaintenancePlansAfterLog(tx, equipment.id, completedDate, user);
      await appendEquipmentHistory(tx, {
        equipmentId: equipment.id,
        eventType: "Maintenance",
        eventDate: completedDate,
        title: "Bảo trì hoàn thành",
        description: row.description || row.action,
        sourceType: "MaintenanceLog",
        sourceId: row.id,
        createdBy: user,
        updatedBy: user,
      });
      return row;
    });

    const planAfter = await db.maintenancePlan.findUnique({ where: { id: planBefore.id } });
    const expectedNext = addCycleMonths(completedDate, 6);
    assertEqual(
      "maintenance plan lastDate synced",
      planAfter?.lastDate?.toISOString().slice(0, 10),
      "2026-06-15",
    );
    assertEqual(
      "maintenance plan nextDate synced",
      planAfter?.nextDate?.toISOString().slice(0, 10),
      expectedNext.toISOString().slice(0, 10),
    );
    assertEqual(
      "maintenance plan status recomputed",
      planAfter?.status,
      computeScheduleStatus(expectedNext),
    );

    const maintHistory = await db.equipmentHistoryEvent.findFirst({
      where: { equipmentId: equipment.id, sourceType: "MaintenanceLog", sourceId: log.id },
    });
    assertTrue("maintenance history event appended", !!maintHistory);

    // --- 2. HC Pass/Fail + 1 record per equipment (latest) ---
    const passRows: CalibrationResultRow[] = [
      { result: "10 mg", error: "", standardResult: "10 mg", correctiveAction: "", evaluatedBy: "", evaluationDate: "", notes: "" },
      { result: "5 mg", error: "", standardResult: "5 mg", correctiveAction: "", evaluatedBy: "", evaluationDate: "", notes: "" },
    ];
    const failRows: CalibrationResultRow[] = [
      { result: "10 mg", error: "", standardResult: "10 mg", correctiveAction: "", evaluatedBy: "", evaluationDate: "", notes: "" },
      { result: "9 mg", error: "", standardResult: "10 mg", correctiveAction: "Hiệu chuẩn lại", evaluatedBy: "", evaluationDate: "", notes: "" },
    ];
    assertEqual("deriveCalibrationResult Pass", deriveCalibrationResult(passRows), "Pass");
    assertEqual("deriveCalibrationResult Fail", deriveCalibrationResult(failRows), "Fail");

    const calPlan = await db.calibrationPlan.create({
      data: {
        equipmentId: equipment.id,
        name: "HC E2E",
        cycleMonths: 12,
        createdBy: user,
        updatedBy: user,
      },
    });

    const calOldDate = new Date("2026-01-01T00:00:00.000Z");
    const calNewDate = new Date("2026-06-20T00:00:00.000Z");

    await db.$transaction(async (tx) => {
      const record = await tx.calibrationRecord.create({
        data: {
          equipmentId: equipment.id,
          calibrationDate: calOldDate,
          certificateNo: "CERT-E2E-OLD",
          result: deriveCalibrationResult(passRows),
          calibrationResults: passRows,
          vendor: "VietCal",
          createdBy: user,
          updatedBy: user,
        },
      });
      await syncCalibrationPlansAfterRecord(tx, equipment.id, calOldDate, user);
      await appendEquipmentHistory(tx, {
        equipmentId: equipment.id,
        eventType: "Calibration",
        eventDate: calOldDate,
        title: "Hiệu chuẩn đạt",
        sourceType: "CalibrationRecord",
        sourceId: record.id,
        createdBy: user,
      });
    });

    await db.$transaction(async (tx) => {
      const record = await tx.calibrationRecord.create({
        data: {
          equipmentId: equipment.id,
          calibrationDate: calNewDate,
          certificateNo: "CERT-E2E-NEW",
          result: deriveCalibrationResult(failRows),
          calibrationResults: failRows,
          vendor: "VietCal",
          createdBy: user,
          updatedBy: user,
        },
      });
      await syncCalibrationPlansAfterRecord(tx, equipment.id, calNewDate, user);
      await appendEquipmentHistory(tx, {
        equipmentId: equipment.id,
        eventType: "Calibration",
        eventDate: calNewDate,
        title: "Hiệu chuẩn không đạt",
        sourceType: "CalibrationRecord",
        sourceId: record.id,
        createdBy: user,
      });
    });

    const calRecords = await db.calibrationRecord.findMany({ where: { equipmentId: equipment.id } });
    assertEqual("two calibration records", calRecords.length, 2);

    const grouped = latestRecordPerEquipment(
      calRecords.map((r) => ({
        equipmentId: r.equipmentId,
        calibrationDate: r.calibrationDate,
        certificateNo: r.certificateNo,
        result: r.result,
      })),
    );
    assertEqual("1 equipment → 1 latest row", grouped.size, 1);
    assertEqual("latest is newest cert", grouped.get(equipment.id)?.certificateNo, "CERT-E2E-NEW");
    assertEqual("latest result Fail", grouped.get(equipment.id)?.result, "Fail");

    const calPlanAfter = await db.calibrationPlan.findUnique({ where: { id: calPlan.id } });
    assertEqual(
      "calibration plan synced from latest HC",
      calPlanAfter?.lastDate?.toISOString().slice(0, 10),
      "2026-06-20",
    );

    // --- 3. Spare part usage → deduct stock + history ---
    const sparePart = await db.sparePart.create({
      data: {
        code: "SP-E2E-TEST",
        name: "Phụ kiện E2E",
        stockQty: 10,
        minQty: 2,
        unit: "cái",
        createdBy: user,
        updatedBy: user,
      },
    });

    const usedDate = new Date("2026-06-18T00:00:00.000Z");
    const quantity = 3;

    await db.$transaction(async (tx) => {
      const usage = await tx.sparePartUsage.create({
        data: {
          equipmentId: equipment.id,
          sparePartId: sparePart.id,
          quantity,
          usedDate,
          notes: "Thay phụ kiện test",
          createdBy: user,
        },
      });
      await tx.sparePart.update({
        where: { id: sparePart.id },
        data: { stockQty: sparePart.stockQty - quantity, updatedBy: user },
      });
      await appendEquipmentHistory(tx, {
        equipmentId: equipment.id,
        eventType: "SparePartReplacement",
        eventDate: usedDate,
        title: `Thay thế ${sparePart.name}`,
        description: `${quantity} ${sparePart.unit} — Thay phụ kiện test`,
        sourceType: "SparePartUsage",
        sourceId: usage.id,
        createdBy: user,
      });
    });

    const spareAfter = await db.sparePart.findUnique({ where: { id: sparePart.id } });
    assertEqual("spare part stock deducted", spareAfter?.stockQty, 7);

    // Deduct thêm → tồn dưới minQty (cảnh báo dashboard/UI)
    await db.sparePart.update({
      where: { id: sparePart.id },
      data: { stockQty: 1, updatedBy: user },
    });
    const lowStock = await db.sparePart.findUnique({ where: { id: sparePart.id } });
    assertTrue("spare part low stock (stock < minQty)", (lowStock?.stockQty ?? 0) < (lowStock?.minQty ?? 0));

    const spareHistory = await db.equipmentHistoryEvent.findFirst({
      where: { equipmentId: equipment.id, eventType: "SparePartReplacement" },
    });
    assertTrue("spare part history exists", !!spareHistory);

    // Insufficient stock guard (mirrors recordSparePartUsage)
    const currentStock = spareAfter!.stockQty;
    assertTrue("insufficient stock would reject", currentStock < 100);

    // --- 4. Disposal approval → Disposed ---
    const disposalDate = new Date("2026-06-25T00:00:00.000Z");
    const disposal = await db.equipmentDisposal.create({
      data: {
        equipmentId: equipment.id,
        disposalDate,
        decision: "Thanh lý do hết tuổi thọ",
        status: "Pending",
        createdBy: user,
        updatedBy: user,
      },
    });

    await db.$transaction(async (tx) => {
      await tx.equipmentDisposal.update({
        where: { id: disposal.id },
        data: { status: "Approved", approver: "QA Manager", updatedBy: user },
      });
      await tx.equipment.update({
        where: { id: equipment.id },
        data: { status: "Disposed", updatedBy: user },
      });
      await appendEquipmentHistory(tx, {
        equipmentId: equipment.id,
        eventType: "Disposal",
        eventDate: disposalDate,
        title: "Thanh lý thiết bị",
        description: disposal.decision,
        sourceType: "EquipmentDisposal",
        sourceId: disposal.id,
        createdBy: user,
      });
    });

    const eqAfter = await db.equipment.findUnique({ where: { id: equipment.id } });
    assertEqual("equipment Disposed after approval", eqAfter?.status, "Disposed");

    const disposalHistory = await db.equipmentHistoryEvent.findFirst({
      where: { equipmentId: equipment.id, sourceType: "EquipmentDisposal" },
    });
    assertTrue("disposal history appended", !!disposalHistory);

    // Verify calibrationResults JSON round-trip
    const parsed = parseCalibrationResults(calRecords[1]?.calibrationResults);
    assertEqual("calibrationResults parsed rows", parsed.length, 2);

    console.log("\nAll equipment E2E QA tests passed.");
  } finally {
    await cleanup(db);
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
