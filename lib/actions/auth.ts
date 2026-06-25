"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import {
  clearSessionCookie,
  createSessionToken,
  loadUserSessionPayload,
  setSessionCookie,
} from "@/lib/auth/session";

export async function login(formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu" };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.status !== "Active") {
    return { error: "Email hoặc mật khẩu không đúng" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Email hoặc mật khẩu không đúng" };
  }

  const payload = await loadUserSessionPayload(user.id);
  if (!payload) return { error: "Tài khoản không khả dụng" };

  const token = await createSessionToken(payload);
  await setSessionCookie(token);

  const redirectTo = String(formData.get("redirect") ?? "/").trim();
  const safePath =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";
  redirect(safePath);
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
