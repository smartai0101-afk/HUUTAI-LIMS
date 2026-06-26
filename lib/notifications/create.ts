import { db } from "@/lib/db";
import { resolveEntityRoute } from "@/lib/notifications/entity-map";

export type CreateNotificationParams = {
  actorUserId?: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  recordLabel?: string;
  object?: string;
  metadata?: Record<string, unknown>;
};

export async function createNotification(params: CreateNotificationParams) {
  const route = resolveEntityRoute(params.entityType);
  const recordLabel =
    params.recordLabel?.trim() ||
    params.object?.trim() ||
    params.entityId;

  await db.notification.create({
    data: {
      actorUserId: params.actorUserId ?? null,
      actorName: params.actorName || "System",
      action: params.action,
      moduleKey: route.moduleKey,
      moduleLabel: route.moduleLabel,
      entityType: params.entityType,
      entityId: params.entityId,
      recordLabel,
      href: route.href,
      metadataJson: JSON.stringify(params.metadata ?? {}),
    },
  });
}
