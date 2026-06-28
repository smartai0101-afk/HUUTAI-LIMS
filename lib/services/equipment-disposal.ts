import type { EquipmentDisposalStatus, Prisma } from "@prisma/client";
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
import { mapEquipmentDisposal } from "@/lib/mappers/equipment";
import type { EquipmentDisposalView } from "@/types";

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

export const DISPOSAL_SORT_ALLOWLIST = [
  "equipmentCode",
  "equipmentName",
  "disposalDate",
  "residualValue",
  "status",
  "approver",
] as const;

export type DisposalListParams = ListQueryParams & {
  status: string;
};

export function parseDisposalListParams(searchParams: SearchParamsInput): DisposalListParams {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "disposalDate", sortOrder: "desc", page: 1, limit: 50 },
    DISPOSAL_SORT_ALLOWLIST,
  );
  return { ...base, status: firstParam(searchParams, "status")?.trim() || "All" };
}

function buildDisposalSortMap(sortOrder: SortOrder): SortFieldMap {
  return {
    ...equipmentSortFields(sortOrder),
    disposalDate: "disposalDate",
    residualValue: "residualValue",
    status: "status",
    approver: "approver",
  };
}

function buildDisposalWhere(params: DisposalListParams): Prisma.EquipmentDisposalWhereInput {
  const and: Prisma.EquipmentDisposalWhereInput[] = [];

  if (params.q) {
    const q = params.q;
    and.push({
      OR: [
        { equipment: { code: { contains: q } } },
        { equipment: { name: { contains: q } } },
        { decision: { contains: q } },
      ],
    });
  }

  if (params.status !== "All") {
    and.push({ status: params.status as EquipmentDisposalStatus });
  }

  return and.length > 0 ? { AND: and } : {};
}

export async function listDisposals(
  params: DisposalListParams,
): Promise<PaginatedResult<EquipmentDisposalView>> {
  const where = buildDisposalWhere(params);
  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    buildDisposalSortMap(params.sortOrder),
    [{ disposalDate: "desc" as const }],
  );
  const rows = await db.equipmentDisposal.findMany({ where, orderBy, include: equipmentInclude });
  const items = rows.map(mapEquipmentDisposal);
  return {
    items,
    total: items.length,
    page: 1,
    limit: items.length || 1,
    totalPages: 1,
  };
}

export async function getDisposals(equipmentId?: string) {
  const result = await listDisposals({
    q: "",
    sortBy: "disposalDate",
    sortOrder: "desc",
    page: 1,
    limit: 50,
    sortActive: false,
    status: "All",
  });
  if (!equipmentId) return result.items;
  return result.items.filter((item) => item.equipmentId === equipmentId);
}
