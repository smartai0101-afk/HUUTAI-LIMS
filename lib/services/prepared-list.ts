import type { PreparedStandardLevel, PreparationWorkflowStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  buildPrismaOrderBy,
  parseListQueryParams,
  type ListQueryParams,
  type PaginatedResult,
  type SearchParamsInput,
  type SortFieldMap,
} from "@/lib/list-query";
import { mapPreparationWorkflowFields } from "@/lib/map-preparation-workflow";
import { mapPreparationIsoFields } from "@/lib/map-preparation-iso";
import { formatIngredientLine } from "@/lib/prepared-chemicals-fields";
import {
  computePreparedChemicalStatus,
  preparedChemicalStatusLabel,
} from "@/lib/prepared-chemical-status";
import { toDateString } from "@/lib/mappers";
import { statusLabel, toDateStr } from "@/lib/modules/shared";
import { mapPreparedStandardRow } from "@/lib/services/prepared-standards";
import type { ModuleRow } from "@/lib/modules/shared";
import type { PreparedChemicalView, PreparedStandardView } from "@/types";

export const PREPARED_CHEMICAL_SORT_ALLOWLIST = [
  "parentCode",
  "code",
  "name",
  "preparedDate",
  "expiryDate",
  "preparedBy",
  "workflowStatus",
  "status",
] as const;

export const PREPARED_STANDARD_SORT_ALLOWLIST = [
  "parentCode",
  "code",
  "name",
  "level",
  "preparedDate",
  "expiryDate",
  "preparedBy",
  "workflowStatus",
  "status",
] as const;

export const PREPARED_STRAIN_SORT_ALLOWLIST = [
  "parentCode",
  "code",
  "name",
  "preparedDate",
  "expiryDate",
  "preparedBy",
  "workflowStatus",
  "status",
] as const;

export type PreparedListParams = ListQueryParams & {
  status: string;
  workflow: string;
  level: string;
};

export function parsePreparedListParams(
  searchParams: SearchParamsInput,
  allowlist: readonly string[],
): PreparedListParams {
  const base = parseListQueryParams(searchParams, { sortBy: "code", sortOrder: "asc" }, allowlist);
  const first = (key: string) => {
    const v = searchParams[key];
    return Array.isArray(v) ? v[0] : v;
  };
  return {
    ...base,
    status: first("status")?.trim() || "All",
    workflow: first("workflow")?.trim() || "All",
    level: first("level")?.trim() || "All",
  };
}

const PREPARED_CHEMICAL_SORT_MAP: SortFieldMap = {
  parentCode: "parentCode",
  code: "code",
  name: "name",
  preparedDate: "preparedDate",
  expiryDate: "expiryDate",
  preparedBy: "preparedBy",
  workflowStatus: "workflowStatus",
  status: "expiryDate",
};

const PREPARED_STANDARD_SORT_MAP: SortFieldMap = {
  parentCode: "parentCode",
  code: "code",
  name: "name",
  level: "level",
  preparedDate: "preparedDate",
  expiryDate: "expiryDate",
  preparedBy: "preparedBy",
  workflowStatus: "workflowStatus",
  status: "expiryDate",
};

const PREPARED_STRAIN_SORT_MAP: SortFieldMap = {
  parentCode: "parentCode",
  code: "code",
  name: "name",
  preparedDate: "preparedDate",
  expiryDate: "expiryDate",
  preparedBy: "preparedBy",
  workflowStatus: "workflowStatus",
  status: "expiryDate",
};

function workflowFilterValue(label: string): PreparationWorkflowStatus | null {
  const map: Record<string, PreparationWorkflowStatus> = {
    Draft: "Draft",
    Prepared: "Prepared",
    Checked: "Checked",
    Approved: "Approved",
    Rejected: "Rejected",
    Cancelled: "Cancelled",
  };
  return map[label] ?? null;
}

export type PreparedBatchRowMeta = {
  rowKey: string;
  showGroupFields: boolean;
  parentCode: string;
  batchNumber: number;
};

