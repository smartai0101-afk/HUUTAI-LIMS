import type { SessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { canUserSeeNotification } from "@/lib/notifications/permissions";

export async function markNotificationRead(
  user: SessionUser,
  notificationId: string,
): Promise<{ ok: true } | { error: string }> {
  const row = await db.notification.findUnique({ where: { id: notificationId } });
  if (!row || !canUserSeeNotification(user, row)) {
    return { error: "Không tìm thấy thông báo" };
  }

  await db.notificationRead.upsert({
    where: {
      notificationId_userId: {
        notificationId,
        userId: user.id,
      },
    },
    create: {
      notificationId,
      userId: user.id,
    },
    update: {},
  });

  return { ok: true };
}

export async function markAllNotificationsRead(user: SessionUser): Promise<{ ok: true; marked: number }> {
  const { listNotificationsForUser } = await import("@/lib/notifications/query");
  const { items } = await listNotificationsForUser(user, { filter: "unread", limit: 500, offset: 0 });

  if (items.length === 0) {
    return { ok: true, marked: 0 };
  }

  await Promise.all(
    items.map((item) =>
      db.notificationRead.upsert({
        where: {
          notificationId_userId: {
            notificationId: item.id,
            userId: user.id,
          },
        },
        create: {
          notificationId: item.id,
          userId: user.id,
        },
        update: {},
      }),
    ),
  );

  return { ok: true, marked: items.length };
}
