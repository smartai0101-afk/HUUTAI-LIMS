import type { Prisma, SampleStatus } from "@prisma/client";
import { db } from "@/lib/db";
import {
  buildPrismaOrderBy,
  getSkipTake,
  parseListQueryParams,
  type PaginatedResult,
  type SearchParamsInput,
  type SortFieldMap,
} from "@/lib/list-query";
import { mapSampleListItem } from "@/lib/mappers/samples";
import { isSampleOverdue } from "@/lib/services/samples/sample-workflow";
import type { SampleListItem } from "@/types/samples";

export const SAMPLE_SORT_ALLOWLIST = [
  "sampleCode",
  "sampleName",
  "sampleType",
  "receivedAt",
  "status",
  "dueDate",
  "assignedTo",
] as const;

const SAMPLE_SORT_MAP: SortFieldMap = {
  sampleCode: "sampleCode",
  sampleName: "sampleName",
  sampleType: "sampleType",
  receivedAt: "receivedAt",
  status: "status",
  dueDate: "dueDate",
  assignedTo: "assignedTo",
};

export type SampleListParams = ReturnType<typeof parseSampleListParams>;

export function parseSampleListParams(searchParams: SearchParamsInput) {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "receivedAt", sortOrder: "desc", page: 1, limit: 50 },
    SAMPLE_SORT_ALLOWLIST,
  );
  const status = Array.isArray(searchParams.status)
    ? searchParams.status[0]
    : searchParams.status;
  const sampleType = Array.isArray(searchParams.sampleType)
    ? searchParams.sampleType[0]
    : searchParams.sampleType;
  const methodId = Array.isArray(searchParams.methodId)
    ? searchParams.methodId[0]
    : searchParams.methodId;
  const assignedTo = Array.isArray(searchParams.assignedTo)
    ? searchParams.assignedTo[0]
    : searchParams.assignedTo;
  const overdue = Array.isArray(searchParams.overdue)
    ? searchParams.overdue[0]
    : searchParams.overdue;
  const receivedFrom = Array.isArray(searchParams.receivedFrom)
    ? searchParams.receivedFrom[0]
    : searchParams.receivedFrom;
  const receivedTo = Array.isArray(searchParams.receivedTo)
    ? searchParams.receivedTo[0]
    : searchParams.receivedTo;

  return {
    ...base,
    status: status && status !== "All" ? (status as SampleStatus) : "All",
    sampleType: sampleType && sampleType !== "All" ? sampleType : "All",
    methodId: methodId && methodId !== "All" ? methodId : "All",
    assignedTo: assignedTo?.trim() ?? "",
    overdue: overdue === "true",
    receivedFrom: receivedFrom ?? "",
    receivedTo: receivedTo ?? "",
  };
}

function buildSampleWhere(params: SampleListParams): Prisma.SampleWhereInput {
  const where: Prisma.SampleWhereInput = {};

  if (params.q) {
    where.OR = [
      { sampleCode: { contains: params.q } },
      { sampleName: { contains: params.q } },
      { customerSampleCode: { contains: params.q } },
      { receivedBy: { contains: params.q } },
      { assignedTo: { contains: params.q } },
    ];
  }

  if (params.status !== "All") where.status = params.status as SampleStatus;
  if (params.sampleType !== "All") where.sampleType = params.sampleType;
  if (params.methodId !== "All") where.primaryMethodId = params.methodId;
  if (params.assignedTo) where.assignedTo = { contains: params.assignedTo };

  if (params.receivedFrom || params.receivedTo) {
    where.receivedAt = {};
    if (params.receivedFrom) {
      where.receivedAt.gte = new Date(`${params.receivedFrom}T00:00:00.000Z`);
    }
    if (params.receivedTo) {
      where.receivedAt.lte = new Date(`${params.receivedTo}T23:59:59.999Z`);
    }
  }

  return where;
}

const sampleInclude = {
  primaryMethod: { select: { methodCode: true, methodName: true } },
  primaryMethodVersion: { select: { version: true } },
} as const;

export async function listSamples(
  params: SampleListParams,
): Promise<PaginatedResult<SampleListItem>> {
  const where = buildSampleWhere(params);
  const { skip, take } = getSkipTake(params.page, params.limit);
  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    SAMPLE_SORT_MAP,
    [{ receivedAt: "desc" as const }],
  );

  let rows = await db.sample.findMany({
    where,
    include: sampleInclude,
    orderBy,
    skip: params.overdue ? 0 : skip,
    take: params.overdue ? 500 : take,
  });

  if (params.overdue) {
    rows = rows.filter((r) => isSampleOverdue(r.dueDate, r.status));
    const total = rows.length;
    rows = rows.slice(skip, skip + take);
    return {
      items: rows.map(mapSampleListItem),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.max(1, Math.ceil(total / params.limit)),
    };
  }

  const total = await db.sample.count({ where });
  return {
    items: rows.map(mapSampleListItem),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}

export async function getSampleTypeOptions(): Promise<string[]> {
  const rows = await db.sample.findMany({
    distinct: ["sampleType"],
    select: { sampleType: true },
    orderBy: { sampleType: "asc" },
  });
  return rows.map((r) => r.sampleType).filter(Boolean);
}

export async function getSampleAssigneeOptions(): Promise<string[]> {
  const rows = await db.sample.findMany({
    distinct: ["assignedTo"],
    select: { assignedTo: true },
    where: { assignedTo: { not: "" } },
    orderBy: { assignedTo: "asc" },
  });
  return rows.map((r) => r.assignedTo);
}

export async function listSamplesForAssign(): Promise<SampleListItem[]> {
  const rows = await db.sample.findMany({
    where: {
      status: { in: ["Received", "WaitingAssignment", "Assigned"] },
    },
    include: sampleInclude,
    orderBy: { receivedAt: "desc" },
    take: 200,
  });
  return rows.map(mapSampleListItem);
}

export async function listSamplesForTracking(): Promise<SampleListItem[]> {
  const rows = await db.sample.findMany({
    where: {
      status: {
        notIn: ["Stored", "Disposed", "Rejected"],
      },
    },
    include: sampleInclude,
    orderBy: { receivedAt: "desc" },
    take: 500,
  });
  return rows.map(mapSampleListItem);
}

export async function listSamplesForStorage(): Promise<SampleListItem[]> {
  const rows = await db.sample.findMany({
    where: {
      status: { in: ["ResultIssued", "Stored"] },
    },
    include: sampleInclude,
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return rows.map(mapSampleListItem);
}
