"use server";

import type { UserRole, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/auth/password";
import { requireAdmin } from "@/lib/auth/guards";
import { labelToRole, roleToLabel, roles, type Role } from "@/lib/auth/roles";
import { db } from "@/lib/db";

const ADMIN_PATHS = ["/admin/users", "/admin/permissions"];

function revalidateAdmin() {
  ADMIN_PATHS.forEach((p) => revalidatePath(p));
}

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
};

export async function listUsers(): Promise<UserListItem[]> {
  const users = await db.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, status: true },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: roleToLabel(u.role),
    status: u.status,
  }));
}

export async function createUser(formData: FormData): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");
  const roleLabel = str(formData, "role") as Role;

  if (!name || !email || !password) return { error: "Vui lòng điền đầy đủ thông tin" };
  if (!roles.includes(roleLabel)) return { error: "Role không hợp lệ" };
  if (password.length < 8) return { error: "Mật khẩu tối thiểu 8 ký tự" };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Email đã tồn tại" };

  await db.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: labelToRole(roleLabel),
      status: "Active",
    },
  });

  revalidateAdmin();
  return {};
}

export async function updateUser(formData: FormData): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const id = str(formData, "id");
  const name = str(formData, "name");
  const roleLabel = str(formData, "role") as Role;
  const status = str(formData, "status") as UserStatus;
  const password = str(formData, "password");

  if (!id || !name) return { error: "Thiếu thông tin user" };
  if (!roles.includes(roleLabel)) return { error: "Role không hợp lệ" };
  if (status !== "Active" && status !== "Disabled") return { error: "Trạng thái không hợp lệ" };

  const data: {
    name: string;
    role: UserRole;
    status: UserStatus;
    passwordHash?: string;
  } = {
    name,
    role: labelToRole(roleLabel),
    status,
  };
  if (password) {
    if (password.length < 8) return { error: "Mật khẩu tối thiểu 8 ký tự" };
    data.passwordHash = await hashPassword(password);
  }

  await db.user.update({ where: { id }, data });
  revalidateAdmin();
  return {};
}

export async function deleteUser(formData: FormData): Promise<{ error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const id = str(formData, "id");
  if (!id) return { error: "Thiếu id user" };
  if (id === auth.user.id) return { error: "Không thể xóa tài khoản đang đăng nhập" };

  await db.user.delete({ where: { id } });
  revalidateAdmin();
  return {};
}
