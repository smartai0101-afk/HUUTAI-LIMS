import type { Prisma } from "@prisma/client";
import { equipmentStatusFromLabel } from "@/lib/equipment-fields";
import { db } from "@/lib/db";
import {
  buildPrismaOrderBy,
  getSkipTake,
  parseListQueryParams,
  type ListQueryParams,
  type PaginatedResult,
  type SearchParamsInput,
} from "@/lib/list-query";
import { mapEquipment } from "@/lib/mappers/equipment";
import type { EquipmentView } from "@/types";

export const EQUIPMENT_SORT_ALLOWLIST = [
  "code",
  "name",
  "model",
  "serialNumber",
  "manufacturer",
  "department",
  "manager",
  "status",
  "lastCalibrationDate",
  "calibrationExpiryDate",
  "location",
] as const;

export type EquipmentSortKey = (typeof EQUIPMENT_SORT_ALLOWLIST)[number];

const EQUIPMENT_SORT_MAP: Record<EquipmentSortKey, string> = {
  code: "code",
  name: "name",
  model: "model",
  serialNumber: "serialNumber",
  manufacturer: "manufacturer",
  department: "department",
  manager: "manager",
  status: "status",
  lastCalibrationDate: "lastCalibrationDate",
  calibrationExpiryDate: "calibrationExpiryDate",
  location: "location",
};

const DEFAULT_EQUIPMENT_ORDER = [{ code: "asc" as const }];

export type EquipmentListParams = ListQueryParams & {
  department: string;
  status: string;
  manager: string;
  calExpiry: "All" | "Overdue" | "Soon" | "Valid";
};

export function parseEquipmentListParams(searchParams: SearchParamsInput): EquipmentListParams {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "code", sortOrder: "asc", page: 1, limit: 50 },
    EQUIPMENT_SORT_ALLOWLIST,
  );
  const first = (key: string) => {
    const v = searchParams[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const calExpiry = first("calExpiry");
  return {
    ...base,
    department: first("department")?.trim() || "All",
    status: first("status")?.trim() || "All",
    manager: first("manager")?.trim() || "All",
    calExpiry:
      calExpiry === "Overdue" || calExpiry === "Soon" || calExpiry === "Valid" ? calExpiry : "All",
  };
}

function buildEquipmentWhere(params: EquipmentListParams): Prisma.EquipmentWhereInput {
  const where: Prisma.EquipmentWhereInput = {};
  const and: Prisma.EquipmentWhereInput[] = [];

  if (params.q) {
    const q = params.q;
    and.push({
      OR: [
        { code: { contains: q } },
        { name: { contains: q } },
        { model: { contains: q } },
        { serialNumber: { contains: q } },
        { manufacturer: { contains: q } },
        { specifications: { contains: q } },
        { department: { contains: q } },
        { location: { contains: q } },
        { manager: { contains: q } },
      ],
    });
  }

  if (params.department !== "All") {
    and.push({ department: params.department });
  }

  if (params.status !== "All") {
    and.push({ status: equipmentStatusFromLabel(params.status) });
  }

  if (params.manager !== "All") {
    and.push({ manager: params.manager });
  }

  if (params.calExpiry !== "All") {
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 30);
    if (params.calExpiry === "Overdue") {
      and.push({
        OR: [{ calibrationExpiryDate: null }, { calibrationExpiryDate: { lt: now } }],
      });
    } else if (params.calExpiry === "Soon") {
      and.push({
        calibrationExpiryDate: { gte: now, lte: soon },
      });
    } else if (params.calExpiry === "Valid") {
      and.push({ calibrationExpiryDate: { gt: soon } });
    }
  }

  if (and.length > 0) where.AND = and;
  return where;
}

export async function listEquipment(
  params: EquipmentListParams,
  paginate = false,
): Promise<PaginatedResult<EquipmentView>> {
  const where = buildEquipmentWhere(params);
  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    EQUIPMENT_SORT_MAP,
    DEFAULT_EQUIPMENT_ORDER,
  );

  if (!paginate) {
    const rows = await db.equipment.findMany({ where, orderBy });
    const items = rows.map(mapEquipment);
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
    db.equipment.findMany({ where, orderBy, skip, take }),
    db.equipment.count({ where }),
  ]);

  return {
    items: rows.map(mapEquipment),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(Math.ceil(total / params.limit), 1),
  };
}

export async function listEquipmentForExport(params: EquipmentListParams): Promise<EquipmentView[]> {
  const where = buildEquipmentWhere(params);
  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    EQUIPMENT_SORT_MAP,
    DEFAULT_EQUIPMENT_ORDER,
  );
  const rows = await db.equipment.findMany({ where, orderBy });
  return rows.map(mapEquipment);
}

export async function getEquipmentManagers(): Promise<string[]> {
  const rows = await db.equipment.findMany({
    select: { manager: true },
    distinct: ["manager"],
    orderBy: { manager: "asc" },
  });
  return rows.map((r) => r.manager.trim()).filter(Boolean);
}
