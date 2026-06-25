import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { listEffectivePermissions } from "@/lib/auth/permissions";
import { roleToLabel, type Role } from "@/lib/auth/roles";

export const SESSION_COOKIE = "lims_session";

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  extraPermissions: string[];
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roleLabel: Role;
  extraPermissions: string[];
  permissions: string[];
}

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET must be set (min 16 chars)");
  }
  return new TextEncoder().encode(secret);
}

function maxAgeSeconds() {
  const raw = process.env.SESSION_MAX_AGE;
  const parsed = raw ? Number(raw) : 604800;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 604800;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    role: payload.role,
    extraPermissions: payload.extraPermissions,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds()}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sub = payload.sub;
    if (!sub || typeof sub !== "string") return null;
    const email = String(payload.email ?? "");
    const name = String(payload.name ?? "");
    const role = String(payload.role ?? "Viewer") as UserRole;
    const extraPermissions = Array.isArray(payload.extraPermissions)
      ? payload.extraPermissions.map(String)
      : [];
    return { sub, email, name, role, extraPermissions };
  } catch {
    return null;
  }
}

export function sessionUserFromPayload(payload: SessionPayload): SessionUser {
  const permissions = listEffectivePermissions(payload.role, payload.extraPermissions).map(String);
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    roleLabel: roleToLabel(payload.role),
    extraPermissions: payload.extraPermissions,
    permissions,
  };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds(),
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      permissions: { select: { permission: { select: { key: true } } } },
    },
  });

  if (!user || user.status !== "Active") return null;

  const extraPermissions = user.permissions.map((p) => p.permission.key);
  return sessionUserFromPayload({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    extraPermissions,
  });
}

export async function loadUserSessionPayload(userId: string): Promise<SessionPayload | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      permissions: { select: { permission: { select: { key: true } } } },
    },
  });
  if (!user || user.status !== "Active") return null;
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    extraPermissions: user.permissions.map((p) => p.permission.key),
  };
}