function applyPreparedGroupFields<T extends PreparedBatchRowMeta & { parentCode: string; code: string }>(
  rows: T[],
): T[] {
  let prevParent: string | null = null;
  return rows.map((row) => {
    const parent = row.parentCode || row.code;
    const showGroupFields = parent !== prevParent;
    prevParent = parent;
    return { ...row, showGroupFields };
  });
}

const DEFAULT_PREPARED_ORDER = [{ code: "asc" as const }];

function buildPreparedTextWhere(q: string, fields: string[]) {
  return {
    OR: fields.map((field) => ({ [field]: { contains: q } })),
  };
}

export async function listPreparedChemicals(
  params: PreparedListParams,
): Promise<PaginatedResult<PreparedChemicalView & PreparedBatchRowMeta>> {
  const where: Record<string, unknown> = { deletedAt: null };
  const and: Record<string, unknown>[] = [];

  if (params.q) {
    and.push(
      buildPreparedTextWhere(params.q, [
        "code",
        "name",
        "parentCode",
        "concentration",
        "preparedBy",
        "notes",
        "formula",
      ]),
    );
  }
  if (params.workflow !== "All") {
    const wf = workflowFilterValue(params.workflow);
    if (wf) and.push({ workflowStatus: wf });
  }

  if (and.length) where.AND = and;

  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    PREPARED_CHEMICAL_SORT_MAP,
    DEFAULT_PREPARED_ORDER,
  ) as Prisma.PreparedChemicalOrderByWithRelationInput | Prisma.PreparedChemicalOrderByWithRelationInput[];

  const rows = await db.preparedChemical.findMany({
    where,
    include: {
      ingredients: { orderBy: { id: "asc" } },
      preparedByStaff: { select: { name: true } },
      checkedByStaff: { select: { name: true } },
      approvedByStaff: { select: { name: true } },
      equipment: { select: { code: true, name: true } },
    },
    orderBy,
  });

  let items = rows.map((row) => {
    const ingredients = row.ingredients.map((ing) => ({
      id: ing.id,
      chemicalId: ing.chemicalId,
      stockLotId: ing.stockLotId ?? null,
      chemicalName: ing.chemicalNameSnapshot,
      casProductCode: ing.casProductCodeSnapshot,
      lotNumber: ing.lotNumberSnapshot,
      quantityUsed: ing.quantityUsed,
      unit: ing.unit,
      displayLine: formatIngredientLine(
        ing.chemicalNameSnapshot,
        ing.lotNumberSnapshot,
        ing.quantityUsed,
        ing.unit,
      ),
    }));
    const view: PreparedChemicalView & PreparedBatchRowMeta = {
      id: row.id,
      parentCode: row.parentCode || row.code,
      batchNumber: row.batchNumber,
      code: row.code,
      name: row.name,
      concentration: row.concentration,
      concentrationUnit: row.concentrationUnit,
      preparedQuantity: row.preparedQuantity,
      unit: row.unit,
      preparedDate: toDateString(row.preparedDate),
      preparedBy: row.preparedByStaff?.name || row.preparedBy,
      expiryDate: toDateString(row.expiryDate),
      storageLocation: row.storageLocation,
      storageCondition: row.storageCondition,
      inventoryStatus: row.inventoryStatus,
      status: preparedChemicalStatusLabel(computePreparedChemicalStatus(row.expiryDate)),
      notes: row.notes,
      ingredients,
      ingredientsSummary: ingredients.map((i) => i.displayLine).join("\n"),
      ...mapPreparationWorkflowFields(row),
      ...mapPreparationIsoFields(row),
      rowKey: row.id,
      showGroupFields: true,
    };
    return view;
  });

  if (params.status !== "All") {
    items = items.filter((i) => i.status === params.status);
  }

  items = applyPreparedGroupFields(items);

  return {
    items,
    total: items.length,
    page: 1,
    limit: items.length || 1,
    totalPages: 1,
  };
}

