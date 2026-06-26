import { db } from "@/lib/db";
import { formatCasProductSnapshot } from "@/lib/chemicals-fields";
import { getChemicals } from "@/lib/services/chemicals";
import { getStandards } from "@/lib/services/standards";
import {
  computePreparedStandardStatus,
  preparedStandardStatusLabel,
} from "@/lib/prepared-standard-status";
import {
  formatComponentLine,
  formatSolventLine,
  PREPARED_STANDARD_LEVEL_LABELS,
} from "@/lib/prepared-standards-fields";
import { toDateStr } from "@/lib/modules/shared";
import { mapPreparationWorkflowFields } from "@/lib/map-preparation-workflow";
import type {
  PreparedStandardComponentView,
  PreparedStandardSolventView,
  PreparedStandardView,
} from "@/types";
import type { PreparedStandardLevel } from "@prisma/client";

function mapComponent(row: {
  id: string;
  sourceType: "Standard" | "PreparedStandard";
  standardId: string | null;
  sourcePreparedStandardId: string | null;
  stockLotId?: string | null;
  standardCodeSnapshot: string;
  standardNameSnapshot: string;
  manufacturerSnapshot: string;
  productCodeSnapshot: string;
  lotNumberSnapshot: string;
  puritySnapshot: string;
  concentrationSnapshot: string;
  concentrationUnitSnapshot: string;
  levelSnapshot: PreparedStandardLevel | null;
  preparedDateSnapshot: Date | null;
  expiryDateSnapshot: Date | null;
  quantityUsed: number;
  unit: string;
}): PreparedStandardComponentView {
  const levelLabel = row.levelSnapshot
    ? PREPARED_STANDARD_LEVEL_LABELS[row.levelSnapshot]
    : "";
  return {
    id: row.id,
    sourceType: row.sourceType,
    standardId: row.standardId,
    sourcePreparedStandardId: row.sourcePreparedStandardId,
    stockLotId: row.stockLotId ?? null,
    sourceLevel: row.levelSnapshot,
    standardCode: row.standardCodeSnapshot,
    standardName: row.standardNameSnapshot,
    manufacturer: row.manufacturerSnapshot,
    productCode: row.productCodeSnapshot,
    lotNumber: row.lotNumberSnapshot,
    purity: row.puritySnapshot,
    concentration: row.concentrationSnapshot,
    concentrationUnit: row.concentrationUnitSnapshot,
    levelLabel,
    preparedDate: row.preparedDateSnapshot ? toDateStr(row.preparedDateSnapshot) : "",
    expiryDate: row.expiryDateSnapshot ? toDateStr(row.expiryDateSnapshot) : "",
    quantityUsed: row.quantityUsed,
    unit: row.unit,
    displayLine: formatComponentLine(
      row.standardCodeSnapshot,
      row.standardNameSnapshot,
      row.lotNumberSnapshot,
      row.quantityUsed,
      row.unit,
      row.concentrationSnapshot,
      row.concentrationUnitSnapshot,
    ),
  };
}

function mapSolvent(row: {
  id: string;
  chemicalId: string;
  stockLotId?: string | null;
  chemicalCodeSnapshot: string;
  chemicalNameSnapshot: string;
  casProductCodeSnapshot: string;
  lotNumberSnapshot: string;
  quantityUsed: number;
  unit: string;
}): PreparedStandardSolventView {
  return {
    id: row.id,
    chemicalId: row.chemicalId,
    stockLotId: row.stockLotId ?? null,
    chemicalCode: row.chemicalCodeSnapshot,
    chemicalName: row.chemicalNameSnapshot,
    casProductCode: row.casProductCodeSnapshot,
    lotNumber: row.lotNumberSnapshot,
    quantityUsed: row.quantityUsed,
    unit: row.unit,
    displayLine: formatSolventLine(
      row.chemicalCodeSnapshot,
      row.chemicalNameSnapshot,
      row.lotNumberSnapshot,
      row.quantityUsed,
      row.unit,
    ),
  };
}

export async function getPreparedStandards(): Promise<PreparedStandardView[]> {
  const rows = await db.preparedStandard.findMany({
    where: { deletedAt: null },
    include: {
      components: { orderBy: { id: "asc" } },
      solvents: { orderBy: { id: "asc" } },
      preparedByStaff: { select: { name: true } },
      checkedByStaff: { select: { name: true } },
      approvedByStaff: { select: { name: true } },
    },
    orderBy: { code: "asc" },
  });

  return rows.map((row) => {
    const components = row.components.map(mapComponent);
    const solvents = row.solvents.map(mapSolvent);
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      level: row.level,
      levelLabel: PREPARED_STANDARD_LEVEL_LABELS[row.level],
      concentration: row.concentration,
      concentrationUnit: row.concentrationUnit,
      solventVolume: row.solventVolume,
      solventUnit: row.solventUnit,
      preparedDate: toDateStr(row.preparedDate),
      expiryDate: toDateStr(row.expiryDate),
      preparedBy: row.preparedBy,
      status: preparedStandardStatusLabel(computePreparedStandardStatus(row.expiryDate)),
      storageLocation: row.storageLocation,
      storageCondition: row.storageCondition,
      quantity: row.quantity,
      unit: row.unit || row.solventUnit,
      notes: row.notes,
      components,
      solvents,
      componentsSummary: components.map((c) => c.displayLine).join("\n"),
      solventsSummary: solvents.map((s) => s.displayLine).join("\n"),
      ...mapPreparationWorkflowFields(row),
    };
  });
}

export async function getPreparedStandardCatalog() {
  const [standards, preparedStandards, chemicals] = await Promise.all([
    getStandards(),
    db.preparedStandard.findMany({ orderBy: { code: "asc" } }),
    getChemicals(),
  ]);

  const levelCounts = Object.fromEntries(
    (["RootPrepared", "Intermediate1", "Intermediate2", "Intermediate3", "WorkingPrepared"] as const).map(
      (level) => [level, preparedStandards.filter((p) => p.level === level).length],
    ),
  ) as Record<PreparedStandardLevel, number>;

  return {
    standards: standards.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      manufacturer: s.manufacturer,
      productCode: s.productCode,
      lot: s.lot,
      purity: s.purity,
      unit: s.unit,
      stockLots: s.stockLots,
      searchText: `${s.code} ${s.name} ${s.lot} ${s.productCode}`.toLowerCase(),
    })),
    preparedStandards: preparedStandards.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      level: p.level,
      levelLabel: PREPARED_STANDARD_LEVEL_LABELS[p.level],
      concentration: p.concentration,
      concentrationUnit: p.concentrationUnit,
      preparedDate: toDateStr(p.preparedDate),
      expiryDate: toDateStr(p.expiryDate),
      lot: p.code,
      unit: p.concentrationUnit || "mL",
      searchText: `${p.code} ${p.name} ${p.concentration} ${p.concentrationUnit}`.toLowerCase(),
    })),
    levelCounts,
    chemicals: chemicals.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      casProductCode: formatCasProductSnapshot(c.casNumber, c.productCode),
      lot: c.lot,
      unit: c.unit,
      quantity: c.quantity,
      stockLots: c.stockLots,
      searchText: `${c.code} ${c.name} ${c.lot} ${c.casNumber} ${c.productCode}`.toLowerCase(),
    })),
  };
}
