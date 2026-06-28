import type { PreparationWorkflowStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { ExcelColumn } from "@/lib/excel";
import {
  parseListQueryParams,
  type ListQueryParams,
  type PaginatedResult,
  type SearchParamsInput,
  type SortOrder,
} from "@/lib/list-query";
import { PREPARATION_WORKFLOW_STATUS_LABELS } from "@/lib/preparation-workflow-labels";
import { toDateString } from "@/lib/mappers";
import { preparationDetailHref } from "@/lib/services/preparation-traceability";
import type { PreparationRecordType } from "@/lib/services/preparation-workflow";

export const PREPARATION_HISTORY_REPORT_HEADERS = [
  "Mã nhóm",
  "Mã lô",
  "Loại",
  "Tên thành phẩm",
  "Ngày pha",
  "Người pha",
  "Người duyệt",
  "Nguồn gốc",
  "Số lô gốc",
  "Lượng sử dụng",
  "Nồng độ lý thuyết",
  "Nồng độ thực tế",
  "Hạn sử dụng",
  "Trạng thái",
  "Ghi chú",
] as const;

export const PREPARATION_HISTORY_REPORT_COLUMNS: ExcelColumn[] =
  PREPARATION_HISTORY_REPORT_HEADERS.map((header) => ({ key: header, header }));

const TYPE_LABELS: Record<PreparationRecordType, string> = {
  CHEMICAL: "Hóa chất pha chế",
  STANDARD: "Chuẩn pha chế",
  STRAIN: "Chủng pha chế",
};

export type PreparationHistoryReportRow = {
  id: string;
  preparationId: string;
  preparationType: PreparationRecordType;
  detailHref: string;
  parentCode: string;
  batchNumber: number;
  code: string;
  type: string;
  name: string;
  preparedDate: string;
  preparedBy: string;
  approvedBy: string;
  sourceOrigin: string;
  sourceLot: string;
  quantityUsed: string;
  originalConcentration: string;
  finalConcentration: string;
  expiryDate: string;
  status: string;
  notes: string;
};

function formatQuantity(qty: number, unit: string): string {
  const value = Number.isInteger(qty) ? String(qty) : String(qty);
  const u = unit.trim();
  return u ? `${value} ${u}` : value;
}

function formatConcentration(value: string, unit: string): string {
  const v = value.trim();
  if (!v) return "";
  const u = unit.trim();
  return u ? `${v} ${u}` : v;
}

function resolveApprovedBy(
  approvedStaffName: string,
  approvedByStaffId: string | null,
  fallback = "",
): string {
  return approvedStaffName.trim() || (approvedByStaffId ? fallback : fallback);
}

function baseRow(
  type: PreparationRecordType,
  id: string,
  code: string,
  name: string,
  preparedDate: Date,
  preparedBy: string,
  approvedBy: string,
  originalConcentration: string,
  finalConcentration: string,
  expiryDate: Date,
  workflowStatus: keyof typeof PREPARATION_WORKFLOW_STATUS_LABELS,
  notes: string,
  source: {
    origin: string;
    lot: string;
    quantityUsed: string;
    originalConcentration?: string;
  },
  parentCode: string,
  batchNumber: number,
  rowSuffix = "",
): PreparationHistoryReportRow {
  return {
    id: `${type}-${id}${rowSuffix}`,
    preparationId: id,
    preparationType: type,
    detailHref: preparationDetailHref(type, id),
    parentCode,
    batchNumber,
    code,
    type: TYPE_LABELS[type],
    name,
    preparedDate: toDateString(preparedDate),
    preparedBy: preparedBy.trim(),
    approvedBy: approvedBy.trim(),
    sourceOrigin: source.origin,
    sourceLot: source.lot,
    quantityUsed: source.quantityUsed,
    originalConcentration: source.originalConcentration?.trim() || originalConcentration.trim(),
    finalConcentration: finalConcentration.trim(),
    expiryDate: toDateString(expiryDate),
    status: PREPARATION_WORKFLOW_STATUS_LABELS[workflowStatus],
    notes: notes.trim(),
  };
}

export const PREPARATION_HISTORY_SORT_ALLOWLIST = [
  "preparedDate",
  "code",
  "name",
  "parentCode",
  "preparedBy",
  "status",
  "type",
] as const;

export type PreparationHistoryListParams = ListQueryParams & {
  typeFilter: string;
  statusFilter: string;
  parentCodeFilter: string;
  dateFrom: string;
  dateTo: string;
};

function firstParam(searchParams: SearchParamsInput, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parsePreparationHistoryListParams(
  searchParams: SearchParamsInput,
): PreparationHistoryListParams {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "preparedDate", sortOrder: "desc", page: 1, limit: 50 },
    PREPARATION_HISTORY_SORT_ALLOWLIST,
  );

  return {
    ...base,
    typeFilter: firstParam(searchParams, "typeFilter")?.trim() || "All",
    statusFilter: firstParam(searchParams, "statusFilter")?.trim() || "All",
    parentCodeFilter: firstParam(searchParams, "parentCodeFilter")?.trim() || "",
    dateFrom: firstParam(searchParams, "dateFrom")?.trim() || "",
    dateTo: firstParam(searchParams, "dateTo")?.trim() || "",
  };
}

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

