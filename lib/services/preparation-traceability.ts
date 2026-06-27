import { db } from "@/lib/db";
import { toDateString } from "@/lib/mappers";
import type { PreparationRecordType } from "@/lib/services/preparation-workflow";

export type TraceNodeKind =
  | "PreparedChemical"
  | "PreparedStandard"
  | "PreparedStrain"
  | "Chemical"
  | "Standard"
  | "MicrobialStrain";

export type TraceRole = "ROOT" | "MAIN" | "SOLVENT" | "SOURCE";

export type TraceTreeNode = {
  id: string;
  kind: TraceNodeKind;
  parentCode?: string;
  batchNumber?: number;
  code: string;
  name: string;
  lot?: string;
  quantityUsed?: number;
  unit?: string;
  concentration?: string;
  concentrationUnit?: string;
  role?: TraceRole;
  preparationType?: PreparationRecordType;
  href?: string;
  children: TraceTreeNode[];
};

export type CatalogSourceKind = "CHEMICAL" | "STANDARD" | "STRAIN";

export type PreparedDerivativeView = {
  id: string;
  preparationType: PreparationRecordType;
  code: string;
  name: string;
  role: string;
  quantityUsed?: number;
  unit?: string;
  workflowStatus: string;
  href: string;
};

export type PreparationSummaryView = {
  id: string;
  type: PreparationRecordType;
  code: string;
  name: string;
  workflowStatus: string;
  version: number;
  preparedDate: string;
  expiryDate: string;
  preparedBy: string;
  listHref: string;
};

const TYPE_SLUG: Record<PreparationRecordType, string> = {
  CHEMICAL: "chemical",
  STANDARD: "standard",
  STRAIN: "strain",
};

const LIST_HREF: Record<PreparationRecordType, string> = {
  CHEMICAL: "/prepared-chemicals",
  STANDARD: "/prepared-standards",
  STRAIN: "/prepared-strains",
};

const SLUG_TO_TYPE: Record<string, PreparationRecordType> = {
  chemical: "CHEMICAL",
  standard: "STANDARD",
  strain: "STRAIN",
};

const MAX_DEPTH = 12;

export function preparationDetailHref(type: PreparationRecordType, id: string): string {
  return `/preparation/${TYPE_SLUG[type]}/${id}`;
}

export function parsePreparationTypeSlug(slug: string): PreparationRecordType | null {
  return SLUG_TO_TYPE[slug] ?? null;
}

function preparedNode(
  type: PreparationRecordType,
  id: string,
  code: string,
  name: string,
  extra?: Partial<TraceTreeNode>,
): TraceTreeNode {
  const kind =
    type === "CHEMICAL"
      ? "PreparedChemical"
      : type === "STANDARD"
        ? "PreparedStandard"
        : "PreparedStrain";
  return {
    id,
    kind,
    code,
    name,
    preparationType: type,
    href: preparationDetailHref(type, id),
    children: [],
    ...extra,
  };
}

