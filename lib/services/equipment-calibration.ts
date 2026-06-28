import type { CalibrationResult, PostCalibrationEvaluationStatus, Prisma, ScheduleStatus } from "@prisma/client";
import { db } from "@/lib/db";
import {
  buildPrismaOrderBy,
  parseListQueryParams,
  type ListQueryParams,
  type PaginatedResult,
  type SearchParamsInput,
  type SortFieldMap,
  type SortOrder,
} from "@/lib/list-query";
import {
  mapCalibrationPlan,
  mapCalibrationRecord,
  mapPostCalibrationEvaluation,
} from "@/lib/mappers/equipment";
import { SCHEDULE_STATUS_FILTERS } from "@/lib/equipment-schedule";
import type {
  CalibrationPlanView,
  CalibrationRecordView,
  PostCalibrationEvaluationView,
} from "@/types";

const equipmentInclude = { equipment: { select: { id: true, code: true, name: true } } };

function firstParam(searchParams: SearchParamsInput, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function equipmentSortFields(sortOrder: SortOrder): SortFieldMap {
  return {
    equipmentCode: { equipment: { code: sortOrder } },
    equipmentName: { equipment: { name: sortOrder } },
  } as unknown as SortFieldMap;
}

function toPaginatedResult<T>(items: T[]): PaginatedResult<T> {
  return {
    items,
    total: items.length,
    page: 1,
    limit: items.length || 1,
    totalPages: 1,
  };
}

// --- Calibration plans ---

export const CALIBRATION_PLAN_SORT_ALLOWLIST = [
  "equipmentCode",
  "equipmentName",
  "name",
  "cycleMonths",
  "lastDate",
  "nextDate",
  "vendor",
  "status",
] as const;

export type CalibrationPlanListParams = ListQueryParams & {
  status: (typeof SCHEDULE_STATUS_FILTERS)[number];
};

export function parseCalibrationPlanListParams(
  searchParams: SearchParamsInput,
): CalibrationPlanListParams {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "nextDate", sortOrder: "asc", page: 1, limit: 50 },
    CALIBRATION_PLAN_SORT_ALLOWLIST,
  );
  const rawStatus = firstParam(searchParams, "status");
  const status =
    rawStatus === "Green" || rawStatus === "Yellow" || rawStatus === "Red" ? rawStatus : "All";
  return { ...base, status };
}

function buildCalibrationPlanSortMap(sortOrder: SortOrder): SortFieldMap {
  return {
    ...equipmentSortFields(sortOrder),
    name: "name",
    cycleMonths: "cycleMonths",
    lastDate: "lastDate",
    nextDate: "nextDate",
    vendor: "vendor",
    status: "status",
  };
}

function buildCalibrationPlanWhere(params: CalibrationPlanListParams): Prisma.CalibrationPlanWhereInput {
  const and: Prisma.CalibrationPlanWhereInput[] = [];

  if (params.q) {
    const q = params.q;
    and.push({
      OR: [
        { name: { contains: q } },
        { vendor: { contains: q } },
        { equipment: { code: { contains: q } } },
        { equipment: { name: { contains: q } } },
      ],
    });
  }

  if (params.status !== "All") {
    and.push({ status: params.status as ScheduleStatus });
  }

  return and.length > 0 ? { AND: and } : {};
}

export async function listCalibrationPlans(
  params: CalibrationPlanListParams,
): Promise<PaginatedResult<CalibrationPlanView>> {
  const where = buildCalibrationPlanWhere(params);
  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    buildCalibrationPlanSortMap(params.sortOrder),
    [{ nextDate: "asc" as const }, { equipment: { code: "asc" as const } }],
  );
  const rows = await db.calibrationPlan.findMany({ where, orderBy, include: equipmentInclude });
  return toPaginatedResult(rows.map(mapCalibrationPlan));
}

export async function getCalibrationPlans(equipmentId?: string) {
  const result = await listCalibrationPlans({
    q: "",
    sortBy: "nextDate",
    sortOrder: "asc",
    page: 1,
    limit: 50,
    sortActive: false,
    status: "All",
  });
  if (!equipmentId) return result.items;
  return result.items.filter((item) => item.equipmentId === equipmentId);
}

// --- Calibration records ---

export const CALIBRATION_RECORD_SORT_ALLOWLIST = [
  "equipmentCode",
  "equipmentName",
  "calibrationDate",
  "certificateNo",
  "result",
  "vendor",
] as const;

export type CalibrationRecordListParams = ListQueryParams & {
  result: "All" | CalibrationResult;
};

export function parseCalibrationRecordListParams(
  searchParams: SearchParamsInput,
): CalibrationRecordListParams {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "equipmentCode", sortOrder: "asc", page: 1, limit: 50 },
    CALIBRATION_RECORD_SORT_ALLOWLIST,
  );
  const rawResult = firstParam(searchParams, "result");
  const result = rawResult === "Pass" || rawResult === "Fail" ? rawResult : "All";
  return { ...base, result };
}

function buildCalibrationRecordSortMap(sortOrder: SortOrder): SortFieldMap {
  return {
    ...equipmentSortFields(sortOrder),
    calibrationDate: "calibrationDate",
    certificateNo: "certificateNo",
    result: "result",
    vendor: "vendor",
  };
}