function buildPreparedTextWhere(q: string, fields: string[]) {
  return {
    OR: fields.map((field) => ({ [field]: { contains: q } })),
  };
}

function buildPreparedCommonWhere(params: PreparationHistoryListParams) {
  const and: Record<string, unknown>[] = [{ deletedAt: null }];

  if (params.q) {
    and.push(
      buildPreparedTextWhere(params.q, [
        "code",
        "name",
        "parentCode",
        "preparedBy",
        "notes",
        "formula",
      ]),
    );
  }

  if (params.statusFilter !== "All") {
    const wf = workflowFilterValue(params.statusFilter);
    if (wf) and.push({ workflowStatus: wf });
  }

  if (params.parentCodeFilter) {
    and.push({ parentCode: { contains: params.parentCodeFilter } });
  }

  if (params.dateFrom) {
    and.push({ preparedDate: { gte: new Date(`${params.dateFrom}T00:00:00.000Z`) } });
  }

  if (params.dateTo) {
    and.push({ preparedDate: { lte: new Date(`${params.dateTo}T23:59:59.999Z`) } });
  }

  return { AND: and };
}

function preparedOrderBy(
  sortBy: string,
  sortOrder: SortOrder,
): Record<string, SortOrder>[] {
  const dir = sortOrder;
  switch (sortBy) {
    case "code":
      return [{ code: dir }];
    case "name":
      return [{ name: dir }];
    case "parentCode":
      return [{ parentCode: dir }, { code: "asc" }];
    case "preparedBy":
      return [{ preparedBy: dir }, { code: "asc" }];
    case "status":
      return [{ workflowStatus: dir }, { preparedDate: "desc" }];
    case "type":
      return [{ code: dir }];
    case "preparedDate":
    default:
      return [{ preparedDate: dir }, { code: "asc" }];
  }
}

function mapChemicalBatchRow(row: {
  id: string;
  parentCode: string | null;
  batchNumber: number;
  code: string;
  name: string;
  preparedDate: Date;
  preparedBy: string;
  concentration: string;
  concentrationUnit: string;
  finalConcentration: string;
  expiryDate: Date;
  workflowStatus: PreparationWorkflowStatus;
  notes: string;
  preparedByStaff: { name: string } | null;
  approvedByStaff: { name: string } | null;
  approvedByStaffId: string | null;
}): PreparationHistoryReportRow {
  const approvedBy = resolveApprovedBy(row.approvedByStaff?.name ?? "", row.approvedByStaffId);
  const parentCode = row.parentCode || row.code;
  const finalConc = formatConcentration(row.finalConcentration || row.concentration, row.concentrationUnit);
  const theoreticalConc = formatConcentration(row.concentration, row.concentrationUnit);

  return baseRow(
    "CHEMICAL",
    row.id,
    row.code,
    row.name,
    row.preparedDate,
    row.preparedByStaff?.name || row.preparedBy,
    approvedBy,
    theoreticalConc,
    finalConc,
    row.expiryDate,
    row.workflowStatus,
    row.notes,
    { origin: "", lot: "", quantityUsed: "" },
    parentCode,
    row.batchNumber,
  );
}

