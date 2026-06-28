import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/jwt";
import { isPublicAuthPath } from "@/lib/auth/public-paths";
import { isAdminPermissionKey } from "@/lib/auth/nav-permissions";
import { hasPermission, routePermission } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";

function nextWithPathname(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

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

  if (isPublicAuthPath(pathname)) {
    if (pathname === "/login" && request.nextUrl.searchParams.get("reason") === "session") {
      const response = nextWithPathname(request);
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }
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
    return nextWithPathname(request);
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: "Vui lòng đăng nhập",
          code: "UNAUTHORIZED",
          message: "Phiên đăng nhập hết hạn — vui lòng đăng nhập lại.",
        },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let payload: Awaited<ReturnType<typeof verifySessionToken>> = null;
  try {
    payload = await verifySessionToken(token);
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: "Vui lòng đăng nhập",
          code: "UNAUTHORIZED",
          message: "Phiên đăng nhập hết hạn — vui lòng đăng nhập lại.",
        },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      const response = NextResponse.json(
        {
          error: "Vui lòng đăng nhập",
          code: "UNAUTHORIZED",
          message: "Phiên đăng nhập hết hạn — vui lòng đăng nhập lại.",
        },
        { status: 401 },
      );
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }
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

  return nextWithPathname(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
