import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/jwt";
import { isAdminPermissionKey } from "@/lib/auth/nav-permissions";
import { hasPermission, routePermission } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";

const PUBLIC_PATHS = ["/login", "/access-denied"];

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (token && pathname === "/login") {
      try {
        const payload = await verifySessionToken(token);
        if (payload) {
          return NextResponse.redirect(new URL("/", request.url));
        }
      } catch {
        /* SESSION_SECRET missing — allow login page */
      }
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let payload: Awaited<ReturnType<typeof verifySessionToken>> = null;
  try {
    payload = await verifySessionToken(token);
  } catch {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  const permission = routePermission(pathname);
  if (permission) {
    const role = payload.role as UserRole;
    const extra = payload.extraPermissions ?? [];
    const mode = isAdminPermissionKey(permission) ? "write" : "read";
    if (!hasPermission(role, extra, permission, mode)) {
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