export async function listPreparedStandards(
  params: PreparedListParams,
): Promise<PaginatedResult<PreparedStandardView & PreparedBatchRowMeta>> {
  const and: Record<string, unknown>[] = [{ deletedAt: null }];

  if (params.q) {
    and.push(
      buildPreparedTextWhere(params.q, ["code", "name", "parentCode", "concentration", "preparedBy", "notes", "formula"]),
    );
  }
  if (params.workflow !== "All") {
    const wf = workflowFilterValue(params.workflow);
    if (wf) and.push({ workflowStatus: wf });
  }
  if (params.level !== "All") {
    and.push({ level: params.level as PreparedStandardLevel });
  }

  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    PREPARED_STANDARD_SORT_MAP,
    DEFAULT_PREPARED_ORDER,
  ) as Prisma.PreparedStandardOrderByWithRelationInput | Prisma.PreparedStandardOrderByWithRelationInput[];

  const rows = await db.preparedStandard.findMany({
    where: { AND: and },
    include: {
      components: { orderBy: { id: "asc" } },
      solvents: { orderBy: { id: "asc" } },
      preparedByStaff: { select: { name: true } },
      checkedByStaff: { select: { name: true } },
      approvedByStaff: { select: { name: true } },
      equipment: { select: { code: true, name: true } },
    },
    orderBy,
  });

  let items = rows.map((row) => ({
    ...mapPreparedStandardRow(row),
    rowKey: row.id,
    showGroupFields: true,
  }));

  if (params.status !== "All") {
    items = items.filter((i) => i.status === params.status);
  }

  items = applyPreparedGroupFields(items);

  return {
    items,
    total: items.length,
    page: 1,
    limit: items.length || 1,
    totalPages: 1,
  };
}

export async function listPreparedStrains(
  params: PreparedListParams,
): Promise<PaginatedResult<ModuleRow & PreparedBatchRowMeta>> {
  const and: Record<string, unknown>[] = [{ deletedAt: null }];

  if (params.q) {
    and.push(buildPreparedTextWhere(params.q, ["code", "name", "parentCode", "preparedBy", "notes", "formula"]));
  }
  if (params.workflow !== "All") {
    const wf = workflowFilterValue(params.workflow);
    if (wf) and.push({ workflowStatus: wf });
  }

  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    PREPARED_STRAIN_SORT_MAP,
    DEFAULT_PREPARED_ORDER,
  ) as Prisma.PreparedStrainOrderByWithRelationInput | Prisma.PreparedStrainOrderByWithRelationInput[];

  const rows = await db.preparedStrain.findMany({
    where: { AND: and },
    include: {
      sourceStrain: { select: { code: true, name: true } },
      preparedByStaff: { select: { name: true } },
    },
    orderBy,
  });

  let items = rows.map((row) => ({
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
    sourceCode: row.sourceStrain.code,
    sourceName: row.sourceStrain.name,
    sourceLotNumber: row.sourceLotNumberSnapshot,
    sourceStockLotId: row.sourceStockLotId ?? "",
    sourceLotNumberSnapshot: row.sourceLotNumberSnapshot,
    formula: row.formula,
    concentration: row.concentration,
    finalConcentration: row.finalConcentration,
    level: row.level,
    preparedDate: toDateStr(row.preparedDate),
    preparedBy: row.preparedByStaff?.name || row.preparedBy,
    checkedBy: row.checkedBy,
    passage: row.passage,
    storageCondition: row.storageCondition,
    sourceStrainId: row.sourceStrainId,
    ...mapPreparationWorkflowFields(row),
    rowKey: row.id,
    showGroupFields: true,
  })) as unknown as Array<ModuleRow & PreparedBatchRowMeta>;

  if (params.status !== "All") {
    items = items.filter((i) => String(i.status) === params.status);
  }

  items = applyPreparedGroupFields(
    items as unknown as Array<PreparedBatchRowMeta & { parentCode: string; code: string }>,
  ) as unknown as Array<ModuleRow & PreparedBatchRowMeta>;

  return {
    items,
    total: items.length,
    page: 1,
    limit: items.length || 1,
    totalPages: 1,
  };
}

export { groupedPreparedCell } from "@/lib/prepared-batch-rows";
