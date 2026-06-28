import type { InventoryActionType, InventoryTransactionType, Prisma } from "@prisma/client";
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

export type InventoryLedgerRow = {
  id: string;
  time: string;
  user: string;
  module: string;
  sourceType: string;
  sourceCode: string;
  stockLotId: string | null;
  lotNumber: string;
  quantityBefore: number;
  quantityUsed: number;
  quantityAfter: number;
  unit: string;
  actionType: string;
  transactionType: string;
  reason: string;
  referenceType: string;
  referenceId: string;
  relatedPreparationId: string;
  notes: string;
};

export const INVENTORY_LEDGER_SORT_ALLOWLIST = [
  "time",
  "sourceCode",
  "user",
  "module",
  "transactionType",
] as const;

export type InventoryLedgerSortKey = (typeof INVENTORY_LEDGER_SORT_ALLOWLIST)[number];

const INVENTORY_LEDGER_SORT_MAP: SortFieldMap = {
  time: "time",
  sourceCode: "sourceCode",
  user: "user",
  module: "module",
  transactionType: "transactionType",
};

const DEFAULT_INVENTORY_LEDGER_ORDER = [{ time: "desc" as const }];

export type InventoryLedgerListParams = ListQueryParams & {
  actionFilter: string;
  txTypeFilter: string;
  preparationFilter: string;
};

function firstParam(searchParams: SearchParamsInput, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseInventoryLedgerParams(searchParams: SearchParamsInput): InventoryLedgerListParams {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "time", sortOrder: "desc", page: 1, limit: 50 },
    INVENTORY_LEDGER_SORT_ALLOWLIST,
  );

  const preparationFilter =
    firstParam(searchParams, "preparationFilter")?.trim() ||
    firstParam(searchParams, "preparationId")?.trim() ||
    "";

  return {
    ...base,
    actionFilter: firstParam(searchParams, "actionFilter")?.trim() || "All",
    txTypeFilter: firstParam(searchParams, "txTypeFilter")?.trim() || "All",
    preparationFilter,
  };
}

function buildInventoryLedgerWhere(params: InventoryLedgerListParams): Prisma.InventoryTransactionWhereInput {
  const and: Prisma.InventoryTransactionWhereInput[] = [];

  if (params.q) {
    const q = params.q;
    and.push({
      OR: [
        { sourceCode: { contains: q } },
        { user: { contains: q } },
        { module: { contains: q } },
        { notes: { contains: q } },
        { reason: { contains: q } },
      ],
    });
  }

  if (params.actionFilter !== "All") {
    and.push({ actionType: params.actionFilter as InventoryActionType });
  }

  if (params.txTypeFilter !== "All") {
    and.push({ transactionType: params.txTypeFilter as InventoryTransactionType });
  }

  const prep = params.preparationFilter.trim();
  if (prep) {
    and.push({
      OR: [{ relatedPreparationId: prep }, { referenceId: prep }],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

async function buildInventoryLedgerWhereWithLotSearch(
  params: InventoryLedgerListParams,
): Promise<Prisma.InventoryTransactionWhereInput> {
  const base = buildInventoryLedgerWhere(params);
  if (!params.q) return base;

  const lots = await db.stockLot.findMany({
    where: { lot: { contains: params.q } },
    select: { id: true },
  });
  if (lots.length === 0) return base;

  const lotClause: Prisma.InventoryTransactionWhereInput = {
    stockLotId: { in: lots.map((lot) => lot.id) },
  };

  if (!base.AND) {
    return { OR: [base, lotClause] };
  }

  const and = [...(Array.isArray(base.AND) ? base.AND : [base.AND])];
  const qIndex = and.findIndex((clause) => "OR" in clause && Array.isArray(clause.OR));
  if (qIndex >= 0) {
    const qClause = and[qIndex] as { OR: Prisma.InventoryTransactionWhereInput[] };
    and[qIndex] = { OR: [...qClause.OR, lotClause] };
  } else {
    and.push(lotClause);
  }

  return { AND: and };
}

async function mapInventoryLedgerRows(
  rows: Awaited<ReturnType<typeof db.inventoryTransaction.findMany>>,
): Promise<InventoryLedgerRow[]> {
  const lotIds = [...new Set(rows.map((r) => r.stockLotId).filter(Boolean))] as string[];
  const lots =
    lotIds.length > 0
      ? await db.stockLot.findMany({
          where: { id: { in: lotIds } },
          select: { id: true, lot: true },
        })
      : [];
  const lotMap = new Map(lots.map((l) => [l.id, l.lot]));

  return rows.map((row) => ({
    id: row.id,
    time: toDateString(row.time) + " " + row.time.toISOString().slice(11, 19),
    user: row.user,
    module: row.module,
    sourceType: row.sourceType,
    sourceCode: row.sourceCode,
    stockLotId: row.stockLotId,
    lotNumber: row.stockLotId ? lotMap.get(row.stockLotId) ?? "" : "",
    quantityBefore: row.quantityBefore,
    quantityUsed: row.quantityUsed,
    quantityAfter: row.quantityAfter,
    unit: row.unit,
    actionType: row.actionType,
    transactionType: row.transactionType ?? "",
    reason: row.reason,
    referenceType: row.referenceType,
    referenceId: row.referenceId,
    relatedPreparationId: row.relatedPreparationId ?? "",
    notes: row.notes,
  }));
}

export async function listInventoryLedger(
  params: InventoryLedgerListParams,
  paginate = true,
): Promise<PaginatedResult<InventoryLedgerRow>> {
  const where = await buildInventoryLedgerWhereWithLotSearch(params);
  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    INVENTORY_LEDGER_SORT_MAP,
    DEFAULT_INVENTORY_LEDGER_ORDER,
  );

  if (!paginate) {
    const rows = await db.inventoryTransaction.findMany({ where, orderBy });
    const items = await mapInventoryLedgerRows(rows);
    return {
      items,
      total: items.length,
      page: 1,
      limit: items.length || 1,
      totalPages: 1,
    };
  }

  const { skip, take } = getSkipTake(params.page, params.limit);
  const [rows, total] = await Promise.all([
    db.inventoryTransaction.findMany({ where, orderBy, skip, take }),
    db.inventoryTransaction.count({ where }),
  ]);

  return {
    items: await mapInventoryLedgerRows(rows),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(Math.ceil(total / params.limit), 1),
  };
}

export async function getInventoryLedgerRows(limit = 200): Promise<InventoryLedgerRow[]> {
  const { items } = await listInventoryLedger(
    {
      q: "",
      sortBy: "time",
      sortOrder: "desc",
      page: 1,
      limit,
      sortActive: false,
      actionFilter: "All",
      txTypeFilter: "All",
      preparationFilter: "",
    },
    true,
  );
  return items;
}
