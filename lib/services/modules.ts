import { db } from "@/lib/db";
import { mapPreparationWorkflowFields } from "@/lib/map-preparation-workflow";
import { mapStockLot } from "@/lib/map-stock-lot";
import { statusLabel, toDateStr } from "@/lib/modules/shared";
import { standardStatusLabel } from "@/lib/standard-status";

const MODULE_DELEGATES = [
  "microbialStrain",
  "preparedChemical",
  "preparedStandard",
  "preparedStrain",
] as const;

function assertModuleDelegates() {
  const record = db as unknown as Record<string, unknown>;
  const missing = MODULE_DELEGATES.filter((key) => {
    const delegate = record[key] as { findMany?: unknown } | undefined;
    return !delegate || typeof delegate.findMany !== "function";
  });
  if (missing.length) {
    throw new Error(
      `Prisma client thiếu model delegate: ${missing.join(", ")}. Chạy: npx.cmd prisma generate && npx.cmd prisma db push`,
    );
  }
}

const mapBase = (row: {
  id: string;
  parentCode: string;
  batchNumber: number;
  code: string;
  name: string;
  lot: string;
  status: Parameters<typeof statusLabel>[0];
  responsiblePerson: string;
  notes: string;
  expiryDate?: Date | null;
}) => ({
  id: row.id,
  parentCode: row.parentCode || row.code,
  batchNumber: row.batchNumber,
  code: row.code,
  name: row.name,
  lot: row.lot,
  status: statusLabel(row.status),
  responsiblePerson: row.responsiblePerson,
  notes: row.notes,
  expiryDate: toDateStr(row.expiryDate),
});

export async function getMicrobialStrains() {
  const rows = await db.microbialStrain.findMany({ orderBy: { code: "asc" } });
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    lot: r.lot,
    status: standardStatusLabel(r.status),
    responsiblePerson: r.responsiblePerson,
    notes: r.notes,
    expiryDate: toDateStr(r.expiryDate),
    strainGroup: r.strainGroup,
    atccProductCode: r.atccProductCode,
    manufacturer: r.manufacturer,
    storageCondition: r.storageCondition,
    passage: r.passage,
  }));
}

export async function getPreparedStrains() {
  const rows = await db.preparedStrain.findMany({
    where: { deletedAt: null },
    include: {
      sourceStrain: true,
      preparedByStaff: { select: { name: true } },
      checkedByStaff: { select: { name: true } },
      approvedByStaff: { select: { name: true } },
    },
    orderBy: { code: "asc" },
  });
  return rows.map((r) => ({
    ...mapBase(r),
    sourceCode: r.sourceStrain.code,
    sourceName: r.sourceStrain.name,
    sourceLotNumber: r.sourceLotNumberSnapshot,
    sourceStockLotId: r.sourceStockLotId ?? "",
    sourceLotNumberSnapshot: r.sourceLotNumberSnapshot,
    formula: r.formula,
    concentration: r.concentration,
    preparedDate: toDateStr(r.preparedDate),
    preparedBy: r.preparedBy,
    checkedBy: r.checkedBy,
    passage: r.passage,
    storageCondition: r.storageCondition,
    sourceStrainId: r.sourceStrainId,
    ...mapPreparationWorkflowFields(r),
  }));
}

export async function getChemicalOptions() {
  return db.chemical.findMany({ select: { id: true, code: true, name: true }, orderBy: { code: "asc" } });
}

export async function getStandardOptions() {
  return db.standard.findMany({ select: { id: true, code: true, name: true }, orderBy: { code: "asc" } });
}

export async function getMicrobialStrainOptions() {
  const rows = await db.microbialStrain.findMany({
    include: {
      stockLots: { orderBy: [{ expiryDate: "asc" }, { lot: "asc" }] },
    },
    orderBy: { code: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    unit: r.unit,
    stockLots: r.stockLots.map(mapStockLot),
  }));
}

export async function getModuleCounts() {
  assertModuleDelegates();
  const [microbialStrainCount, preparedChemicalCount, preparedStandardCount, preparedStrainCount] =
    await Promise.all([
      db.microbialStrain.count(),
      db.preparedChemical.count(),
      db.preparedStandard.count(),
      db.preparedStrain.count(),
    ]);
  return { microbialStrainCount, preparedChemicalCount, preparedStandardCount, preparedStrainCount };
}