async function buildStandardSubtree(
  preparedStandardId: string,
  visited: Set<string>,
  depth: number,
  role?: TraceRole,
  quantityUsed?: number,
  unit?: string,
): Promise<TraceTreeNode | null> {
  if (depth > MAX_DEPTH || visited.has(preparedStandardId)) return null;
  visited.add(preparedStandardId);

  const record = await db.preparedStandard.findFirst({
    where: { id: preparedStandardId, deletedAt: null },
    include: { components: { orderBy: { id: "asc" } }, solvents: { orderBy: { id: "asc" } } },
  });
  if (!record) return null;

  const children: TraceTreeNode[] = [];

  for (const comp of record.components) {
    if (comp.sourceType === "PreparedStandard" && comp.sourcePreparedStandardId) {
      const child = await buildStandardSubtree(
        comp.sourcePreparedStandardId,
        visited,
        depth + 1,
        "MAIN",
        comp.quantityUsed,
        comp.unit,
      );
      if (child) {
        children.push(child);
      } else {
        children.push({
          id: comp.sourcePreparedStandardId,
          kind: "PreparedStandard",
          code: comp.standardCodeSnapshot,
          name: comp.standardNameSnapshot,
          lot: comp.lotNumberSnapshot,
          quantityUsed: comp.quantityUsed,
          unit: comp.unit,
          concentration: comp.concentrationSnapshot,
          concentrationUnit: comp.concentrationUnitSnapshot,
          role: "MAIN",
          preparationType: "STANDARD",
          children: [],
        });
      }
    } else {
      children.push({
        id: comp.standardId ?? comp.id,
        kind: "Standard",
        code: comp.standardCodeSnapshot,
        name: comp.standardNameSnapshot,
        lot: comp.lotNumberSnapshot,
        quantityUsed: comp.quantityUsed,
        unit: comp.unit,
        concentration: comp.concentrationSnapshot,
        concentrationUnit: comp.concentrationUnitSnapshot,
        role: "MAIN",
        children: [],
      });
    }
  }

  for (const sol of record.solvents) {
    children.push({
      id: sol.chemicalId,
      kind: "Chemical",
      code: sol.chemicalCodeSnapshot,
      name: sol.chemicalNameSnapshot,
      lot: sol.lotNumberSnapshot,
      quantityUsed: sol.quantityUsed,
      unit: sol.unit,
      role: "SOLVENT",
      children: [],
    });
  }

  return preparedNode("STANDARD", record.id, record.code, record.name, {
    parentCode: record.parentCode || record.code,
    batchNumber: record.batchNumber,
    concentration: record.concentration,
    concentrationUnit: record.concentrationUnit,
    role,
    quantityUsed,
    unit,
    children,
  });
}

async function buildChemicalTree(id: string): Promise<TraceTreeNode | null> {
  const record = await db.preparedChemical.findFirst({
    where: { id, deletedAt: null },
    include: { ingredients: { orderBy: { id: "asc" } } },
  });
  if (!record) return null;

  const children: TraceTreeNode[] = record.ingredients.map((ing) => ({
    id: ing.chemicalId,
    kind: "Chemical" as const,
    code: ing.casProductCodeSnapshot || ing.chemicalNameSnapshot,
    name: ing.chemicalNameSnapshot,
    lot: ing.lotNumberSnapshot,
    quantityUsed: ing.quantityUsed,
    unit: ing.unit,
    role: "MAIN" as const,
    children: [],
  }));

  return preparedNode("CHEMICAL", record.id, record.code, record.name, {
    parentCode: record.parentCode || record.code,
    batchNumber: record.batchNumber,
    concentration: record.concentration,
    concentrationUnit: record.concentrationUnit,
    role: "ROOT",
    children,
  });
}

async function buildStandardTree(id: string): Promise<TraceTreeNode | null> {
  const visited = new Set<string>();
  const tree = await buildStandardSubtree(id, visited, 0, "ROOT");
  return tree;
}

async function buildStrainTree(id: string): Promise<TraceTreeNode | null> {
  const record = await db.preparedStrain.findFirst({
    where: { id, deletedAt: null },
    include: { sourceStrain: { select: { id: true, code: true, name: true } } },
  });
  if (!record) return null;

  const children: TraceTreeNode[] = [];
  if (record.sourceStrain) {
    children.push({
      id: record.sourceStrain.id,
      kind: "MicrobialStrain",
      code: record.sourceStrain.code,
      name: record.sourceStrain.name,
      lot: record.sourceLotNumberSnapshot,
      role: "SOURCE",
      children: [],
    });
  }

  return preparedNode("STRAIN", record.id, record.code, record.name, {
    parentCode: record.parentCode || record.code,
    batchNumber: record.batchNumber,
    role: "ROOT",
    children,
  });
}

export async function buildTraceTree(
  preparationType: PreparationRecordType,
  preparationId: string,
): Promise<TraceTreeNode | null> {
  if (preparationType === "CHEMICAL") return buildChemicalTree(preparationId);
  if (preparationType === "STANDARD") return buildStandardTree(preparationId);
  return buildStrainTree(preparationId);
}

function mapDerivative(
  type: PreparationRecordType,
  row: { id: string; code: string; name: string; workflowStatus: string },
  role: string,
  quantityUsed?: number,
  unit?: string,
): PreparedDerivativeView {
  return {
    id: row.id,
    preparationType: type,
    code: row.code,
    name: row.name,
    role,
    quantityUsed,
    unit,
    workflowStatus: row.workflowStatus,
    href: preparationDetailHref(type, row.id),
  };
}

