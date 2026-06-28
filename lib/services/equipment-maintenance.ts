import type { Prisma, RepairProposalStatus, ScheduleStatus } from "@prisma/client";
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
  mapMaintenanceLog,
  mapMaintenancePlan,
  mapRepairProposal,
} from "@/lib/mappers/equipment";
import { SCHEDULE_STATUS_FILTERS } from "@/lib/equipment-schedule";
import type { MaintenanceLogView, MaintenancePlanView, RepairProposalView } from "@/types";

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

// --- Maintenance plans ---

export const MAINTENANCE_PLAN_SORT_ALLOWLIST = [
  "equipmentCode",
  "equipmentName",
  "name",
  "cycleMonths",
  "nextDate",
  "status",
] as const;

export type MaintenancePlanListParams = ListQueryParams & {
  status: (typeof SCHEDULE_STATUS_FILTERS)[number];
};

export function parseMaintenancePlanListParams(
  searchParams: SearchParamsInput,
): MaintenancePlanListParams {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "nextDate", sortOrder: "asc", page: 1, limit: 50 },
    MAINTENANCE_PLAN_SORT_ALLOWLIST,
  );
  const rawStatus = firstParam(searchParams, "status");
  const status =
    rawStatus === "Green" || rawStatus === "Yellow" || rawStatus === "Red" ? rawStatus : "All";
  return { ...base, status };
}

function buildMaintenancePlanSortMap(sortOrder: SortOrder): SortFieldMap {
  return {
    ...equipmentSortFields(sortOrder),
    name: "name",
    cycleMonths: "cycleMonths",
    nextDate: "nextDate",
    status: "status",
  };
}

