import type { Prisma, SampleConditionOnReceipt } from "@prisma/client";
import { db } from "@/lib/db";
import { generateSampleCode } from "@/lib/sample-code";
import { nextStatusAfterReceive } from "@/lib/services/samples/sample-workflow";
import { appendSampleAuditLog } from "@/lib/services/samples/sample-audit";
import { appendSampleCustodyEvent } from "@/lib/services/samples/sample-custody";
import { appendWorkflowEvent } from "@/lib/services/workflow-orchestrator";
import type { SampleReceiveInput } from "@/lib/validators/samples";

function buildBarcodePayload(sampleId: string, sampleCode: string): string {
  return `/samples/${sampleId}|${sampleCode}`;
}

function parseDateTime(value: string): Date {
  if (value.includes("T")) return new Date(value);
  return new Date(`${value}T00:00:00.000Z`);
}

function parseOptionalDate(value?: string): Date | null {
  if (!value?.trim()) return null;
  return parseDateTime(value);
}

async function resolveMethodVersion(methodId?: string, methodVersionId?: string) {
  if (!methodId) return { methodId: null, methodVersionId: null, needsMethodAssignment: true };
  if (methodVersionId) {
    return { methodId, methodVersionId, needsMethodAssignment: false };
  }
  const method = await db.analyticalMethod.findUnique({
    where: { id: methodId },
    select: { currentVersionId: true },
  });
  return {
    methodId,
    methodVersionId: method?.currentVersionId ?? null,
    needsMethodAssignment: !method?.currentVersionId,
  };
}

export async function createSample(input: SampleReceiveInput, createdBy: string) {
  const receivedAt = parseDateTime(input.receivedAt);
  const methodInfo = await resolveMethodVersion(input.primaryMethodId, input.primaryMethodVersionId);
  const status = nextStatusAfterReceive(input.conditionOnReceipt);

  return db.$transaction(async (tx) => {
    const sampleCode = await generateSampleCode(tx, receivedAt);
    const sample = await tx.sample.create({
      data: {
        sampleCode,
        customerSampleCode: input.customerSampleCode?.trim() ?? "",
        requestId: input.requestId || null,
        sampleName: input.sampleName.trim(),
        sampleType: input.sampleType.trim(),
        receivedAt,
        deliveredBy: input.deliveredBy?.trim() ?? "",
        receivedBy: input.receivedBy.trim(),
        conditionOnReceipt: input.conditionOnReceipt as SampleConditionOnReceipt,
        conditionNote: input.conditionNote?.trim() ?? "",
        quantity: input.quantity ?? null,
        unit: input.unit.trim(),
        containerType: input.containerType?.trim() ?? "",
        preservationCondition: input.preservationCondition?.trim() ?? "",
        storageLocation: input.storageLocation?.trim() ?? "",
        retentionUntil: parseOptionalDate(input.retentionUntil),
        status,
        dueDate: parseOptionalDate(input.dueDate),
        note: input.note?.trim() ?? "",
        chemicalReferenceId: input.chemicalReferenceId || null,
        primaryMethodId: methodInfo.methodId,
        primaryMethodVersionId: methodInfo.methodVersionId,
        needsMethodAssignment: methodInfo.needsMethodAssignment,
        createdBy,
      },
    });

    const barcodePayload = buildBarcodePayload(sample.id, sample.sampleCode);
    const sampleWithBarcode = await tx.sample.update({
      where: { id: sample.id },
      data: { barcodePayload },
    });

    const parameters = (input.parameterNames ?? []).filter((p) => p.trim());
    if (parameters.length > 0) {
      await tx.sampleTest.createMany({
        data: parameters.map((parameterName) => ({
          sampleId: sample.id,
          parameterName: parameterName.trim(),
          methodId: methodInfo.methodId,
          methodVersionId: methodInfo.methodVersionId,
        })),
      });
    } else if (methodInfo.methodId) {
      await tx.sampleTest.create({
        data: {
          sampleId: sample.id,
          parameterName: "Phân tích chính",
          methodId: methodInfo.methodId,
          methodVersionId: methodInfo.methodVersionId,
        },
      });
    }

    await appendSampleCustodyEvent(tx, {
      sampleId: sample.id,
      action: "Received",
      fromPerson: input.deliveredBy?.trim() ?? "",
      toPerson: input.receivedBy.trim(),
      location: input.storageLocation?.trim() ?? "",
      note: input.conditionNote?.trim() ?? "",
      performedBy: createdBy,
    });

    await appendSampleAuditLog(tx, {
      entityType: "sample",
      entityId: sample.id,
      action: "Created",
      before: null,
      after: sampleWithBarcode,
      changedBy: createdBy,
    });

    await appendWorkflowEvent(tx, {
      sampleId: sample.id,
      entityType: "sample",
      entityId: sample.id,
      fromStatus: "",
      toStatus: status,
      action: "Received",
      performedBy: createdBy,
      after: sampleWithBarcode,
      reason: input.conditionNote?.trim() ?? "",
    });

    if (input.requestId) {
      const request = await tx.sampleRequest.findUnique({ where: { id: input.requestId } });
      await tx.sampleRequest.update({
        where: { id: input.requestId },
        data: { status: "Processing" },
      });
      if (request) {
        await appendWorkflowEvent(tx, {
          sampleId: sample.id,
          entityType: "sample_request",
          entityId: input.requestId,
          fromStatus: request.status,
          toStatus: "Processing",
          action: "LinkedToSample",
          performedBy: createdBy,
        });
      }
    }

    return sampleWithBarcode;
  });
}