export async function findPreparedDerivatives(
  catalogKind: CatalogSourceKind,
  catalogId: string,
): Promise<PreparedDerivativeView[]> {
  const results: PreparedDerivativeView[] = [];

  if (catalogKind === "CHEMICAL") {
    const [ingredients, solvents] = await Promise.all([
      db.preparedChemicalIngredient.findMany({
        where: { chemicalId: catalogId },
        include: {
          preparedChemical: {
            select: { id: true, code: true, name: true, workflowStatus: true, deletedAt: true },
          },
        },
      }),
      db.preparedStandardSolvent.findMany({
        where: { chemicalId: catalogId },
        include: {
          preparedStandard: {
            select: { id: true, code: true, name: true, workflowStatus: true, deletedAt: true },
          },
        },
      }),
    ]);
    for (const ing of ingredients) {
      if (ing.preparedChemical.deletedAt) continue;
      results.push(
        mapDerivative(
          "CHEMICAL",
          ing.preparedChemical,
          "Nguyên liệu",
          ing.quantityUsed,
          ing.unit,
        ),
      );
    }
    for (const sol of solvents) {
      if (sol.preparedStandard.deletedAt) continue;
      results.push(
        mapDerivative("STANDARD", sol.preparedStandard, "Dung môi", sol.quantityUsed, sol.unit),
      );
    }
  }

  if (catalogKind === "STANDARD") {
    const components = await db.preparedStandardComponent.findMany({
      where: { standardId: catalogId },
      include: {
        preparedStandard: {
          select: { id: true, code: true, name: true, workflowStatus: true, deletedAt: true },
        },
      },
    });
    for (const comp of components) {
      if (comp.preparedStandard.deletedAt) continue;
      results.push(
        mapDerivative(
          "STANDARD",
          comp.preparedStandard,
          "Thành phần",
          comp.quantityUsed,
          comp.unit,
        ),
      );
    }
  }

  if (catalogKind === "STRAIN") {
    const strains = await db.preparedStrain.findMany({
      where: { sourceStrainId: catalogId, deletedAt: null },
      select: {
        id: true,
        code: true,
        name: true,
        workflowStatus: true,
      },
    });
    for (const row of strains) {
      results.push(mapDerivative("STRAIN", row, "Nguồn gốc"));
    }
  }

  return results.sort((a, b) => a.code.localeCompare(b.code));
}

export async function getPreparationSummary(
  preparationType: PreparationRecordType,
  preparationId: string,
): Promise<PreparationSummaryView | null> {
  if (preparationType === "CHEMICAL") {
    const row = await db.preparedChemical.findFirst({
      where: { id: preparationId, deletedAt: null },
    });
    if (!row) return null;
    return {
      id: row.id,
      type: "CHEMICAL",
      code: row.code,
      name: row.name,
      workflowStatus: row.workflowStatus,
      version: row.version,
      preparedDate: toDateString(row.preparedDate),
      expiryDate: toDateString(row.expiryDate),
      preparedBy: row.preparedBy,
      listHref: LIST_HREF.CHEMICAL,
    };
  }
  if (preparationType === "STANDARD") {
    const row = await db.preparedStandard.findFirst({
      where: { id: preparationId, deletedAt: null },
    });
    if (!row) return null;
    return {
      id: row.id,
      type: "STANDARD",
      code: row.code,
      name: row.name,
      workflowStatus: row.workflowStatus,
      version: row.version,
      preparedDate: toDateString(row.preparedDate),
      expiryDate: toDateString(row.expiryDate),
      preparedBy: row.preparedBy,
      listHref: LIST_HREF.STANDARD,
    };
  }
  const row = await db.preparedStrain.findFirst({
    where: { id: preparationId, deletedAt: null },
  });
  if (!row) return null;
  return {
    id: row.id,
    type: "STRAIN",
    code: row.code,
    name: row.name,
    workflowStatus: row.workflowStatus,
    version: row.version,
    preparedDate: toDateString(row.preparedDate),
    expiryDate: toDateString(row.expiryDate),
    preparedBy: row.preparedBy,
    listHref: LIST_HREF.STRAIN,
  };
}