function mapStandardBatchRow(row: {
  id: string;
  parentCode: string | null;
  batchNumber: number;
  code: string;
  name: string;
  preparedDate: Date;
  preparedBy: string;
  concentration: string;
  concentrationUnit: string;
  finalConcentration: string;
  expiryDate: Date;
  workflowStatus: PreparationWorkflowStatus;
  notes: string;
  preparedByStaff: { name: string } | null;
  approvedByStaff: { name: string } | null;
  approvedByStaffId: string | null;
}): PreparationHistoryReportRow {
  const approvedBy = resolveApprovedBy(row.approvedByStaff?.name ?? "", row.approvedByStaffId);
  const parentCode = row.parentCode || row.code;
  const finalConc = formatConcentration(row.finalConcentration || row.concentration, row.concentrationUnit);
  const theoreticalConc = formatConcentration(row.concentration, row.concentrationUnit);

  return baseRow(
    "STANDARD",
    row.id,
    row.code,
    row.name,
    row.preparedDate,
    row.preparedByStaff?.name || row.preparedBy,
    approvedBy,
    theoreticalConc,
    finalConc,
    row.expiryDate,
    row.workflowStatus,
    row.notes,
    { origin: "", lot: "", quantityUsed: "" },
    parentCode,
    row.batchNumber,
  );
}

function mapStrainBatchRow(row: {
  id: string;
  parentCode: string | null;
  batchNumber: number;
  code: string;
  name: string;
  preparedDate: Date;
  preparedBy: string;
  concentration: string;
  finalConcentration: string;
  expiryDate: Date;
  workflowStatus: PreparationWorkflowStatus;
  notes: string;
  sourceLotNumberSnapshot: string;
  preparedByStaff: { name: string } | null;
  approvedByStaff: { name: string } | null;
  approvedByStaffId: string | null;
  sourceStrain: { code: string; name: string };
}): PreparationHistoryReportRow {
  const approvedBy = resolveApprovedBy(row.approvedByStaff?.name ?? "", row.approvedByStaffId);
  const parentCode = row.parentCode || row.code;
  const finalConc = formatConcentration(row.finalConcentration || row.concentration, "");
  const theoreticalConc = formatConcentration(row.concentration, "");

  return baseRow(
    "STRAIN",
    row.id,
    row.code,
    row.name,
    row.preparedDate,
    row.preparedByStaff?.name || row.preparedBy,
    approvedBy,
    theoreticalConc,
    finalConc,
    row.expiryDate,
    row.workflowStatus,
    row.notes,
    {
      origin: row.sourceStrain.code,
      lot: row.sourceLotNumberSnapshot,
      quantityUsed: "1",
    },
    parentCode,
    row.batchNumber,
  );
}

function batchSortValue(row: PreparationHistoryReportRow, sortBy: string): string | number {
  switch (sortBy) {
    case "code":
      return row.code;
    case "name":
      return row.name;
    case "parentCode":
      return row.parentCode;
    case "preparedBy":
      return row.preparedBy;
    case "status":
      return row.status;
    case "type":
      return row.preparationType;
    case "preparedDate":
    default:
      return row.preparedDate;
  }
}

