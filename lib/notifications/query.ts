import type { Notification } from "@prisma/client";
import { PERMISSION_LABELS, PERMISSION_KEYS, type PermissionKey } from "@/lib/auth/nav-permissions";
import type { SessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { actionLabel } from "@/lib/notifications/entity-map";
import {
  canUserSeeNotification,
  visibleModuleKeysForUser,
} from "@/lib/notifications/permissions";
import type { NotificationListParams, NotificationListResult, NotificationView } from "@/lib/notifications/types";

function toView(row: Notification, read: boolean): NotificationView {
  return {
    id: row.id,
    actorUserId: row.actorUserId,
    actorName: row.actorName,
    action: row.action,
    actionLabel: actionLabel(row.action),
    moduleKey: row.moduleKey,
    moduleLabel: row.moduleLabel,
    entityType: row.entityType,
    entityId: row.entityId,
    recordLabel: row.recordLabel,
    href: row.href,
    createdAt: row.createdAt.toISOString(),
    read,
  };
}

function buildWhere(user: SessionUser, params: NotificationListParams) {
  const visibleKeys =
    user.role === "Admin"
      ? PERMISSION_KEYS
      : visibleModuleKeysForUser(user, PERMISSION_KEYS);

  const moduleFilter =
    params.module && visibleKeys.includes(params.module) ? [params.module] : visibleKeys;

  const where: {
    moduleKey: { in: string[] };
    createdAt?: { gte?: Date; lte?: Date };
    reads?: { none: { userId: string } };
    NOT?: { actorUserId: string };
  } = {
    moduleKey: { in: moduleFilter },
  };

  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) where.createdAt.gte = params.from;
    if (params.to) where.createdAt.lte = params.to;
  }

  if (params.filter === "unread") {
    where.reads = { none: { userId: user.id } };
    where.NOT = { actorUserId: user.id };
  }

  return where;
}

const NOTIFICATION_SORT_FIELDS = {
  createdAt: "createdAt",
  actorName: "actorName",
  moduleLabel: "moduleLabel",
  action: "action",
  recordLabel: "recordLabel",
} as const;

function resolveNotificationOrderBy(params: NotificationListParams) {
  const sortBy = params.sortBy && params.sortBy in NOTIFICATION_SORT_FIELDS ? params.sortBy : "createdAt";
  const sortOrder = params.sortOrder === "asc" || params.sortOrder === "desc" ? params.sortOrder : "desc";
  return { [NOTIFICATION_SORT_FIELDS[sortBy]]: sortOrder };
}

export async function listNotificationsForUser(
  user: SessionUser,
  params: NotificationListParams = {},
): Promise<NotificationListResult> {
  const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
  const offset = Math.max(params.offset ?? 0, 0);
  const where = buildWhere(user, params);
  const orderBy = resolveNotificationOrderBy(params);

  const [rows, total] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      include: {
        reads: {
          where: { userId: user.id },
          select: { id: true },
        },
      },
    }),
    db.notification.count({ where }),
  ]);

  const items = rows
    .filter((row) => canUserSeeNotification(user, row))
    .map((row) => toView(row, row.reads.length > 0));

  return { items, total };
}

export async function getUnreadCountForUser(user: SessionUser): Promise<number> {
  const visibleKeys =
    user.role === "Admin"
      ? PERMISSION_KEYS
      : visibleModuleKeysForUser(user, PERMISSION_KEYS);

  return db.notification.count({
    where: {
      moduleKey: { in: visibleKeys },
      reads: { none: { userId: user.id } },
      NOT: { actorUserId: user.id },
    },
  });
}

export async function getNotificationForUser(
  user: SessionUser,
  notificationId: string,
): Promise<NotificationView | null> {
  const row = await db.notification.findUnique({
    where: { id: notificationId },
    include: {
      reads: {
        where: { userId: user.id },
        select: { id: true },
      },
    },
  });

  if (!row || !canUserSeeNotification(user, row)) return null;
  return toView(row, row.reads.length > 0);
}

export function listVisibleModulesForUser(user: SessionUser): { key: PermissionKey; label: string }[] {
  const keys = visibleModuleKeysForUser(user, PERMISSION_KEYS);
  return keys.map((key) => ({ key, label: PERMISSION_LABELS[key] }));
}
