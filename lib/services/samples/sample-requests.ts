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
import { appendWorkflowEvent } from "@/lib/services/workflow-orchestrator";
import { notifySampleRequestSubmitted } from "@/lib/services/lims-notification-hooks";
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
        priority: (input.priority as import("@prisma/client").RequestPriority) ?? "normal",
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
  if (existing.status !== "Draft") {
    throw new Error("Không thể sửa phiếu đã gửi — chỉ phiếu nháp mới được chỉnh sửa");
  }

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
        priority: (input.priority as import("@prisma/client").RequestPriority) ?? "normal",
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

  const { validateRequestForSubmit } = await import("@/lib/services/samples/request-sample-lines");
  const validationError = await validateRequestForSubmit(id);
  if (validationError) throw new Error(validationError);

  return db.$transaction(async (tx) => {
    const updated = await tx.sampleRequest.update({
      where: { id },
      data: {
        status: "Submitted",
        submittedAt: new Date(),
        submittedBy: changedBy,
      },
    });
    await appendSampleAuditLog(tx, {
      entityType: "sample_request",
      entityId: id,
      action: "Submitted",
      before: { status: existing.status },
      after: { status: "Submitted" },
      changedBy,
    });
    await appendWorkflowEvent(tx, {
      entityType: "sample_request",
      entityId: id,
      fromStatus: existing.status,
      toStatus: "Submitted",
      action: "Submitted",
      performedBy: changedBy,
    });
    return updated;
  }).then(async (updated) => {
    await notifySampleRequestSubmitted(id, existing.requestCode, changedBy);
    return updated;
  });
}

export async function reviewSampleRequest(id: string, reviewedBy: string) {
  const existing = await db.sampleRequest.findUnique({ where: { id } });
  if (!existing) throw new Error("Không tìm thấy phiếu yêu cầu");
  if (existing.status !== "Submitted") {
    throw new Error("Chỉ phiếu đã gửi mới được kiểm tra");
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.sampleRequest.update({
      where: { id },
      data: {
        status: "Received",
        reviewedAt: new Date(),
        reviewedBy,
      },
    });
    await appendSampleAuditLog(tx, {
      entityType: "sample_request",
      entityId: id,
      action: "Reviewed",
      before: { status: existing.status, reviewedAt: existing.reviewedAt },
      after: { status: "Received", reviewedAt: updated.reviewedAt, reviewedBy },
      changedBy: reviewedBy,
    });
    await appendWorkflowEvent(tx, {
      entityType: "sample_request",
      entityId: id,
      fromStatus: existing.status,
      toStatus: "Received",
      action: "Reviewed",
      performedBy: reviewedBy,
    });
    return updated;
  });
}

export async function cancelSampleRequest(id: string, reason: string, cancelledBy: string) {
  const existing = await db.sampleRequest.findUnique({ where: { id } });
  if (!existing) throw new Error("Không tìm thấy phiếu yêu cầu");
  if (existing.status === "Cancelled" || existing.status === "Completed") {
    throw new Error("Không thể hủy phiếu ở trạng thái này");
  }
  if (!reason.trim()) throw new Error("Cần lý do hủy phiếu");

  return db.$transaction(async (tx) => {
    const updated = await tx.sampleRequest.update({
      where: { id },
      data: {
        status: "Cancelled",
        cancelledAt: new Date(),
        cancelReason: reason.trim(),
      },
    });
    await appendSampleAuditLog(tx, {
      entityType: "sample_request",
      entityId: id,
      action: "Cancelled",
      before: { status: existing.status },
      after: { status: "Cancelled", cancelReason: reason.trim() },
      changedBy: cancelledBy,
    });
    await appendWorkflowEvent(tx, {
      entityType: "sample_request",
      entityId: id,
      fromStatus: existing.status,
      toStatus: "Cancelled",
      action: "Cancelled",
      performedBy: cancelledBy,
      reason: reason.trim(),
    });
    return updated;
  });
}

export async function completeSampleRequest(id: string, completedBy: string) {
  const existing = await db.sampleRequest.findUnique({
    where: { id },
    include: { samples: true },
  });
  if (!existing) throw new Error("Không tìm thấy phiếu yêu cầu");

  const allSamplesDone = existing.samples.every((s) =>
    ["Completed", "ResultIssued", "Stored", "Disposed"].includes(s.status),
  );
  if (existing.samples.length === 0 || !allSamplesDone) {
    throw new Error("Tất cả mẫu liên quan phải hoàn thành phân tích trước khi đóng phiếu");
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.sampleRequest.update({
      where: { id },
      data: { status: "Completed" },
    });
    await appendWorkflowEvent(tx, {
      entityType: "sample_request",
      entityId: id,
      fromStatus: existing.status,
      toStatus: "Completed",
      action: "Completed",
      performedBy: completedBy,
    });
    return updated;
  });
}

export async function listSubmittedRequestsForReview() {
  const rows = await db.sampleRequest.findMany({
    where: { status: "Submitted" },
    include: requestInclude,
    orderBy: { requestDate: "desc" },
    take: 100,
  });
  return rows.map(mapSampleRequestListItem);
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
