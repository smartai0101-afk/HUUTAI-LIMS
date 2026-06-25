/**
 * Add multi-lot QA samples to an existing dev DB without full re-seed.
 */
import { PrismaClient } from "@prisma/client";
import { computeStandardStatus } from "../lib/standard-status";

const prisma = new PrismaClient();

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

async function addStandardSecondLot() {
  const std = await prisma.standard.findUnique({ where: { code: "STD-0002" } });
  if (!std) {
    console.log("Skip STD-0002 — not found");
    return;
  }

  const exists = await prisma.stockLot.findFirst({
    where: { standardId: std.id, lot: "H2354" },
  });
  if (exists) {
    console.log("STD-0002 lot H2354 already exists");
    return;
  }

  await prisma.stockLot.create({
    data: {
      standardId: std.id,
      lot: "H2354",
      quantity: 3,
      unit: std.unit,
      expiryDate: parseDate("2027-03-12"),
      afterOpenExpiry: parseDate("2027-09-12"),
      storageLocation: std.storageLocation,
      status: computeStandardStatus(parseDate("2027-03-12")),
    },
  });

  const lots = await prisma.stockLot.findMany({ where: { standardId: std.id } });
  const totalQty = lots.reduce((sum, lot) => sum + lot.quantity, 0);
  await prisma.standard.update({
    where: { id: std.id },
    data: { lot: "Nhiều lot", quantity: totalQty },
  });
  console.log(`STD-0002 → ${lots.length} lots, total qty ${totalQty}`);
}

async function addChemicalSecondLot() {
  const chem = await prisma.chemical.findUnique({ where: { code: "CHEM-0001" } });
  if (!chem) {
    console.log("Skip CHEM-0001 — not found");
    return;
  }

  const exists = await prisma.stockLot.findFirst({
    where: { chemicalId: chem.id, lot: "MET-2501" },
  });
  if (exists) {
    console.log("CHEM-0001 lot MET-2501 already exists");
    return;
  }

  await prisma.stockLot.create({
    data: {
      chemicalId: chem.id,
      lot: "MET-2501",
      quantity: 500,
      unit: "mL",
      expiryDate: parseDate("2026-10-15"),
      storageLocation: chem.storageLocation,
      status: computeStandardStatus(parseDate("2026-10-15")),
    },
  });

  const lots = await prisma.stockLot.findMany({ where: { chemicalId: chem.id } });
  const totalQty = lots.reduce((sum, lot) => sum + lot.quantity, 0);
  await prisma.chemical.update({
    where: { id: chem.id },
    data: { lot: "Nhiều lot", quantity: totalQty },
  });
  console.log(`CHEM-0001 → ${lots.length} lots, total qty ${totalQty}`);
}

async function addStrainSecondLot() {
  const strain = await prisma.microbialStrain.findUnique({ where: { code: "MS-0001" } });
  if (!strain) {
    console.log("Skip MS-0001 — not found");
    return;
  }

  const exists = await prisma.stockLot.findFirst({
    where: { microbialStrainId: strain.id, lot: "EC-2501" },
  });
  if (exists) {
    console.log("MS-0001 lot EC-2501 already exists");
    return;
  }

  await prisma.stockLot.create({
    data: {
      microbialStrainId: strain.id,
      lot: "EC-2501",
      quantity: 1,
      unit: strain.unit,
      expiryDate: parseDate("2027-06-15"),
      storageLocation: strain.storageLocation,
      status: computeStandardStatus(parseDate("2027-06-15")),
    },
  });

  const lots = await prisma.stockLot.findMany({ where: { microbialStrainId: strain.id } });
  const totalQty = lots.reduce((sum, lot) => sum + lot.quantity, 0);
  await prisma.microbialStrain.update({
    where: { id: strain.id },
    data: { lot: "Nhiều lot", quantity: totalQty },
  });
  console.log(`MS-0001 → ${lots.length} lots, total qty ${totalQty}`);
}

async function main() {
  await addStandardSecondLot();
  await addChemicalSecondLot();
  await addStrainSecondLot();
  console.log("Multi-lot QA seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
