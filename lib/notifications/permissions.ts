import { hasPermission, type PermissionKey } from "@/lib/auth/permissions";
import type { SessionUser } from "@/lib/auth/session";

type NotificationLike = {
  moduleKey: string;
  actorUserId?: string | null;
};

export function canUserSeeNotification(
  user: Pick<SessionUser, "id" | "role" | "extraPermissions">,
  notification: NotificationLike,
): boolean {
  if (user.role === "Admin") return true;
  const key = notification.moduleKey as PermissionKey;
  return hasPermission(user.role, user.extraPermissions, key, "read");
}

export function isOwnNotification(
  userId: string,
  notification: Pick<NotificationLike, "actorUserId">,
): boolean {
  return Boolean(notification.actorUserId && notification.actorUserId === userId);
}

export function visibleModuleKeysForUser(
  user: Pick<SessionUser, "role" | "extraPermissions">,
  allKeys: PermissionKey[],
): PermissionKey[] {
  if (user.role === "Admin") return allKeys;
  return allKeys.filter((key) => hasPermission(user.role, user.extraPermissions, key, "read"));
}