async function equipmentIdsWithLatestResult(result: CalibrationResult): Promise<string[]> {
  const rows = await db.calibrationRecord.findMany({
    orderBy: [{ calibrationDate: "desc" }, { createdAt: "desc" }],
    select: { equipmentId: true, result: true },
  });
  const latest = new Map<string, CalibrationResult>();
  for (const row of rows) {
    if (!latest.has(row.equipmentId)) latest.set(row.equipmentId, row.result);
  }
  return [...latest.entries()].filter(([, r]) => r === result).map(([id]) => id);
}

function buildCalibrationRecordWhere(
  params: CalibrationRecordListParams,
): Prisma.CalibrationRecordWhereInput {
  const and: Prisma.CalibrationRecordWhereInput[] = [];

  if (params.q) {
    const q = params.q;
    and.push({
      OR: [
        { certificateNo: { contains: q } },
        { vendor: { contains: q } },
        { equipment: { code: { contains: q } } },
        { equipment: { name: { contains: q } } },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

export async function listCalibrationRecords(
  params: CalibrationRecordListParams,
): Promise<PaginatedResult<CalibrationRecordView>> {
  const and: Prisma.CalibrationRecordWhereInput[] = [];
  const baseWhere = buildCalibrationRecordWhere(params);
  if (baseWhere.AND) {
    const clauses = Array.isArray(baseWhere.AND) ? baseWhere.AND : [baseWhere.AND];
    and.push(...clauses);
  }

  if (params.result !== "All") {
    const equipmentIds = await equipmentIdsWithLatestResult(params.result);
    if (equipmentIds.length === 0) return toPaginatedResult([]);
    and.push({ equipmentId: { in: equipmentIds } });
  }

  const where = and.length > 0 ? { AND: and } : {};

  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    buildCalibrationRecordSortMap(params.sortOrder),
    [{ calibrationDate: "desc" as const }],
  );
  const rows = await db.calibrationRecord.findMany({
    where,
    orderBy,
    include: { ...equipmentInclude, evaluation: true },
  });
  return toPaginatedResult(rows.map(mapCalibrationRecord));
}

export async function getCalibrationRecords(equipmentId?: string) {
  const result = await listCalibrationRecords({
    q: "",
    sortBy: "calibrationDate",
    sortOrder: "desc",
    page: 1,
    limit: 50,
    sortActive: false,
    result: "All",
  });
  if (!equipmentId) return result.items;
  return result.items.filter((item) => item.equipmentId === equipmentId);
}

// --- Post-calibration evaluations ---

export const CALIBRATION_EVALUATION_SORT_ALLOWLIST = [
  "equipmentCode",
  "calibrationDate",
  "certificateNo",
  "status",
  "approvedBy",
] as const;

export type CalibrationEvaluationListParams = ListQueryParams & {
  status: string;
};

export function parseCalibrationEvaluationListParams(
  searchParams: SearchParamsInput,
): CalibrationEvaluationListParams {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "calibrationDate", sortOrder: "desc", page: 1, limit: 50 },
    CALIBRATION_EVALUATION_SORT_ALLOWLIST,
  );
  return { ...base, status: firstParam(searchParams, "status")?.trim() || "All" };
}

function buildCalibrationEvaluationSortMap(sortOrder: SortOrder): SortFieldMap {
  return {
    equipmentCode: { equipment: { code: sortOrder } },
    calibrationDate: { calibrationRecord: { calibrationDate: sortOrder } },
    certificateNo: { calibrationRecord: { certificateNo: sortOrder } },
    status: "status",
    approvedBy: "approvedBy",
  } as unknown as SortFieldMap;
}

function buildCalibrationEvaluationWhere(
  params: CalibrationEvaluationListParams,
): Prisma.PostCalibrationEvaluationWhereInput {
  const and: Prisma.PostCalibrationEvaluationWhereInput[] = [];

  if (params.q) {
    const q = params.q;
    and.push({
      OR: [
        { equipment: { code: { contains: q } } },
        { equipment: { name: { contains: q } } },
        { calibrationRecord: { certificateNo: { contains: q } } },
      ],
    });
  }

  if (params.status !== "All") {
    and.push({ status: params.status as PostCalibrationEvaluationStatus });
  }

  return and.length > 0 ? { AND: and } : {};
}

export async function listCalibrationEvaluations(
  params: CalibrationEvaluationListParams,
): Promise<PaginatedResult<PostCalibrationEvaluationView>> {
  const where = buildCalibrationEvaluationWhere(params);
  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    buildCalibrationEvaluationSortMap(params.sortOrder),
    [{ createdAt: "desc" as const }],
  );
  const rows = await db.postCalibrationEvaluation.findMany({
    where,
    orderBy,
    include: {
      ...equipmentInclude,
      calibrationRecord: { select: { calibrationDate: true, certificateNo: true } },
    },
  });
  return toPaginatedResult(rows.map(mapPostCalibrationEvaluation));
}

export async function getCalibrationEvaluations(equipmentId?: string) {
  const result = await listCalibrationEvaluations({
    q: "",
    sortBy: "calibrationDate",
    sortOrder: "desc",
    page: 1,
    limit: 50,
    sortActive: false,
    status: "All",
  });
  if (!equipmentId) return result.items;
  return result.items.filter((item) => item.equipmentId === equipmentId);
}
