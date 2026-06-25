import { db } from "@/lib/db";

export async function writeAuditLog(params: {
  user: string;
  action: string;
  entityType: string;
  entityId: string;
  object?: string;
  before?: unknown;
  after?: unknown;
}) {
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
