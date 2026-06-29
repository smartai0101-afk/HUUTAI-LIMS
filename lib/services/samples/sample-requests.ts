import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { generateRequestCode } from "@/lib/sample-code";
import {
  buildPrismaOrderBy,
  getSkipTake,
  parseListQueryParams,
  type PaginatedResult,
  type SearchParamsInput,
  type SortFieldMap,
} from "@/lib/list-query";
import { mapSampleRequestDetail, mapSampleRequestListItem } from "@/lib/mappers/samples";
import { appendSampleAuditLog } from "@/lib/services/samples/sample-audit";
import type { SampleRequestDetailView, SampleRequestListItem } from "@/types/samples";
import type { SampleRequestInput } from "@/lib/validators/samples";

const REQUEST_SORT_ALLOWLIST = ["requestCode", "requestDate", "requesterName", "status", "dueDate"] as const;
const REQUEST_SORT_MAP: SortFieldMap = {
  requestCode: "requestCode",
  requestDate: "requestDate",
  requesterName: "requesterName",
  status: "status",
  dueDate: "dueDate",
};

function parseOptionalDate(value?: string): Date | null {
  if (!value?.trim()) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

const requestInclude = {
  requestedTests: true,
  methods: {
    include: {
      method: { select: { methodCode: true, methodName: true } },
      methodVersion: { select: { version: true } },
    },
  },
} as const;

export function parseSampleRequestListParams(searchParams: SearchParamsInput) {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "requestDate", sortOrder: "desc", page: 1, limit: 50 },
    REQUEST_SORT_ALLOWLIST,
  );
  const status = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;
  return { ...base, status: status && status !== "All" ? status : "All" };
}

