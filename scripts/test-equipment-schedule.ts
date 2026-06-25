import { PrismaClient } from "@prisma/client";
import { addCycleMonths, computeScheduleStatus } from "../lib/equipment-schedule";

function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`OK ${label}`);
}

function daysFromToday(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function main() {
  const future45 = daysFromToday(45);
  assertEqual("45 days ahead = Green", computeScheduleStatus(future45), "Green");

  const future20 = daysFromToday(20);
  assertEqual("20 days ahead = Yellow", computeScheduleStatus(future20), "Yellow");

  const past5 = daysFromToday(-5);
  assertEqual("5 days overdue = Red", computeScheduleStatus(past5), "Red");

  assertEqual("null nextDate = Green", computeScheduleStatus(null), "Green");

  const base = new Date("2026-01-15T00:00:00.000Z");
  const next = addCycleMonths(base, 12);
  assertEqual("addCycleMonths month", next.toISOString().slice(0, 10), "2027-01-15");

  const db = new PrismaClient();
  try {
    const plan = await db.calibrationPlan.findFirst({ include: { equipment: true } });
    if (plan?.nextDate) {
      const status = computeScheduleStatus(plan.nextDate);
      if (!["Green", "Yellow", "Red"].includes(status)) {
        throw new Error(`Invalid schedule status from DB: ${status}`);
      }
      console.log(`OK DB plan ${plan.equipment.code} status=${status}`);
    } else {
      console.log("SKIP DB plan check (no calibration plans seeded)");
    }
  } finally {
    await db.$disconnect();
  }

  console.log("All equipment schedule tests passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