export async function updateSample(
  id: string,
  input: Partial<SampleReceiveInput>,
  updatedBy: string,
) {
  const existing = await db.sample.findUnique({ where: { id } });
  if (!existing) throw new Error("Không tìm thấy mẫu");
  if (["ResultIssued", "Stored", "Disposed"].includes(existing.status)) {
    throw new Error("Không thể sửa mẫu đã phát hành kết quả hoặc đã lưu trữ");
  }

  const methodInfo = input.primaryMethodId
    ? await resolveMethodVersion(input.primaryMethodId, input.primaryMethodVersionId)
    : null;

  const data: Prisma.SampleUpdateInput = {
    customerSampleCode: input.customerSampleCode?.trim(),
    sampleName: input.sampleName?.trim(),
    sampleType: input.sampleType?.trim(),
    receivedAt: input.receivedAt ? parseDateTime(input.receivedAt) : undefined,
    deliveredBy: input.deliveredBy?.trim(),
    receivedBy: input.receivedBy?.trim(),
    conditionOnReceipt: input.conditionOnReceipt as SampleConditionOnReceipt | undefined,
    conditionNote: input.conditionNote?.trim(),
    quantity: input.quantity ?? undefined,
    unit: input.unit?.trim(),
    containerType: input.containerType?.trim(),
    preservationCondition: input.preservationCondition?.trim(),
    storageLocation: input.storageLocation?.trim(),
    retentionUntil: input.retentionUntil !== undefined ? parseOptionalDate(input.retentionUntil) : undefined,
    dueDate: input.dueDate !== undefined ? parseOptionalDate(input.dueDate) : undefined,
    note: input.note?.trim(),
  };

  if (input.chemicalReferenceId !== undefined) {
    data.chemicalReference = input.chemicalReferenceId
      ? { connect: { id: input.chemicalReferenceId } }
      : { disconnect: true };
  }

  if (methodInfo) {
    data.primaryMethod = methodInfo.methodId
      ? { connect: { id: methodInfo.methodId } }
      : { disconnect: true };
    data.primaryMethodVersion = methodInfo.methodVersionId
      ? { connect: { id: methodInfo.methodVersionId } }
      : { disconnect: true };
    data.needsMethodAssignment = methodInfo.needsMethodAssignment;
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.sample.update({ where: { id }, data });
    await appendSampleAuditLog(tx, {
      entityType: "sample",
      entityId: id,
      action: "Updated",
      before: existing,
      after: updated,
      changedBy: updatedBy,
    });
    await appendWorkflowEvent(tx, {
      sampleId: id,
      entityType: "sample",
      entityId: id,
      fromStatus: existing.status,
      toStatus: updated.status,
      action: "Updated",
      performedBy: updatedBy,
      before: existing,
      after: updated,
    });
    return updated;
  });
}

export async function updateSampleCode(id: string, newCode: string, changedBy: string) {
  const existing = await db.sample.findUnique({ where: { id } });
  if (!existing) throw new Error("Không tìm thấy mẫu");
  const trimmed = newCode.trim();
  if (!trimmed) throw new Error("Mã mẫu không được để trống");

  return db.$transaction(async (tx) => {
    const updated = await tx.sample.update({
      where: { id },
      data: { sampleCode: trimmed },
    });
    await appendSampleAuditLog(tx, {
      entityType: "sample",
      entityId: id,
      action: "CodeChanged",
      before: { sampleCode: existing.sampleCode },
      after: { sampleCode: trimmed },
      changedBy,
    });
    return updated;
  });
}

