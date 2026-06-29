import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { appendSampleAuditLog } from "@/lib/services/samples/sample-audit";
import { appendSampleCustodyEvent } from "@/lib/services/samples/sample-custody";
import { mapSampleStorageView } from "@/lib/mappers/samples";
import type { SampleDisposeInput, SampleStorageInput } from "@/lib/validators/samples";

function parseOptionalDate(value?: string): Date | null {
  if (!value?.trim()) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

export async function storeSample(input: SampleStorageInput, changedBy: string) {
  const sample = await db.sample.findUnique({ where: { id: input.sampleId } });
  if (!sample) throw new Error("Không tìm thấy mẫu");
  if (sample.status !== "ResultIssued" && sample.status !== "Stored") {
    throw new Error("Chỉ lưu mẫu sau khi đã phát hành kết quả (ResultIssued)");
  }

  return db.$transaction(async (tx) => {
    const record = await tx.sampleStorageRecord.create({
      data: {
        sampleId: input.sampleId,
        storageLocation: input.storageLocation.trim(),
        preservationCondition: input.preservationCondition?.trim() ?? "",
        retentionUntil: parseOptionalDate(input.retentionUntil),
        storedBy: input.storedBy.trim(),
      },
    });

    const updated = await tx.sample.update({
      where: { id: input.sampleId },
      data: {
        status: "Stored",
        storageLocation: input.storageLocation.trim(),
        preservationCondition: input.preservationCondition?.trim() ?? sample.preservationCondition,
        retentionUntil: parseOptionalDate(input.retentionUntil) ?? sample.retentionUntil,
      },
    });

    await appendSampleCustodyEvent(tx, {
      sampleId: input.sampleId,
      action: "Stored",
      toPerson: input.storedBy.trim(),
      location: input.storageLocation.trim(),
      performedBy: changedBy,
    });

    await appendSampleAuditLog(tx, {
      entityType: "sample",
      entityId: input.sampleId,
      action: "Stored",
      before: { status: sample.status },
      after: { status: "Stored", storageLocation: input.storageLocation },
      changedBy,
    });

    return { sample: updated, record: mapSampleStorageView(record) };
  });
}

export async function disposeSample(input: SampleDisposeInput, changedBy: string) {
  const sample = await db.sample.findUnique({ where: { id: input.sampleId } });
  if (!sample) throw new Error("Không tìm thấy mẫu");
  if (sample.status !== "ResultIssued" && sample.status !== "Stored") {
    throw new Error("Chỉ hủy mẫu sau khi đã phát hành kết quả hoặc đã lưu");
  }

  return db.$transaction(async (tx) => {
    const latestStorage = await tx.sampleStorageRecord.findFirst({
      where: { sampleId: input.sampleId },
      orderBy: { storedAt: "desc" },
    });

    if (latestStorage) {
      await tx.sampleStorageRecord.update({
        where: { id: latestStorage.id },
        data: {
          disposedBy: input.disposedBy.trim(),
          disposedAt: new Date(),
          disposeReason: input.disposeReason.trim(),
        },
      });
    } else {
      await tx.sampleStorageRecord.create({
        data: {
          sampleId: input.sampleId,
          storageLocation: sample.storageLocation,
          preservationCondition: sample.preservationCondition,
          storedBy: sample.receivedBy,
          disposedBy: input.disposedBy.trim(),
          disposedAt: new Date(),
          disposeReason: input.disposeReason.trim(),
        },
      });
    }

    const updated = await tx.sample.update({
      where: { id: input.sampleId },
      data: { status: "Disposed" },
    });

    await appendSampleCustodyEvent(tx, {
      sampleId: input.sampleId,
      action: "Disposed",
      fromPerson: sample.receivedBy,
      toPerson: input.disposedBy.trim(),
      note: input.disposeReason.trim(),
      performedBy: changedBy,
    });

    await appendSampleAuditLog(tx, {
      entityType: "sample",
      entityId: input.sampleId,
      action: "Disposed",
      before: { status: sample.status },
      after: { status: "Disposed", disposeReason: input.disposeReason },
      changedBy,
    });

    return updated;
  });
}

export async function listStorageRecords(sampleId: string) {
  const rows = await db.sampleStorageRecord.findMany({
    where: { sampleId },
    orderBy: { storedAt: "desc" },
  });
  return rows.map(mapSampleStorageView);
}

export async function exportSampleReceptionReport() {
  const rows = await db.sample.findMany({
    include: {
      primaryMethod: { select: { methodCode: true, methodName: true } },
      request: { select: { requestCode: true } },
    },
    orderBy: { receivedAt: "desc" },
    take: 5000,
  });

  return rows.map((r) => ({
    sampleCode: r.sampleCode,
    sampleName: r.sampleName,
    sampleType: r.sampleType,
    receivedAt: r.receivedAt.toISOString(),
    receivedBy: r.receivedBy,
    conditionOnReceipt: String(r.conditionOnReceipt),
    status: String(r.status),
    methodCode: r.primaryMethod?.methodCode ?? "",
    methodName: r.primaryMethod?.methodName ?? "",
    requestCode: r.request?.requestCode ?? "",
    assignedTo: r.assignedTo,
    dueDate: r.dueDate?.toISOString() ?? "",
  }));
}
