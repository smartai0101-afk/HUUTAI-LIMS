"use server";

import { Prisma } from "@prisma/client";
import { redirect, unstable_rethrow } from "next/navigation";
import { db, isRemoteDatabase } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import {
  clearSessionCookie,
  createSessionToken,
  loadUserSessionPayload,
  setSessionCookie,
} from "@/lib/auth/session";

export type LoginState = { error?: string } | null;

function loginDbErrorMessage(error: unknown): string | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021") {
      return "Database chưa có bảng users. Chạy: npx prisma migrate deploy && npx tsx prisma/seed.ts";
    }
  }
  const message = error instanceof Error ? error.message : String(error);
  if (/no such table|does not exist/i.test(message)) {
    return "Database chưa migrate. Chạy: npx prisma migrate deploy && npx tsx prisma/seed.ts";
  }
  return null;
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu" };
  }

  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) {
    return { error: "Server chưa cấu hình SESSION_SECRET. Liên hệ Admin." };
  }

  let safePath = "/";

  try {
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
    safePath =
      redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";
  } catch (error) {
    unstable_rethrow(error);
    console.error("[login]", error);

    const dbHint = loginDbErrorMessage(error);
    if (dbHint) return { error: dbHint };

    if (!isRemoteDatabase() && process.env.NODE_ENV === "production") {
      return {
        error:
          "Server chưa cấu hình database (Turso). Đặt TURSO_DATABASE_URL + TURSO_AUTH_TOKEN trên Vercel.",
      };
    }

    if (process.env.NODE_ENV !== "production") {
      return {
        error:
          "Lỗi server khi đăng nhập. Kiểm tra terminal dev server và chạy npx tsx prisma/seed.ts nếu chưa seed.",
      };
    }

    return { error: "Lỗi server khi đăng nhập. Kiểm tra cấu hình database và logs Vercel." };
  }

  redirect(safePath);
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
