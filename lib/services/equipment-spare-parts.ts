import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  buildPrismaOrderBy,
  parseListQueryParams,
  type ListQueryParams,
  type PaginatedResult,
  type SearchParamsInput,
  type SortFieldMap,
} from "@/lib/list-query";
import { mapSparePart } from "@/lib/mappers/equipment";
import type { SparePartView } from "@/types";

const linkInclude = {
  equipmentLinks: {
    include: { equipment: { select: { id: true, code: true, name: true } } },
  },
};

function firstParam(searchParams: SearchParamsInput, key: string): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export const SPARE_PART_SORT_ALLOWLIST = [
  "code",
  "name",
  "manufacturer",
  "productCode",
  "lotNumber",
  "stockQty",
  "minQty",
  "unit",
] as const;

export type SparePartListParams = ListQueryParams & {
  lowOnly: boolean;
};

export function parseSparePartListParams(searchParams: SearchParamsInput): SparePartListParams {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "code", sortOrder: "asc", page: 1, limit: 50 },
    SPARE_PART_SORT_ALLOWLIST,
  );
  const lowOnly = firstParam(searchParams, "lowOnly") === "1";
  return { ...base, lowOnly };
}

const SPARE_PART_SORT_MAP: SortFieldMap = {
  code: "code",
  name: "name",
  manufacturer: "manufacturer",
  productCode: "productCode",
  lotNumber: "lotNumber",
  stockQty: "stockQty",
  minQty: "minQty",
  unit: "unit",
};

function buildSparePartWhere(params: SparePartListParams): Prisma.SparePartWhereInput {
  if (!params.q) return {};
  const q = params.q;
  return {
    OR: [
      { code: { contains: q } },
      { name: { contains: q } },
      { manufacturer: { contains: q } },
      { productCode: { contains: q } },
      { lotNumber: { contains: q } },
    ],
  };
}

export async function listSpareParts(
  params: SparePartListParams,
): Promise<PaginatedResult<SparePartView>> {
  const where = buildSparePartWhere(params);
  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    SPARE_PART_SORT_MAP,
    { code: "asc" as const },
  );
  const rows = await db.sparePart.findMany({ where, orderBy, include: linkInclude });
  let items = rows.map(mapSparePart);
  if (params.lowOnly) {
    items = items.filter((item) => item.isLowStock);
  }
  return {
    items,
    total: items.length,
    page: 1,
    limit: items.length || 1,
    totalPages: 1,
  };
}

export async function getSpareParts(equipmentId?: string) {
  if (equipmentId) {
    const links = await db.equipmentSparePartLink.findMany({
      where: { equipmentId },
      select: { sparePartId: true },
    });
    const ids = links.map((l) => l.sparePartId);
    if (ids.length === 0) return [];
    const items = await db.sparePart.findMany({
      where: { id: { in: ids } },
      orderBy: { code: "asc" },
      include: linkInclude,
    });
    return items.map(mapSparePart);
  }

  const result = await listSpareParts({
    q: "",
    sortBy: "code",
    sortOrder: "asc",
    page: 1,
    limit: 50,
    sortActive: false,
    lowOnly: false,
  });
  return result.items;
}
