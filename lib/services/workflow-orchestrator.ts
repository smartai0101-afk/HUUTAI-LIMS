import type { Prisma, WorkflowEntityType } from "@prisma/client";

type Tx = Prisma.TransactionClient;

function serialize(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export type WorkflowEventParams = {
  sampleId?: string | null;
  entityType: WorkflowEntityType;
  entityId: string;
  fromStatus?: string;
  toStatus?: string;
  action: string;
  performedBy: string;
  performedByUserId?: string;
  reason?: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
};

export async function appendWorkflowEvent(tx: Tx, params: WorkflowEventParams) {
  await tx.workflowEvent.create({
    data: {
      sampleId: params.sampleId ?? null,
      entityType: params.entityType,
      entityId: params.entityId,
      fromStatus: params.fromStatus ?? "",
      toStatus: params.toStatus ?? "",
      action: params.action,
      performedBy: params.performedBy,
      performedByUserId: params.performedByUserId ?? "",
      reason: params.reason ?? "",
      beforeJson: serialize(params.before),
      afterJson: serialize(params.after),
      ipAddress: params.ipAddress ?? "",
      userAgent: params.userAgent ?? "",
    },
  });
}

export async function recordStatusTransition(
  tx: Tx,
  params: WorkflowEventParams & { fromStatus: string; toStatus: string },
) {
  await appendWorkflowEvent(tx, params);
}

export async function listWorkflowEventsForSample(sampleId: string, limit = 200) {
  const { db } = await import("@/lib/db");
  return db.workflowEvent.findMany({
    where: { sampleId },
    orderBy: { performedAt: "desc" },
    take: limit,
  });
}

export async function listReceptionLogEvents(limit = 100) {
  const { db } = await import("@/lib/db");
  return db.workflowEvent.findMany({
    where: {
      entityType: { in: ["sample_request", "sample"] },
    },
    orderBy: { performedAt: "desc" },
    take: limit,
  });
}

export async function listUnifiedIsoTimeline(sampleId: string) {
  const { db } = await import("@/lib/db");
  const [workflowEvents, sampleAudit, reportHistory, custody] = await Promise.all([
    db.workflowEvent.findMany({
      where: { sampleId },
      orderBy: { performedAt: "desc" },
      take: 200,
    }),
    db.sampleAuditLog.findMany({
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
    }),
    db.reportHistory.findMany({
      where: {
        report: { sampleId },
      },
      orderBy: { actionAt: "desc" },
      take: 50,
    }),
    db.sampleCustodyEvent.findMany({
      where: { sampleId },
      orderBy: { performedAt: "desc" },
      take: 50,
    }),
  ]);

  type TimelineEntry = {
    id: string;
    source: "workflow" | "audit" | "report" | "custody";
    action: string;
    performedBy: string;
    performedAt: Date;
    reason: string;
    fromStatus?: string;
    toStatus?: string;
  };

  const entries: TimelineEntry[] = [
    ...workflowEvents.map((e) => ({
      id: e.id,
      source: "workflow" as const,
      action: e.action,
      performedBy: e.performedBy,
      performedAt: e.performedAt,
      reason: e.reason,
      fromStatus: e.fromStatus || undefined,
      toStatus: e.toStatus || undefined,
    })),
    ...sampleAudit.map((e) => ({
      id: e.id,
      source: "audit" as const,
      action: e.action,
      performedBy: e.changedBy,
      performedAt: e.changedAt,
      reason: "",
    })),
    ...reportHistory.map((e) => ({
      id: e.id,
      source: "report" as const,
      action: e.action,
      performedBy: e.actionBy,
      performedAt: e.actionAt,
      reason: e.reason,
    })),
    ...custody.map((e) => ({
      id: e.id,
      source: "custody" as const,
      action: e.action,
      performedBy: e.performedBy,
      performedAt: e.performedAt,
      reason: e.note,
    })),
  ];

  return entries.sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
}

/** Separation of duties: performer cannot approve their own work. */
export function assertSeparationOfDuties(
  performerId: string,
  approverId: string,
  message = "Người duyệt không được trùng với người thực hiện",
) {
  if (performerId && approverId && performerId === approverId) {
    throw new Error(message);
  }
}