function buildMaintenancePlanWhere(
  params: MaintenancePlanListParams,
): Prisma.MaintenancePlanWhereInput {
  const and: Prisma.MaintenancePlanWhereInput[] = [];

  if (params.q) {
    const q = params.q;
    and.push({
      OR: [
        { name: { contains: q } },
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

export async function listMaintenancePlans(
  params: MaintenancePlanListParams,
): Promise<PaginatedResult<MaintenancePlanView>> {
  const where = buildMaintenancePlanWhere(params);
  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    buildMaintenancePlanSortMap(params.sortOrder),
    [{ nextDate: "asc" as const }, { equipment: { code: "asc" as const } }],
  );
  const rows = await db.maintenancePlan.findMany({ where, orderBy, include: equipmentInclude });
  return toPaginatedResult(rows.map(mapMaintenancePlan));
}

export async function getMaintenancePlans(equipmentId?: string) {
  const result = await listMaintenancePlans({
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

// --- Maintenance logs ---

export const MAINTENANCE_LOG_SORT_ALLOWLIST = [
  "equipmentCode",
  "issueDate",
  "description",
  "completedDate",
] as const;

export type MaintenanceLogListParams = ListQueryParams & {
  completed: "All" | "Open" | "Done";
};

export function parseMaintenanceLogListParams(
  searchParams: SearchParamsInput,
): MaintenanceLogListParams {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "issueDate", sortOrder: "desc", page: 1, limit: 50 },
    MAINTENANCE_LOG_SORT_ALLOWLIST,
  );
  const raw = firstParam(searchParams, "completed");
  const completed = raw === "Open" || raw === "Done" ? raw : "All";
  return { ...base, completed };
}

function buildMaintenanceLogSortMap(sortOrder: SortOrder): SortFieldMap {
  return {
    ...equipmentSortFields(sortOrder),
    issueDate: "issueDate",
    description: "description",
    completedDate: "completedDate",
  };
}

function buildMaintenanceLogWhere(params: MaintenanceLogListParams): Prisma.MaintenanceLogWhereInput {
  const and: Prisma.MaintenanceLogWhereInput[] = [];

  if (params.q) {
    const q = params.q;
    and.push({
      OR: [
        { description: { contains: q } },
        { equipment: { code: { contains: q } } },
        { equipment: { name: { contains: q } } },
      ],
    });
  }

  if (params.completed === "Open") {
    and.push({ completedDate: null });
  } else if (params.completed === "Done") {
    and.push({ NOT: { completedDate: null } });
  }

  return and.length > 0 ? { AND: and } : {};
}

export async function listMaintenanceLogs(
  params: MaintenanceLogListParams,
): Promise<PaginatedResult<MaintenanceLogView>> {
  const where = buildMaintenanceLogWhere(params);
  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    buildMaintenanceLogSortMap(params.sortOrder),
    [{ issueDate: "desc" as const }],
  );
  const rows = await db.maintenanceLog.findMany({
    where,
    orderBy,
    include: {
      ...equipmentInclude,
      repairProposal: { select: { ticketNo: true } },
    },
  });
  return toPaginatedResult(rows.map(mapMaintenanceLog));
}

export async function getMaintenanceLogs(equipmentId?: string) {
  const result = await listMaintenanceLogs({
    q: "",
    sortBy: "issueDate",
    sortOrder: "desc",
    page: 1,
    limit: 50,
    sortActive: false,
    completed: "All",
  });
  if (!equipmentId) return result.items;
  return result.items.filter((item) => item.equipmentId === equipmentId);
}

// --- Repair proposals ---

export const REPAIR_PROPOSAL_SORT_ALLOWLIST = [
  "ticketNo",
  "equipmentCode",
  "priority",
  "status",
  "reportedBy",
] as const;

export type RepairProposalListParams = ListQueryParams & {
  status: string;
};

export function parseRepairProposalListParams(
  searchParams: SearchParamsInput,
): RepairProposalListParams {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "ticketNo", sortOrder: "desc", page: 1, limit: 50 },
    REPAIR_PROPOSAL_SORT_ALLOWLIST,
  );
  return { ...base, status: firstParam(searchParams, "status")?.trim() || "All" };
}

function buildRepairProposalSortMap(sortOrder: SortOrder): SortFieldMap {
  return {
    ticketNo: "ticketNo",
    equipmentCode: { equipment: { code: sortOrder } },
    priority: "priority",
    status: "status",
    reportedBy: "reportedBy",
  } as unknown as SortFieldMap;
}

function buildRepairProposalWhere(
  params: RepairProposalListParams,
): Prisma.RepairProposalWhereInput {
  const and: Prisma.RepairProposalWhereInput[] = [];

  if (params.q) {
    const q = params.q;
    and.push({
      OR: [
        { ticketNo: { contains: q } },
        { equipment: { code: { contains: q } } },
        { equipment: { name: { contains: q } } },
      ],
    });
  }

  if (params.status !== "All") {
    and.push({ status: params.status as RepairProposalStatus });
  }

  return and.length > 0 ? { AND: and } : {};
}

export async function listRepairProposals(
  params: RepairProposalListParams,
): Promise<PaginatedResult<RepairProposalView>> {
  const where = buildRepairProposalWhere(params);
  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    buildRepairProposalSortMap(params.sortOrder),
    [{ createdAt: "desc" as const }],
  );
  const rows = await db.repairProposal.findMany({ where, orderBy, include: equipmentInclude });
  return toPaginatedResult(rows.map(mapRepairProposal));
}

export async function getRepairProposals(equipmentId?: string) {
  const result = await listRepairProposals({
    q: "",
    sortBy: "ticketNo",
    sortOrder: "desc",
    page: 1,
    limit: 50,
    sortActive: false,
    status: "All",
  });
  if (!equipmentId) return result.items;
  return result.items.filter((item) => item.equipmentId === equipmentId);
}

export async function generateTicketNo(): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefix = `RP-${year}-`;
  const latest = await db.repairProposal.findFirst({
    where: { ticketNo: { startsWith: prefix } },
    orderBy: { ticketNo: "desc" },
  });
  let seq = 1;
  if (latest) {
    const part = latest.ticketNo.slice(prefix.length);
    const n = Number.parseInt(part, 10);
    if (Number.isFinite(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(4, "0")}`;
}
