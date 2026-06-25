export const PUBLIC_AUTH_PATHS = ["/login", "/access-denied"] as const;

export function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
