import { PrismaClient } from "@prisma/client";
import { applyStockIn, deductFromStockLotsFifo, syncMasterQuantityFromLots } from "../lib/stock-lot";

function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`OK ${label}`);
}

function assertTrue(label: string, value: boolean) {
  if (!value) throw new Error(`${label}: expected true`);
  console.log(`OK ${label}`);
}

async function cleanup(db: PrismaClient, code: string) {
  const chemical = await db.chemical.findUnique({ where: { code } });
  if (!chemical) return;
  await db.stockInLog.deleteMany({ where: { sourceCode: code } });
  await db.inventoryTransaction.deleteMany({ where: { sourceCode: code } });
  await db.stockLot.deleteMany({ where: { chemicalId: chemical.id } });
  await db.chemical.delete({ where: { id: chemical.id } });
}

async function testStockIn(db: PrismaClient) {
  const code = "TEST-STOCKIN-001";
  await cleanup(db, code);

  const chemical = await db.chemical.create({
    data: {
      code,
      name: "Methanol Test",
      casNumber: "67-56-1",
      manufacturer: "Merck",
      productCode: "M100",
      unit: "L",
      quantity: 0,
      lot: "",
    },
  });

  const lotA = "MET-2401";
  const lotB = "MET-2501";

  await db.$transaction(async (tx) => {
    const first = await applyStockIn(tx, {
      user: "Tester",
      sourceType: "Chemical",
      masterId: chemical.id,
      sourceCode: code,
      sourceName: chemical.name,
      lotInput: {
        lot: lotA,
        quantityIn: 2,
        unit: "L",
        expiryDate: new Date("2027-01-01T00:00:00.000Z"),
        storageLocation: "A1",
        notes: "first in",
      },
    });
    if ("error" in first) throw new Error(first.error);
  });

  let lots = await db.stockLot.findMany({ where: { chemicalId: chemical.id } });
  assertEqual("first lot count", lots.length, 1);
  assertEqual("first lot qty", lots[0]?.quantity, 2);

  await db.$transaction(async (tx) => {
    const second = await applyStockIn(tx, {
      user: "Tester",
      sourceType: "Chemical",
      masterId: chemical.id,
      sourceCode: code,
      sourceName: chemical.name,
      lotInput: {
        lot: lotA,
        quantityIn: 100,
        unit: "mL",
        expiryDate: new Date("2027-01-01T00:00:00.000Z"),
        storageLocation: "A1",
        notes: "merge same lot",
      },
    });
    if ("error" in second) throw new Error(second.error);
  });

  lots = await db.stockLot.findMany({ where: { chemicalId: chemical.id } });
  assertEqual("merge lot count", lots.length, 1);
  assertEqual("merge lot qty", lots[0]?.quantity, 2.1);

  await db.$transaction(async (tx) => {
    const third = await applyStockIn(tx, {
      user: "Tester",
      sourceType: "Chemical",
      masterId: chemical.id,
      sourceCode: code,
      sourceName: chemical.name,
      lotInput: {
        lot: lotB,
        quantityIn: 2,
        unit: "L",
        expiryDate: new Date("2028-01-01T00:00:00.000Z"),
        storageLocation: "A2",
        notes: "second lot",
      },
    });
    if ("error" in third) throw new Error(third.error);
  });

  lots = await db.stockLot.findMany({ where: { chemicalId: chemical.id }, orderBy: { lot: "asc" } });
  assertEqual("two lots", lots.length, 2);

  await db.$transaction(async (tx) => {
    await syncMasterQuantityFromLots(tx, "Chemical", chemical.id);
  });
  const master = await db.chemical.findUnique({ where: { id: chemical.id } });
  assertEqual("master total", master?.quantity, 4.1);

  await db.$transaction(async (tx) => {
    const incompatible = await applyStockIn(tx, {
      user: "Tester",
      sourceType: "Chemical",
      masterId: chemical.id,
      sourceCode: code,
      sourceName: chemical.name,
      lotInput: {
        lot: lotA,
        quantityIn: 1,
        unit: "kg",
        expiryDate: new Date("2027-01-01T00:00:00.000Z"),
        storageLocation: "A1",
        notes: "bad unit",
      },
    });
    assertTrue("incompatible unit rejected", "error" in incompatible);
  });

  await db.$transaction(async (tx) => {
    const deducted = await deductFromStockLotsFifo(tx, "Chemical", chemical.id, 500, "mL");
    if ("error" in deducted) throw new Error(deducted.error);
    assertTrue("fifo allocations", deducted.allocations.length >= 1);
  });

  await db.$transaction(async (tx) => {
    await syncMasterQuantityFromLots(tx, "Chemical", chemical.id);
  });
  const afterDeduct = await db.chemical.findUnique({ where: { id: chemical.id } });
  assertTrue("master reduced after fifo", (afterDeduct?.quantity ?? 0) < 4.1);

  const logs = await db.stockInLog.count({ where: { sourceCode: code } });
  assertEqual("stock in logs", logs, 3);

  await cleanup(db, code);
}

async function main() {
  const db = new PrismaClient();
  try {
    await testStockIn(db);
    console.log("ALL STOCK-IN TESTS PASS");
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
