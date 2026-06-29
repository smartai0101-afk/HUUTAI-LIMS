import type { Prisma, SampleConditionOnReceipt } from "@prisma/client";
import { db } from "@/lib/db";
import { generateSampleCode } from "@/lib/sample-code";
import { nextStatusAfterReceive } from "@/lib/services/samples/sample-workflow";
import { appendSampleAuditLog } from "@/lib/services/samples/sample-audit";
import { appendSampleCustodyEvent } from "@/lib/services/samples/sample-custody";
import type { SampleReceiveInput } from "@/lib/validators/samples";

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
      after: sample,
      changedBy: createdBy,
    });

    if (input.requestId) {
      await tx.sampleRequest.update({
        where: { id: input.requestId },
        data: { status: "Received" },
      });
    }

    return sample;
  });
}

export async function updateSample(
  id: string,
  input: Partial<SampleReceiveInput>,
  updatedBy: string,
) {
  const existing = await db.sample.findUnique({ where: { id } });
  if (!existing) throw new Error("Không tìm thấy mẫu");

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
