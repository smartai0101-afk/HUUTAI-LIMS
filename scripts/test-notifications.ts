/**
 * Notification system QA — permission filter + read state.
 */
import { PrismaClient } from "@prisma/client";
import { hasPermission } from "../lib/auth/permissions";
import { createNotification } from "../lib/notifications/create";
import { getUnreadCountForUser, listNotificationsForUser } from "../lib/notifications/query";
import { markAllNotificationsRead, markNotificationRead } from "../lib/notifications/mark-read";
import type { SessionUser } from "../lib/auth/session";

const db = new PrismaClient();

function assertTrue(label: string, value: boolean) {
  if (!value) throw new Error(`${label}: expected true`);
  console.log(`OK ${label}`);
}

function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
  console.log(`OK ${label}`);
}

function asSessionUser(user: {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  role: "Admin" | "Viewer";
  extraPermissions: string[];
}): SessionUser {
  return {
    ...user,
    roleLabel: user.role === "Admin" ? "Admin" : "Viewer",
    permissions: [],
  };
}

async function main() {
  const admin = await db.user.findFirst({ where: { role: "Admin", status: "Active" } });
  const viewer = await db.user.findFirst({ where: { role: "Viewer", status: "Active" } });
  if (!admin || !viewer) {
    throw new Error("Need active Admin and Viewer users in DB (run seed)");
  }

  const viewerPerms = await db.userPermission.findMany({
    where: { userId: viewer.id },
    include: { permission: true },
  });
  const viewerExtra = viewerPerms.map((p) => p.permission.key);
  const viewerCanChemicals = hasPermission(viewer.role, viewerExtra, "chemicals", "read");

  await createNotification({
    actorUserId: viewer.id,
    actorName: viewer.name,
    action: "Created",
    entityType: "Chemical",
    entityId: `test-notif-${Date.now()}`,
    recordLabel: "TEST-NOTIF-001",
  });

  const adminSession = asSessionUser({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    avatarUrl: admin.avatarUrl,
    role: "Admin",
    extraPermissions: [],
  });

  const viewerSession = asSessionUser({
    id: viewer.id,
    email: viewer.email,
    name: viewer.name,
    avatarUrl: viewer.avatarUrl,
    role: "Viewer",
    extraPermissions: viewerExtra,
  });

  const adminCount = await getUnreadCountForUser(adminSession);
  assertTrue("Admin sees unread notifications", adminCount > 0);

  const viewerCount = await getUnreadCountForUser(viewerSession);
  if (viewerCanChemicals) {
    assertTrue("Viewer with chemicals permission sees notifications", viewerCount > 0);
  } else {
    assertEqual("Viewer without chemicals permission sees zero", viewerCount, 0);
  }

  const adminList = await listNotificationsForUser(adminSession, { limit: 5 });
  assertTrue("Admin list has items", adminList.items.length > 0);

  const latest = adminList.items[0];
  const markOne = await markNotificationRead(adminSession, latest.id);
  assertTrue("Mark one read succeeds", "ok" in markOne);

  const afterOne = await getUnreadCountForUser(adminSession);
  assertTrue("Unread count decreased after mark one", afterOne < adminCount);

  const markAll = await markAllNotificationsRead(adminSession);
  assertTrue("Mark all read succeeds", markAll.ok);
  assertEqual("Unread count zero after mark all", await getUnreadCountForUser(adminSession), 0);

  console.log("\nAll notification tests passed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