export async function listSampleRequests(
  params: ReturnType<typeof parseSampleRequestListParams>,
): Promise<PaginatedResult<SampleRequestListItem>> {
  const where: Prisma.SampleRequestWhereInput = {};
  if (params.q) {
    where.OR = [
      { requestCode: { contains: params.q } },
      { requesterName: { contains: params.q } },
      { customerName: { contains: params.q } },
    ];
  }
  if (params.status !== "All") {
    where.status = params.status as import("@prisma/client").SampleRequestStatus;
  }

  const { skip, take } = getSkipTake(params.page, params.limit);
  const orderBy = buildPrismaOrderBy(
    params.sortBy,
    params.sortOrder,
    REQUEST_SORT_MAP,
    [{ requestDate: "desc" as const }],
  );

  const [rows, total] = await Promise.all([
    db.sampleRequest.findMany({
      where,
      include: requestInclude,
      orderBy,
      skip,
      take,
    }),
    db.sampleRequest.count({ where }),
  ]);

  return {
    items: rows.map(mapSampleRequestListItem),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}

export async function getSampleRequestDetail(id: string): Promise<SampleRequestDetailView | null> {
  const row = await db.sampleRequest.findUnique({
    where: { id },
    include: requestInclude,
  });
  return row ? mapSampleRequestDetail(row) : null;
}

async function syncRequestRelations(
  tx: Prisma.TransactionClient,
  requestId: string,
  input: SampleRequestInput,
) {
  await tx.sampleRequestTest.deleteMany({ where: { requestId } });
  await tx.sampleRequestMethod.deleteMany({ where: { requestId } });

  const tests = (input.requestedTests ?? []).filter((t) => t.trim());
  if (tests.length > 0) {
    await tx.sampleRequestTest.createMany({
      data: tests.map((parameterName) => ({ requestId, parameterName: parameterName.trim() })),
    });
  }

  for (const methodId of input.methodIds ?? []) {
    const method = await tx.analyticalMethod.findUnique({
      where: { id: methodId },
      select: { currentVersionId: true },
    });
    await tx.sampleRequestMethod.create({
      data: {
        requestId,
        methodId,
        methodVersionId: method?.currentVersionId ?? null,
      },
    });
  }
}

export async function createSampleRequest(input: SampleRequestInput, createdBy: string) {
  return db.$transaction(async (tx) => {
    const requestCode = await generateRequestCode(tx);
    const request = await tx.sampleRequest.create({
      data: {
        requestCode,
        requestDate: parseOptionalDate(input.requestDate) ?? new Date(),
        requesterName: input.requesterName.trim(),
        customerName: input.customerName?.trim() ?? "",
        department: input.department?.trim() ?? "",
        purpose: input.purpose?.trim() ?? "",
        sampleType: input.sampleType.trim(),
        sampleCount: input.sampleCount,
        dueDate: parseOptionalDate(input.dueDate),
        note: input.note?.trim() ?? "",
        createdBy,
      },
    });

    await syncRequestRelations(tx, request.id, input);
    await appendSampleAuditLog(tx, {
      entityType: "sample_request",
      entityId: request.id,
      action: "Created",
      before: null,
      after: request,
      changedBy: createdBy,
    });

    return request;
  });
}

export async function updateSampleRequest(
  id: string,
  input: SampleRequestInput,
  updatedBy: string,
) {
  const existing = await db.sampleRequest.findUnique({ where: { id } });
  if (!existing) throw new Error("Không tìm thấy phiếu yêu cầu");

  return db.$transaction(async (tx) => {
    const updated = await tx.sampleRequest.update({
      where: { id },
      data: {
        requestDate: parseOptionalDate(input.requestDate) ?? existing.requestDate,
        requesterName: input.requesterName.trim(),
        customerName: input.customerName?.trim() ?? "",
        department: input.department?.trim() ?? "",
        purpose: input.purpose?.trim() ?? "",
        sampleType: input.sampleType.trim(),
        sampleCount: input.sampleCount,
        dueDate: parseOptionalDate(input.dueDate),
        note: input.note?.trim() ?? "",
      },
    });

    await syncRequestRelations(tx, id, input);
    await appendSampleAuditLog(tx, {
      entityType: "sample_request",
      entityId: id,
      action: "Updated",
      before: existing,
      after: updated,
      changedBy: updatedBy,
    });

    return updated;
  });
}

export async function submitSampleRequest(id: string, changedBy: string) {
  const existing = await db.sampleRequest.findUnique({ where: { id } });
  if (!existing) throw new Error("Không tìm thấy phiếu yêu cầu");
  if (existing.status !== "Draft") throw new Error("Chỉ phiếu nháp mới được gửi");

  return db.$transaction(async (tx) => {
    const updated = await tx.sampleRequest.update({
      where: { id },
      data: { status: "Submitted" },
    });
    await appendSampleAuditLog(tx, {
      entityType: "sample_request",
      entityId: id,
      action: "Submitted",
      before: { status: existing.status },
      after: { status: "Submitted" },
      changedBy,
    });
    return updated;
  });
}

export async function getSampleRequestPrefill(id: string) {
  const request = await db.sampleRequest.findUnique({
    where: { id },
    include: {
      requestedTests: true,
      methods: true,
    },
  });
  if (!request) return null;

  return {
    requestId: request.id,
    requestCode: request.requestCode,
    sampleName: request.purpose.split(/\s*[—–-]\s*/)[0]?.trim() ?? request.purpose,
    sampleType: request.sampleType,
    dueDate: request.dueDate?.toISOString().slice(0, 10) ?? "",
    preservationCondition:
      request.note.match(/^Bảo quản:\s*(.+)$/m)?.[1]?.trim() ??
      request.note.match(/\nBảo quản:\s*(.+)$/m)?.[1]?.trim() ??
      "",
    parameterNames: request.requestedTests.map((t) => t.parameterName),
    primaryMethodId: request.methods[0]?.methodId ?? "",
    primaryMethodVersionId: request.methods[0]?.methodVersionId ?? "",
  };
}