function compareBatchRows(
  a: PreparationHistoryReportRow,
  b: PreparationHistoryReportRow,
  sortBy: string,
  sortOrder: SortOrder,
): number {
  const av = batchSortValue(a, sortBy);
  const bv = batchSortValue(b, sortBy);
  let cmp: number;
  if (typeof av === "number" && typeof bv === "number") {
    cmp = av - bv;
  } else {
    cmp = String(av).localeCompare(String(bv), "vi");
  }
  if (cmp === 0) {
    cmp = a.code.localeCompare(b.code, "vi");
  }
  return sortOrder === "asc" ? cmp : -cmp;
}

function mergeSortedBatchRows(
  rows: PreparationHistoryReportRow[],
  sortBy: string,
  sortOrder: SortOrder,
): PreparationHistoryReportRow[] {
  return [...rows].sort((a, b) => compareBatchRows(a, b, sortBy, sortOrder));
}

const PREPARATION_TYPES: PreparationRecordType[] = ["CHEMICAL", "STANDARD", "STRAIN"];

function activePreparationTypes(typeFilter: string): PreparationRecordType[] {
  if (typeFilter === "CHEMICAL" || typeFilter === "STANDARD" || typeFilter === "STRAIN") {
    return [typeFilter];
  }
  return PREPARATION_TYPES;
}

async function countPreparedBatches(
  type: PreparationRecordType,
  params: PreparationHistoryListParams,
): Promise<number> {
  const where = buildPreparedCommonWhere(params);
  if (type === "CHEMICAL") return db.preparedChemical.count({ where });
  if (type === "STANDARD") return db.preparedStandard.count({ where });
  return db.preparedStrain.count({ where });
}

async function fetchPreparedBatchRows(
  type: PreparationRecordType,
  params: PreparationHistoryListParams,
  take: number,
): Promise<PreparationHistoryReportRow[]> {
  const where = buildPreparedCommonWhere(params);
  const orderBy = preparedOrderBy(params.sortBy, params.sortOrder);
  const staffSelect = {
    preparedByStaff: { select: { name: true } },
    approvedByStaff: { select: { name: true } },
  };

  if (type === "CHEMICAL") {
    const rows = await db.preparedChemical.findMany({
      where,
      include: staffSelect,
      orderBy,
      take,
    });
    return rows.map(mapChemicalBatchRow);
  }

  if (type === "STANDARD") {
    const rows = await db.preparedStandard.findMany({
      where,
      include: staffSelect,
      orderBy,
      take,
    });
    return rows.map(mapStandardBatchRow);
  }

  const rows = await db.preparedStrain.findMany({
    where,
    include: {
      ...staffSelect,
      sourceStrain: { select: { code: true, name: true } },
    },
    orderBy,
    take,
  });
  return rows.map(mapStrainBatchRow);
}

export async function listPreparationHistoryReportRows(
  params: PreparationHistoryListParams,
): Promise<PaginatedResult<PreparationHistoryReportRow>> {
  const types = activePreparationTypes(params.typeFilter);
  const skip = (params.page - 1) * params.limit;
  const fetchLimit = skip + params.limit;

  const counts = await Promise.all(types.map((type) => countPreparedBatches(type, params)));
  const total = counts.reduce((sum, count) => sum + count, 0);

  const batches = await Promise.all(
    types.map((type) => fetchPreparedBatchRows(type, params, fetchLimit)),
  );
  const items = mergeSortedBatchRows(batches.flat(), params.sortBy, params.sortOrder).slice(
    skip,
    skip + params.limit,
  );

  return {
    items,
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(Math.ceil(total / params.limit), 1),
  };
}

