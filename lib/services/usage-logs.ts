import type { Prisma, UsageLogType, UsageSourceType } from "@prisma/client";
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
import { mapUsageLog } from "@/lib/mappers";
import type { UsageLogView } from "@/types";

export const USAGE_LOG_SORT_ALLOWLIST = ["date", "type", "quantity", "performedBy"] as const;

export type UsageLogSortKey = (typeof USAGE_LOG_SORT_ALLOWLIST)[number];

const USAGE_LOG_SORT_MAP: SortFieldMap = {
  date: "date",
  type: "type",
  quantity: "quantity",
  performedBy: "performedBy",
};

const DEFAULT_USAGE_LOG_ORDER = [{ date: "desc" as const }];

export type UsageLogListParams = ListQueryParams & {
  typeFilter: string;
  sourceFilter: string;
};

function firstParam(searchParams: SearchParamsInput, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseUsageLogListParams(searchParams: SearchParamsInput): UsageLogListParams {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "date", sortOrder: "desc", page: 1, limit: 50 },
    USAGE_LOG_SORT_ALLOWLIST,
  );

  return {
    ...base,
    typeFilter: firstParam(searchParams, "typeFilter")?.trim() || "All",
    sourceFilter: firstParam(searchParams, "sourceFilter")?.trim() || "all",
  };
}

async function resolveSourceMeta(sourceType: string, sourceId: string) {
  if (sourceType === "Chemical") {
    const row = await db.chemical.findUnique({ where: { id: sourceId }, select: { code: true, name: true } });
    return row ?? { code: "—", name: "—" };
  }
  if (sourceType === "Standard") {
    const row = await db.standard.findUnique({ where: { id: sourceId }, select: { code: true, name: true } });
    return row ?? { code: "—", name: "—" };
  }
  if (sourceType === "MicrobialStrain") {
    const row = await db.microbialStrain.findUnique({
      where: { id: sourceId },
      select: { code: true, name: true },
    });
    return row ?? { code: "—", name: "—" };
  }
  return { code: "—", name: "—" };
}

async function buildUsageLogTextSearch(q: string): Promise<Prisma.UsageLogWhereInput> {
  const [chemicals, standards, strains] = await Promise.all([
    db.chemical.findMany({
      where: { OR: [{ code: { contains: q } }, { name: { contains: q } }] },
      select: { id: true },
    }),
    db.standard.findMany({
      where: { OR: [{ code: { contains: q } }, { name: { contains: q } }] },
      select: { id: true },
    }),
    db.microbialStrain.findMany({
      where: { OR: [{ code: { contains: q } }, { name: { contains: q } }] },
      select: { id: true },
    }),
  ]);

  const or: Prisma.UsageLogWhereInput[] = [
    { performedBy: { contains: q } },
    { purpose: { contains: q } },
    { notes: { contains: q } },
    { referenceCode: { contains: q } },
  ];

  if (chemicals.length > 0) {
    or.push({ sourceType: "Chemical", sourceId: { in: chemicals.map((row) => row.id) } });
  }
  if (standards.length > 0) {
    or.push({ sourceType: "Standard", sourceId: { in: standards.map((row) => row.id) } });
  }
  if (strains.length > 0) {
    or.push({ sourceType: "MicrobialStrain", sourceId: { in: strains.map((row) => row.id) } });
  }

  return { OR: or };
}

async function buildUsageLogWhere(params: UsageLogListParams): Promise<Prisma.UsageLogWhereInput> {
  const and: Prisma.UsageLogWhereInput[] = [];

  if (params.q) {
    and.push(await buildUsageLogTextSearch(params.q));
  }

  if (params.typeFilter !== "All") {
    and.push({ type: params.typeFilter as UsageLogType });
  }

  if (params.sourceFilter !== "all") {
    and.push({ sourceType: params.sourceFilter as UsageSourceType });
  }

  return and.length > 0 ? { AND: and } : {};
}

async function mapUsageLogRows(
  logs: Prisma.UsageLogGetPayload<{ include: { container: { select: { code: true } } } }>[],
): Promise<UsageLogView[]> {
  const metaCache = new Map<string, { code: string; name: string }>();
  const views: UsageLogView[] = [];

  for (const log of logs) {
    const cacheKey = `${log.sourceType}:${log.sourceId}`;
    let meta = metaCache.get(cacheKey);
    if (!meta) {
      meta = await resolveSourceMeta(log.sourceType, log.sourceId);
      metaCache.set(cacheKey, meta);
    }
    views.push(
      mapUsageLog({
        id: log.id,
        date: log.date,
        type: log.type,
        sourceType: log.sourceType,
        sourceId: log.sourceId,
        containerId: log.containerId,
        quantity: log.quantity,
        unit: log.unit,
        performedBy: log.performedBy,
        performedByStaffId: log.performedByStaffId,
        purpose: log.purpose,
        notes: log.notes,
        referenceCode: log.referenceCode,
        itemCode: meta.code,
        itemName: meta.name,
        containerCode: log.container?.code,
      }),
    );
  }

  return views;
}

export async function listUsageLogs(
  params: UsageLogListParams,
  paginate = true,
): Promise<PaginatedResult<UsageLogView>> {
  const where = await buildUsageLogWhere(params);
  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    USAGE_LOG_SORT_MAP,
    DEFAULT_USAGE_LOG_ORDER,
  );

  if (!paginate) {
    const logs = await db.usageLog.findMany({
      where,
      include: { container: { select: { code: true } } },
      orderBy,
    });
    const items = await mapUsageLogRows(logs);
    return {
      items,
      total: items.length,
      page: 1,
      limit: items.length || 1,
      totalPages: 1,
    };
  }

  const { skip, take } = getSkipTake(params.page, params.limit);
  const [logs, total] = await Promise.all([
    db.usageLog.findMany({
      where,
      include: { container: { select: { code: true } } },
      orderBy,
      skip,
      take,
    }),
    db.usageLog.count({ where }),
  ]);

  return {
    items: await mapUsageLogRows(logs),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(Math.ceil(total / params.limit), 1),
  };
}

export async function getUsageLogs() {
  const { items } = await listUsageLogs(
    {
      q: "",
      sortBy: "date",
      sortOrder: "desc",
      page: 1,
      limit: 10_000,
      sortActive: false,
      typeFilter: "All",
      sourceFilter: "all",
    },
    false,
  );
  return items;
}
