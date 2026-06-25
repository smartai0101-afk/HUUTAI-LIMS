"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { permissionGroupsForAdmin } from "@/lib/auth/nav-permissions";
import { PERMISSION_KEYS, type PermissionKey } from "@/lib/auth/permissions";
import { roleToLabel } from "@/lib/auth/roles";
import { db } from "@/lib/db";

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

export type PermissionGroupAssignment = {
  id: string;
  label: string;
  permissions: { key: PermissionKey; name: string; granted: boolean }[];
};

export type PermissionAssignmentView = {
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  groups: PermissionGroupAssignment[];
};

export async function listPermissionAssignments(): Promise<PermissionAssignmentView[]> {
  const users = await db.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: { select: { permission: { select: { key: true } } } },
    },
  });

  const groups = permissionGroupsForAdmin();

  return users.map((user) => {
    const granted = new Set(user.permissions.map((p) => p.permission.key));
    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      role: roleToLabel(user.role),
      groups: groups.map((group) => ({
        id: group.id,
        label: group.label,
        permissions: group.items.map((item) => ({
          key: item.key,
          name: item.label,
          granted: granted.has(item.key),
        })),
      })),
    };
  });
}

export async function saveUserPermissions(formData: FormData): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const userId = str(formData, "userId");
  if (!userId) return { error: "Thiếu user" };

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User không tồn tại" };

  const selectedKeys = PERMISSION_KEYS.filter((key) => formData.get(`perm_${key}`) === "on");

  const permissions = await db.permission.findMany({
    where: { key: { in: [...selectedKeys] } },
  });

  await db.$transaction([
    db.userPermission.deleteMany({ where: { userId } }),
    ...permissions.map((p) =>
      db.userPermission.create({ data: { userId, permissionId: p.id } }),
    ),
  ]);

  revalidatePath("/admin/permissions");
  return {};
}
