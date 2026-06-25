import { PrismaClient } from "@prisma/client";
import { appendEquipmentHistory } from "../lib/equipment-history";

function assertTrue(label: string, value: boolean) {
  if (!value) throw new Error(`${label}: expected true`);
  console.log(`OK ${label}`);
}

function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`OK ${label}`);
}

async function cleanup(db: PrismaClient, code: string) {
  const eq = await db.equipment.findUnique({ where: { code } });
  if (!eq) return;
  await db.equipmentHistoryEvent.deleteMany({ where: { equipmentId: eq.id } });
  await db.calibrationRecord.deleteMany({ where: { equipmentId: eq.id } });
  await db.calibrationPlan.deleteMany({ where: { equipmentId: eq.id } });
  await db.equipment.delete({ where: { id: eq.id } });
}

async function main() {
  const db = new PrismaClient();
  const code = "TEST-EQ-HIST-001";

  try {
    await cleanup(db, code);

    const equipment = await db.equipment.create({
      data: { code, name: "Test History Sync", createdBy: "Tester", updatedBy: "Tester" },
    });

    const record = await db.calibrationRecord.create({
      data: {
        equipmentId: equipment.id,
        calibrationDate: new Date("2026-06-01T00:00:00.000Z"),
        certificateNo: "CERT-TEST",
        result: "Pass",
        createdBy: "Tester",
        updatedBy: "Tester",
      },
    });

    await db.$transaction(async (tx) => {
      await appendEquipmentHistory(tx, {
        equipmentId: equipment.id,
        eventType: "Calibration",
        eventDate: record.calibrationDate,
        title: `Hiệu chuẩn ${record.certificateNo}`,
        description: "Test sync",
        sourceType: "CalibrationRecord",
        sourceId: record.id,
        createdBy: "Tester",
      });
    });

    let events = await db.equipmentHistoryEvent.findMany({ where: { equipmentId: equipment.id } });
    assertEqual("history count after cal record", events.length, 1);
    assertEqual("history sourceType", events[0]?.sourceType, "CalibrationRecord");
    assertEqual("history sourceId", events[0]?.sourceId, record.id);

    await db.$transaction(async (tx) => {
      await appendEquipmentHistory(tx, {
        equipmentId: equipment.id,
        eventType: "Calibration",
        eventDate: record.calibrationDate,
        title: "Duplicate",
        sourceType: "CalibrationRecord",
        sourceId: record.id,
        createdBy: "Tester",
      });
    });

    events = await db.equipmentHistoryEvent.findMany({ where: { equipmentId: equipment.id } });
    assertEqual("duplicate append ignored", events.length, 1);

    const manual = await db.equipmentHistoryEvent.create({
      data: {
        equipmentId: equipment.id,
        eventType: "Manual",
        eventDate: new Date("2026-05-01T00:00:00.000Z"),
        title: "Manual entry",
        sourceType: "Manual",
        sourceId: "manual-test-1",
        createdBy: "Tester",
      },
    });
    assertTrue("manual event created", !!manual.id);

    console.log("All equipment history sync tests passed.");
  } finally {
    await cleanup(db, code);
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
