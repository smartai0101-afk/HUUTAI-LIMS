import type { Prisma, SampleAuditEntityType } from "@prisma/client";

type Tx = Prisma.TransactionClient;

function serialize(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export async function appendSampleAuditLog(
  tx: Tx,
  params: {
    entityType: SampleAuditEntityType;
    entityId: string;
    action: string;
    before?: unknown;
    after?: unknown;
    changedBy: string;
  },
) {
  await tx.sampleAuditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      beforeJson: serialize(params.before),
      afterJson: serialize(params.after),
      changedBy: params.changedBy,
    },
  });
}

export async function listSampleAuditLogs(entityType: SampleAuditEntityType, entityId: string) {
  const { db } = await import("@/lib/db");
  const { mapSampleAuditEntry } = await import("@/lib/mappers/samples");
  const rows = await db.sampleAuditLog.findMany({
    where: { entityType, entityId },
    orderBy: { changedAt: "desc" },
    take: 100,
  });
  return rows.map(mapSampleAuditEntry);
}

export async function listSampleAuditLogsForSample(sampleId: string) {
  const { db } = await import("@/lib/db");
  const { mapSampleAuditEntry } = await import("@/lib/mappers/samples");
  const rows = await db.sampleAuditLog.findMany({
    where: {
      OR: [
        { entityType: "sample", entityId: sampleId },
        {
          entityType: "sample_test",
          entityId: {
            in: (
              await db.sampleTest.findMany({
                where: { sampleId },
                select: { id: true },
              })
            ).map((t) => t.id),
          },
        },
      ],
    },
    orderBy: { changedAt: "desc" },
    take: 100,
  });
  return rows.map(mapSampleAuditEntry);
}
