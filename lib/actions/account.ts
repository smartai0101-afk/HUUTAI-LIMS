"use server";

import { revalidatePath } from "next/cache";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireAuth } from "@/lib/auth/guards";
import { refreshSessionCookie } from "@/lib/auth/session";
import { roleToLabel } from "@/lib/auth/roles";
import { deleteAvatarFile, saveAvatarFile } from "@/lib/avatar-upload";
import { db } from "@/lib/db";

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

export type AccountProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
};

export async function getAccountProfile(): Promise<AccountProfile | null> {
  const auth = await requireAuth();
  if ("error" in auth) return null;

  const user = await db.user.findUnique({
    where: { id: auth.user.id },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: roleToLabel(user.role),
    avatarUrl: user.avatarUrl,
  };
}

export async function updateProfile(formData: FormData): Promise<{ error?: string }> {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };

  const name = str(formData, "name");
  if (name.length < 2) return { error: "Tên phải có ít nhất 2 ký tự" };

  await db.user.update({
    where: { id: auth.user.id },
    data: { name },
  });

  await refreshSessionCookie(auth.user.id);
  revalidatePath("/account");
  revalidatePath("/", "layout");
  return {};
}

export async function updateAvatar(formData: FormData): Promise<{ error?: string }> {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };

  const file = formData.get("avatar");
  if (!(file instanceof File)) return { error: "Vui lòng chọn ảnh" };

  const saved = await saveAvatarFile(file);
  if (saved.error) return { error: saved.error };
  if (!saved.path) return { error: "Không thể lưu ảnh" };

  const current = await db.user.findUnique({
    where: { id: auth.user.id },
    select: { avatarUrl: true },
  });

  await db.user.update({
    where: { id: auth.user.id },
    data: { avatarUrl: saved.path },
  });

  if (current?.avatarUrl) {
    await deleteAvatarFile(current.avatarUrl);
  }

  await refreshSessionCookie(auth.user.id);
  revalidatePath("/account");
  revalidatePath("/", "layout");
  return {};
}

export async function removeAvatar(): Promise<{ error?: string }> {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };

  const current = await db.user.findUnique({
    where: { id: auth.user.id },
    select: { avatarUrl: true },
  });

  await db.user.update({
    where: { id: auth.user.id },
    data: { avatarUrl: "" },
  });

  if (current?.avatarUrl) {
    await deleteAvatarFile(current.avatarUrl);
  }

  await refreshSessionCookie(auth.user.id);
  revalidatePath("/account");
  revalidatePath("/", "layout");
  return {};
}

export async function updatePassword(formData: FormData): Promise<{ error?: string }> {
  const auth = await requireAuth();
  if ("error" in auth) return { error: auth.error };

  const currentPassword = str(formData, "currentPassword");
  const newPassword = str(formData, "newPassword");
  const confirmPassword = str(formData, "confirmPassword");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Vui lòng điền đầy đủ mật khẩu" };
  }
  if (newPassword.length < 8) return { error: "Mật khẩu mới tối thiểu 8 ký tự" };
  if (newPassword !== confirmPassword) return { error: "Mật khẩu xác nhận không khớp" };

  const user = await db.user.findUnique({
    where: { id: auth.user.id },
    select: { passwordHash: true },
  });
  if (!user) return { error: "Tài khoản không tồn tại" };

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return { error: "Mật khẩu hiện tại không đúng" };

  await db.user.update({
    where: { id: auth.user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  return {};
}
