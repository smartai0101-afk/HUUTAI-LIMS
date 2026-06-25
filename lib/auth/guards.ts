import type { UserRole } from "@prisma/client";
import { roleCapabilities, roleToLabel, type Role } from "@/lib/auth/roles";
import { hasPermission, type PermissionKey } from "@/lib/auth/permissions";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";

type GuardError = { error: string };
type GuardOk = { ok: true; user: SessionUser; role: Role };

export async function requireAuth(): Promise<GuardOk | GuardError> {
  const user = await getSessionUser();
  if (!user) return { error: "Vui lòng đăng nhập" };
  return { ok: true, user, role: user.roleLabel };
}

export async function requireRole(allowed: UserRole[]): Promise<GuardOk | GuardError> {
  const auth = await requireAuth();
  if ("error" in auth) return auth;
  if (!allowed.includes(auth.user.role)) {
    return { error: "Bạn không có quyền truy cập" };
  }
  return auth;
}

export async function requireAdmin(): Promise<GuardOk | GuardError> {
  return requireRole(["Admin"]);
}

export async function requirePermission(
  key: PermissionKey,
  mode: "read" | "write" = "write",
): Promise<GuardOk | GuardError> {
  const auth = await requireAuth();
  if ("error" in auth) return auth;
  if (!hasPermission(auth.user.role, auth.user.extraPermissions, key, mode)) {
    return { error: "Bạn không có quyền truy cập chức năng này" };
  }
  return auth;
}

export async function requireSessionCanEdit(): Promise<GuardOk | GuardError> {
  const auth = await requireAuth();
  if ("error" in auth) return auth;
  const caps = roleCapabilities(auth.user.role);
  if (!caps.canEdit) return { error: "Bạn không có quyền thêm/sửa" };
  return auth;
}

export async function requireSessionCanManage(): Promise<GuardOk | GuardError> {
  const auth = await requireAuth();
  if ("error" in auth) return auth;
  const caps = roleCapabilities(auth.user.role);
  if (!caps.canManage) return { error: "Bạn không có quyền xóa/quản lý" };
  return auth;
}

export async function requireSessionCanApprove(): Promise<GuardOk | GuardError> {
  const auth = await requireAuth();
  if ("error" in auth) return auth;
  const caps = roleCapabilities(auth.user.role);
  if (!caps.canApprove) return { error: "Bạn không có quyền phê duyệt" };
  return auth;
}

export { roleToLabel, roleCapabilities };
export type { SessionUser };