export async function receiveSampleLine(
  lineId: string,
  input: {
    receivedBy: string;
    receivedAt: string;
    conditionOnReceipt: SampleConditionOnReceipt;
    conditionNote?: string;
    deliveredBy?: string;
    containerType?: string;
    preservationCondition?: string;
    storageLocation?: string;
  },
  createdBy: string,
) {
  const line = await db.requestSampleLine.findUnique({
    where: { id: lineId },
    include: {
      tests: {
        include: {
          testMethod: true,
          method: { select: { currentVersionId: true } },
        },
      },
      request: true,
    },
  });
  if (!line) throw new Error("Không tìm thấy dòng mẫu");
  if (line.status !== "draft") throw new Error("Dòng mẫu đã được tiếp nhận");
  if (line.tests.length === 0) throw new Error("Dòng mẫu chưa có chỉ tiêu");

  const receivedCount = await db.requestSampleLine.count({
    where: { requestId: line.requestId, status: "received" },
  });
  if (receivedCount >= line.request.sampleCount) {
    throw new Error(`Đã tiếp nhận đủ ${line.request.sampleCount} mẫu theo phiếu`);
  }

  const status = nextStatusAfterReceive(input.conditionOnReceipt);
  const receivedAt = parseDateTime(input.receivedAt);

  return db.$transaction(async (tx) => {
    const sampleCode = await generateSampleCode(tx, receivedAt);
    const sample = await tx.sample.create({
      data: {
        sampleCode,
        requestId: line.requestId,
        matrixId: line.matrixId,
        sampleName: line.sampleName,
        sampleType: line.sampleType || line.request.sampleType,
        receivedAt,
        deliveredBy: input.deliveredBy?.trim() ?? "",
        receivedBy: input.receivedBy.trim(),
        conditionOnReceipt: input.conditionOnReceipt,
        conditionNote: input.conditionNote?.trim() ?? line.conditionNote,
        quantity: line.quantity,
        unit: line.unit,
        containerType: input.containerType?.trim() ?? "",
        preservationCondition: input.preservationCondition?.trim() ?? "",
        storageLocation: input.storageLocation?.trim() ?? "",
        status,
        dueDate: line.request.dueDate,
        createdBy,
      },
    });

    const barcodePayload = buildBarcodePayload(sample.id, sample.sampleCode);
    await tx.sample.update({ where: { id: sample.id }, data: { barcodePayload } });

    for (const lt of line.tests) {
      await tx.sampleTest.create({
        data: {
          sampleId: sample.id,
          testMethodId: lt.testMethodId,
          parameterName: lt.testMethod.name,
          methodId: lt.methodId ?? lt.testMethod.defaultMethodId,
          methodVersionId: lt.methodVersionId ?? lt.method?.currentVersionId,
          status: "Pending",
        },
      });
    }

    await tx.requestSampleLine.update({
      where: { id: lineId },
      data: { status: "received", sampleId: sample.id },
    });

    await appendSampleCustodyEvent(tx, {
      sampleId: sample.id,
      action: "Received",
      fromPerson: input.deliveredBy?.trim() ?? "",
      toPerson: input.receivedBy.trim(),
      location: input.storageLocation?.trim() ?? "",
      performedBy: createdBy,
    });

    await appendWorkflowEvent(tx, {
      sampleId: sample.id,
      entityType: "request_sample_line",
      entityId: lineId,
      fromStatus: "draft",
      toStatus: "received",
      action: "Received",
      performedBy: createdBy,
    });

    const newReceivedCount = receivedCount + 1;
    const requestStatus =
      newReceivedCount >= line.request.sampleCount ? "Processing" : "Received";
    await tx.sampleRequest.update({
      where: { id: line.requestId },
      data: { status: requestStatus },
    });

    return sample;
  });
}

export async function batchReceiveSampleLines(
  lineIds: string[],
  input: {
    receivedBy: string;
    receivedAt: string;
    conditionOnReceipt: SampleConditionOnReceipt;
    conditionNote?: string;
  },
  createdBy: string,
) {
  const results: { lineId: string; sampleId?: string; error?: string }[] = [];
  for (const lineId of lineIds) {
    try {
      const sample = await receiveSampleLine(lineId, input, createdBy);
      results.push({ lineId, sampleId: sample.id });
    } catch (e) {
      results.push({ lineId, error: e instanceof Error ? e.message : "Lỗi tiếp nhận" });
    }
  }
  return results;
}
