import type { Prisma, SampleCustodyAction } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export async function appendSampleCustodyEvent(
  tx: Tx,
  params: {
    sampleId: string;
    action: SampleCustodyAction;
    fromPerson?: string;
    toPerson?: string;
    location?: string;
    note?: string;
    performedBy: string;
  },
) {
  await tx.sampleCustodyEvent.create({
    data: {
      sampleId: params.sampleId,
      action: params.action,
      fromPerson: params.fromPerson ?? "",
      toPerson: params.toPerson ?? "",
      location: params.location ?? "",
      note: params.note ?? "",
      performedBy: params.performedBy,
    },
  });
}

export async function listSampleCustodyEvents(sampleId: string) {
  const { db } = await import("@/lib/db");
  const { mapSampleCustodyEntry } = await import("@/lib/mappers/samples");
  const rows = await db.sampleCustodyEvent.findMany({
    where: { sampleId },
    orderBy: { performedAt: "desc" },
  });
  return rows.map(mapSampleCustodyEntry);
}

export async function transferSampleCustody(
  sampleId: string,
  params: {
    fromPerson: string;
    toPerson: string;
    location: string;
    note?: string;
    performedBy: string;
  },
) {
  const { db } = await import("@/lib/db");
  return db.$transaction(async (tx) => {
    await appendSampleCustodyEvent(tx, {
      sampleId,
      action: "Transferred",
      fromPerson: params.fromPerson,
      toPerson: params.toPerson,
      location: params.location,
      note: params.note,
      performedBy: params.performedBy,
    });

    const { appendSampleAuditLog } = await import("@/lib/services/samples/sample-audit");
    await appendSampleAuditLog(tx, {
      entityType: "sample",
      entityId: sampleId,
      action: "CustodyTransfer",
      before: { fromPerson: params.fromPerson },
      after: { toPerson: params.toPerson, location: params.location },
      changedBy: params.performedBy,
    });
  });
}