export function filterPreparationHistoryReportRows(
  rows: PreparationHistoryReportRow[],
  params: PreparationHistoryListParams,
): PreparationHistoryReportRow[] {
  return rows.filter((row) => {
    const matchType = params.typeFilter === "All" || row.preparationType === params.typeFilter;
    const matchStatus =
      params.statusFilter === "All" ||
      row.status === PREPARATION_WORKFLOW_STATUS_LABELS[params.statusFilter as PreparationWorkflowStatus];
    const matchFrom = !params.dateFrom || row.preparedDate >= params.dateFrom;
    const matchTo = !params.dateTo || row.preparedDate <= params.dateTo;
    const parentQ = params.parentCodeFilter.toLowerCase();
    const matchParentCode = !parentQ || row.parentCode.toLowerCase().includes(parentQ);
    const q = params.q.toLowerCase();
    const matchQuery =
      !q ||
      [row.code, row.name, row.preparedBy, row.approvedBy, row.sourceOrigin, row.sourceLot, row.notes].some(
        (value) => value.toLowerCase().includes(q),
      );
    return matchType && matchStatus && matchFrom && matchTo && matchParentCode && matchQuery;
  });
}

export async function getPreparationHistoryReportRows(): Promise<PreparationHistoryReportRow[]> {
  const [chemicals, standards, strains] = await Promise.all([
    db.preparedChemical.findMany({
      where: { deletedAt: null },
      include: {
        ingredients: {
          orderBy: { id: "asc" },
          include: { chemical: { select: { code: true } } },
        },
        preparedByStaff: { select: { name: true } },
        approvedByStaff: { select: { name: true } },
      },
      orderBy: { preparedDate: "desc" },
    }),
    db.preparedStandard.findMany({
      where: { deletedAt: null },
      include: {
        components: { orderBy: { id: "asc" } },
        solvents: { orderBy: { id: "asc" } },
        preparedByStaff: { select: { name: true } },
        approvedByStaff: { select: { name: true } },
      },
      orderBy: { preparedDate: "desc" },
    }),
    db.preparedStrain.findMany({
      where: { deletedAt: null },
      include: {
        sourceStrain: { select: { code: true, name: true } },
        preparedByStaff: { select: { name: true } },
        approvedByStaff: { select: { name: true } },
      },
      orderBy: { preparedDate: "desc" },
    }),
  ]);

  const rows: PreparationHistoryReportRow[] = [];

  for (const row of chemicals) {
    const approvedBy = resolveApprovedBy(
      row.approvedByStaff?.name ?? "",
      row.approvedByStaffId,
    );
    const parentCode = row.parentCode || row.code;
    const batchNumber = row.batchNumber;
    const finalConc = formatConcentration(
      row.finalConcentration || row.concentration,
      row.concentrationUnit,
    );
    const theoreticalConc = formatConcentration(row.concentration, row.concentrationUnit);

    if (row.ingredients.length === 0) {
      rows.push(
        baseRow(
          "CHEMICAL",
          row.id,
          row.code,
          row.name,
          row.preparedDate,
          row.preparedByStaff?.name || row.preparedBy,
          approvedBy,
          theoreticalConc,
          finalConc,
          row.expiryDate,
          row.workflowStatus,
          row.notes,
          { origin: "", lot: "", quantityUsed: "" },
          parentCode,
          batchNumber,
        ),
      );
      continue;
    }

    row.ingredients.forEach((ing, index) => {
      rows.push(
        baseRow(
          "CHEMICAL",
          row.id,
          row.code,
          row.name,
          row.preparedDate,
          row.preparedByStaff?.name || row.preparedBy,
          approvedBy,
          theoreticalConc,
          finalConc,
          row.expiryDate,
          row.workflowStatus,
          row.notes,
          {
            origin: ing.chemical.code || ing.chemicalNameSnapshot,
            lot: ing.lotNumberSnapshot,
            quantityUsed: formatQuantity(ing.quantityUsed, ing.unit),
          },
          parentCode,
          batchNumber,
          `-ing-${index}`,
        ),
      );
    });
  }

  for (const row of standards) {
    const approvedBy = resolveApprovedBy(
      row.approvedByStaff?.name ?? "",
      row.approvedByStaffId,
    );
    const parentCode = row.parentCode || row.code;
    const batchNumber = row.batchNumber;
    const finalConc = formatConcentration(
      row.finalConcentration || row.concentration,
      row.concentrationUnit,
    );
    const theoreticalConc = formatConcentration(row.concentration, row.concentrationUnit);
    const sources = [
      ...row.components.map((comp) => ({
        origin: comp.standardCodeSnapshot || comp.standardNameSnapshot,
        lot: comp.lotNumberSnapshot,
        quantityUsed: formatQuantity(comp.quantityUsed, comp.unit),
        originalConcentration: formatConcentration(
          comp.concentrationSnapshot || comp.puritySnapshot,
          comp.concentrationUnitSnapshot,
        ),
      })),
      ...row.solvents.map((sol) => ({
        origin: sol.chemicalCodeSnapshot
          ? `Dung môi: ${sol.chemicalCodeSnapshot}`
          : `Dung môi: ${sol.chemicalNameSnapshot}`,
        lot: sol.lotNumberSnapshot,
        quantityUsed: formatQuantity(sol.quantityUsed, sol.unit),
        originalConcentration: "",
      })),
    ];

    if (sources.length === 0) {
      rows.push(
        baseRow(
          "STANDARD",
          row.id,
          row.code,
          row.name,
          row.preparedDate,
          row.preparedByStaff?.name || row.preparedBy,
          approvedBy,
          theoreticalConc,
          finalConc,
          row.expiryDate,
          row.workflowStatus,
          row.notes,
          { origin: "", lot: "", quantityUsed: "" },
          parentCode,
          batchNumber,
        ),
      );
      continue;
    }

    sources.forEach((source, index) => {
      rows.push(
        baseRow(
          "STANDARD",
          row.id,
          row.code,
          row.name,
          row.preparedDate,
          row.preparedByStaff?.name || row.preparedBy,
          approvedBy,
          theoreticalConc,
          finalConc,
          row.expiryDate,
          row.workflowStatus,
          row.notes,
          source,
          parentCode,
          batchNumber,
          `-src-${index}`,
        ),
      );
    });
  }

  for (const row of strains) {
    const approvedBy = resolveApprovedBy(
      row.approvedByStaff?.name ?? "",
      row.approvedByStaffId,
    );
    const parentCode = row.parentCode || row.code;
    const batchNumber = row.batchNumber;
    const finalConc = formatConcentration(
      row.finalConcentration || row.concentration,
      "",
    );
    const theoreticalConc = formatConcentration(row.concentration, "");

    rows.push(
      baseRow(
        "STRAIN",
        row.id,
        row.code,
        row.name,
        row.preparedDate,
        row.preparedByStaff?.name || row.preparedBy,
        approvedBy,
        theoreticalConc,
        finalConc,
        row.expiryDate,
        row.workflowStatus,
        row.notes,
        {
          origin: row.sourceStrain.code,
          lot: row.sourceLotNumberSnapshot,
          quantityUsed: "1",
        },
        parentCode,
        batchNumber,
      ),
    );
  }

  return rows.sort((a, b) => {
    const dateCmp = b.preparedDate.localeCompare(a.preparedDate);
    if (dateCmp !== 0) return dateCmp;
    return a.code.localeCompare(b.code);
  });
}

export function preparationHistoryReportToExcelRows(
  rows: PreparationHistoryReportRow[],
): Record<string, string>[] {
  return rows.map((row) => ({
    "Mã nhóm": row.parentCode,
    "Mã lô": row.code,
    Loại: row.type,
    "Tên thành phẩm": row.name,
    "Ngày pha": row.preparedDate,
    "Người pha": row.preparedBy,
    "Người duyệt": row.approvedBy,
    "Nguồn gốc": row.sourceOrigin,
    "Số lô gốc": row.sourceLot,
    "Lượng sử dụng": row.quantityUsed,
    "Nồng độ lý thuyết": row.originalConcentration,
    "Nồng độ thực tế": row.finalConcentration,
    "Hạn sử dụng": row.expiryDate,
    "Trạng thái": row.status,
    "Ghi chú": row.notes,
  }));
}
