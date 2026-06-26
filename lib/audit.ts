import { createNotification, type CreateNotificationParams } from "@/lib/notifications/create";

export type AuditParams = {
  user: string;
  action: string;
  entityType: string;
  entityId: string;
  object?: string;
  before?: unknown;
  after?: unknown;
};

export type LogActivityParams = AuditParams & {
  actorUserId?: string | null;
  recordLabel?: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(params: AuditParams) {
  const { db } = await import("@/lib/db");
  await db.auditLog.create({
    data: {
      user: params.user,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      object: params.object ?? params.entityId,
      beforeJson: JSON.stringify(params.before ?? null),
      afterJson: JSON.stringify(params.after ?? null),
    },
  });
}

export async function logActivity(params: LogActivityParams) {
  await writeAuditLog(params);

  const notificationParams: CreateNotificationParams = {
    actorUserId: params.actorUserId,
    actorName: params.user,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    recordLabel: params.recordLabel,
    object: params.object,
    metadata: {
      ...(params.metadata ?? {}),
      before: params.before ?? null,
      after: params.after ?? null,
    },
  };

  await createNotification(notificationParams);
}
