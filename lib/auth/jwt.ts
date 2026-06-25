import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

export const SESSION_COOKIE = "lims_session";

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  extraPermissions: string[];
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
