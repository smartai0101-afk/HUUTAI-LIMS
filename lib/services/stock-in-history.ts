import type { Prisma, StockInSourceType } from "@prisma/client";
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
import { stockInSourceLabel } from "@/lib/services/stock-in-match";
import type { StockInLogView } from "@/types";

export const STOCK_IN_HISTORY_SORT_ALLOWLIST = [
  "time",
  "sourceType",
  "sourceCode",
  "sourceName",
  "lot",
  "quantityIn",
  "unit",
  "user",
  "notes",
] as const;

export type StockInHistorySortKey = (typeof STOCK_IN_HISTORY_SORT_ALLOWLIST)[number];

const STOCK_IN_HISTORY_SORT_MAP: SortFieldMap = {
  time: "time",
  sourceType: "sourceType",
  sourceCode: "sourceCode",
  sourceName: "sourceName",
  lot: "lot",
  quantityIn: "quantityIn",
  unit: "unit",
  user: "user",
  notes: "notes",
};

const DEFAULT_STOCK_IN_HISTORY_ORDER = [{ time: "desc" as const }];

export type StockInHistoryListParams = ListQueryParams & {
  sourceFilter: "all" | StockInSourceType;
};

function firstParam(searchParams: SearchParamsInput, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseStockInHistoryListParams(searchParams: SearchParamsInput): StockInHistoryListParams {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "time", sortOrder: "desc", page: 1, limit: 50 },
    STOCK_IN_HISTORY_SORT_ALLOWLIST,
  );
  const rawSource = firstParam(searchParams, "sourceFilter");
  const sourceFilter =
    rawSource === "Chemical" || rawSource === "Standard" || rawSource === "MicrobialStrain"
      ? rawSource
      : "all";

  return { ...base, sourceFilter };
}

function formatDateTime(value: Date): string {
  return value.toISOString();
}

function mapRow(row: {
  id: string;
  time: Date;
  user: string;
  sourceType: StockInSourceType;
  sourceCode: string;
  sourceName: string;
  lot: string;
  quantityIn: number;
  unit: string;
  notes: string;
  referenceId: string;
}): StockInLogView {
  return {
    id: row.id,
    time: formatDateTime(row.time),
    user: row.user,
    sourceType: row.sourceType,
    sourceLabel: stockInSourceLabel(row.sourceType),
    sourceCode: row.sourceCode,
    sourceName: row.sourceName,
    lot: row.lot,
    quantityIn: row.quantityIn,
    unit: row.unit,
    notes: row.notes,
    referenceId: row.referenceId,
  };
}

function buildStockInHistoryWhere(params: StockInHistoryListParams): Prisma.StockInLogWhereInput {
  const and: Prisma.StockInLogWhereInput[] = [];

  if (params.sourceFilter !== "all") {
    and.push({ sourceType: params.sourceFilter });
  }

  if (params.q) {
    const q = params.q;
    and.push({
      OR: [
        { sourceCode: { contains: q } },
        { sourceName: { contains: q } },
        { lot: { contains: q } },
        { user: { contains: q } },
        { notes: { contains: q } },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

export async function listStockInHistory(
  params: StockInHistoryListParams,
): Promise<PaginatedResult<StockInLogView>> {
  const where = buildStockInHistoryWhere(params);
  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    STOCK_IN_HISTORY_SORT_MAP,
    DEFAULT_STOCK_IN_HISTORY_ORDER,
  );
  const { skip, take } = getSkipTake(params.page, params.limit);

  const [rows, total] = await Promise.all([
    db.stockInLog.findMany({ where, orderBy, skip, take }),
    db.stockInLog.count({ where }),
  ]);

  return {
    items: rows.map(mapRow),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(Math.ceil(total / params.limit), 1),
  };
}

export async function getStockInHistory(sourceType?: StockInSourceType): Promise<StockInLogView[]> {
  const { items } = await listStockInHistory({
    q: "",
    sortBy: "time",
    sortOrder: "desc",
    page: 1,
    limit: 500,
    sortActive: false,
    sourceFilter: sourceType ?? "all",
  });
  return items;
}
