import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  buildPrismaOrderBy,
  getSkipTake,
  parseListQueryParams,
  type ListQueryParams,
  type PaginatedResult,
  type SearchParamsInput,
  type SortFieldMap,
} from "@/lib/list-query";
import { toDateString } from "@/lib/mappers";
import type { EnvironmentalLogView } from "@/types";

export const ENVIRONMENTAL_LOG_SORT_ALLOWLIST = [
  "loggedAt",
  "location",
  "temperature",
  "humidity",
  "recordedByStaffName",
  "notes",
  "createdAt",
] as const;

export type EnvironmentalLogSortKey = (typeof ENVIRONMENTAL_LOG_SORT_ALLOWLIST)[number];

const ENVIRONMENTAL_LOG_SORT_MAP: SortFieldMap = {
  loggedAt: "loggedAt",
  location: "location",
  temperature: "temperature",
  humidity: "humidity",
  recordedByStaffName: "recordedByStaff",
  notes: "notes",
  createdAt: "createdAt",
};

const DEFAULT_ENVIRONMENTAL_LOG_ORDER = [{ loggedAt: "desc" as const }];

export type EnvironmentalLogListParams = ListQueryParams;

export function parseEnvironmentalLogListParams(searchParams: SearchParamsInput): EnvironmentalLogListParams {
  return parseListQueryParams(
    searchParams,
    { sortBy: "loggedAt", sortOrder: "desc", page: 1, limit: 50 },
    ENVIRONMENTAL_LOG_SORT_ALLOWLIST,
  );
}

function formatSnapshot(row: {
  loggedAt: Date;
  location: string;
  temperature: number | null;
  humidity: number | null;
  notes: string;
}): string {
  const parts: string[] = [`Điều kiện môi trường — ${row.location}`, toDateString(row.loggedAt)];
  if (row.temperature != null) parts.push(`${row.temperature}°C`);
  if (row.humidity != null) parts.push(`${row.humidity}% RH`);
  const base = parts.join(" · ");
  return row.notes.trim() ? `${base} — ${row.notes.trim()}` : base;
}

function mapRow(row: {
  id: string;
  loggedAt: Date;
  location: string;
  temperature: number | null;
  humidity: number | null;
  recordedByStaffId: string | null;
  notes: string;
  createdAt: Date;
  recordedByStaff: { name: string } | null;
}): EnvironmentalLogView {
  return {
    id: row.id,
    loggedAt: toDateString(row.loggedAt),
    location: row.location,
    temperature: row.temperature,
    humidity: row.humidity,
    recordedByStaffId: row.recordedByStaffId,
    recordedByStaffName: row.recordedByStaff?.name ?? "",
    notes: row.notes,
    createdAt: toDateString(row.createdAt),
    snapshotText: formatSnapshot(row),
  };
}

function buildEnvironmentalLogWhere(q: string): Prisma.EnvironmentalLogWhereInput {
  if (!q) return {};
  return {
    OR: [
      { location: { contains: q } },
      { notes: { contains: q } },
      { recordedByStaff: { name: { contains: q } } },
    ],
  };
}

function buildEnvironmentalLogOrderBy(
  sortBy: string,
  sortOrder: "asc" | "desc",
): Prisma.EnvironmentalLogOrderByWithRelationInput | Prisma.EnvironmentalLogOrderByWithRelationInput[] {
  if (sortBy === "recordedByStaffName") {
    return { recordedByStaff: { name: sortOrder } };
  }
  return buildPrismaOrderBy(sortBy, sortOrder, ENVIRONMENTAL_LOG_SORT_MAP, DEFAULT_ENVIRONMENTAL_LOG_ORDER);
}

export async function listEnvironmentalLogs(
  params: EnvironmentalLogListParams,
): Promise<PaginatedResult<EnvironmentalLogView>> {
  const where = buildEnvironmentalLogWhere(params.q);
  const orderBy = buildEnvironmentalLogOrderBy(params.sortBy, params.sortOrder);
  const { skip, take } = getSkipTake(params.page, params.limit);

  const [rows, total] = await Promise.all([
    db.environmentalLog.findMany({
      where,
      include: { recordedByStaff: { select: { name: true } } },
      orderBy,
      skip,
      take,
    }),
    db.environmentalLog.count({ where }),
  ]);

  return {
    items: rows.map(mapRow),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(Math.ceil(total / params.limit), 1),
  };
}

export async function getEnvironmentalLogs(limit = 200): Promise<EnvironmentalLogView[]> {
  const { items } = await listEnvironmentalLogs({
    q: "",
    sortBy: "loggedAt",
    sortOrder: "desc",
    page: 1,
    limit,
    sortActive: false,
  });
  return items;
}

export async function getRecentEnvironmentalLogs(limit = 20): Promise<EnvironmentalLogView[]> {
  return getEnvironmentalLogs(limit);
}
