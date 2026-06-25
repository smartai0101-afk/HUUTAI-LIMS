import { PrismaClient } from "@prisma/client";
import { convertQuantity } from "../lib/inventory-units";
import { applyInventoryStockChange, chemicalStockLine } from "../lib/inventory-stock";

function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`OK ${label}`);
}

async function testUnitConversion() {
  assertEqual("kg->g", convertQuantity(1, "kg", "g"), 1000);
  assertEqual("100g->kg", convertQuantity(100, "g", "kg"), 0.1);
  assertEqual("200mg->g", convertQuantity(200, "mg", "g"), 0.2);
  assertEqual("1kg->mg", convertQuantity(1, "kg", "mg"), 1000000);
  assertEqual("250mL->L", convertQuantity(250, "mL", "L"), 0.25);
  assertEqual("1.75L->mL", convertQuantity(1.75, "L", "mL"), 1750);
  assertEqual("10mg->g", convertQuantity(10, "mg", "g"), 0.01);
  assertEqual("1000µL->mL", convertQuantity(1000, "µL", "mL"), 1);
  assertEqual("1000μL->L", convertQuantity(1000, "μL", "L"), 0.001);
  assertEqual("500µL->mL", convertQuantity(500, "µL", "mL"), 0.5);
}

async function testStockFlow(db: PrismaClient) {
  await db.inventoryTransaction.deleteMany({ where: { sourceCode: "TEST-STOCK-001" } });
  await db.chemical.deleteMany({ where: { code: "TEST-STOCK-001" } });

  const chemical = await db.chemical.create({
    data: {
      code: "TEST-STOCK-001",
      name: "Test stock chemical",
      unit: "kg",
      quantity: 1,
    },
  });

  const refId = "test-ref-create";
  await db.$transaction(async (tx) => {
    const err = await applyInventoryStockChange(tx, {
      user: "Test",
      module: "Test",
      referenceType: "Test",
      referenceId: refId,
      deducts: [chemicalStockLine(chemical.id, 100, "g")],
    });
    if (err) throw new Error(err);
  });

  let afterCreate = await db.chemical.findUnique({ where: { id: chemical.id } });
  assertEqual("create deduct", afterCreate?.quantity, 0.9);

  const blocked = await db.$transaction(async (tx) =>
    applyInventoryStockChange(tx, {
      user: "Test",
      module: "Test",
      referenceType: "Test",
      referenceId: refId,
      deducts: [chemicalStockLine(chemical.id, 1000, "g")],
    }),
  );
  if (!blocked) throw new Error("expected shortage error on over-deduct");
  afterCreate = await db.chemical.findUnique({ where: { id: chemical.id } });
  assertEqual("blocked keeps stock", afterCreate?.quantity, 0.9);

  await db.$transaction(async (tx) => {
    const err = await applyInventoryStockChange(tx, {
      user: "Test",
      module: "Test",
      referenceType: "Test",
      referenceId: refId,
      restores: [chemicalStockLine(chemical.id, 100, "g")],
      deducts: [chemicalStockLine(chemical.id, 150, "g")],
    });
    if (err) throw new Error(err);
  });

  afterCreate = await db.chemical.findUnique({ where: { id: chemical.id } });
  assertEqual("update net", afterCreate?.quantity, 0.85);

  await db.$transaction(async (tx) => {
    const err = await applyInventoryStockChange(tx, {
      user: "Test",
      module: "Test",
      referenceType: "Test",
      referenceId: refId,
      restores: [chemicalStockLine(chemical.id, 150, "g")],
    });
    if (err) throw new Error(err);
  });

  afterCreate = await db.chemical.findUnique({ where: { id: chemical.id } });
  assertEqual("delete restore", afterCreate?.quantity, 1);

  const txCount = await db.inventoryTransaction.count({
    where: { sourceId: chemical.id },
  });
  if (txCount < 3) throw new Error(`Expected inventory logs, got ${txCount}`);
  console.log(`OK inventory logs (${txCount})`);

  await db.inventoryTransaction.deleteMany({ where: { sourceId: chemical.id } });
  await db.chemical.delete({ where: { id: chemical.id } });
}

async function main() {
  await testUnitConversion();
  const db = new PrismaClient();
  try {
    await testStockFlow(db);
    console.log("ALL TESTS PASSED");
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
