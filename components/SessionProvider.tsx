"use client";

import { createContext, useContext, useMemo } from "react";
import { hasPermission, type PermissionKey } from "@/lib/auth/permissions";
import {
  roleCapabilities,
  roles,
  type Role,
} from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/session";

export { roles, type Role };

export type SessionContextValue = {
  user: SessionUser | null;
  role: Role | null;
  canManage: boolean;
  canEdit: boolean;
  canApprove: boolean;
  isViewer: boolean;
  canViewAuditReports: boolean;
  hasPermission: (key: PermissionKey, mode?: "read" | "write") => boolean;
};

const unauthenticatedCaps = {
  canManage: false,
  canEdit: false,
  canApprove: false,
  isViewer: false,
  canViewAuditReports: false,
};

const SessionContext = createContext<SessionContextValue>({
  user: null,
  role: null,
  ...unauthenticatedCaps,
  hasPermission: () => false,
});

export function SessionProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: SessionUser | null;
}) {
  const value = useMemo((): SessionContextValue => {
    if (!initialSession) {
      return {
        user: null,
        role: null,
        ...unauthenticatedCaps,
        hasPermission: () => false,
      };
    }

    const caps = roleCapabilities(initialSession.role);
    const check = (key: PermissionKey, mode: "read" | "write" = "write") =>
      hasPermission(initialSession.role, initialSession.extraPermissions, key, mode);

    return {
      user: initialSession,
      role: initialSession.roleLabel,
      ...caps,
      hasPermission: check,
    };
  }, [initialSession]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

/** @deprecated Use useSession */
export function useRole() {
  const ctx = useContext(SessionContext);
  return {
    role: ctx.role ?? "Viewer",
    setRole: () => undefined,
    canManage: ctx.canManage,
    canEdit: ctx.canEdit,
    canApprove: ctx.canApprove,
    isViewer: ctx.isViewer,
    canViewAuditReports: ctx.canViewAuditReports,
  };
}

export function useUserDisplayName(): string {
  const { user } = useSession();
  return user?.name ?? "User";
}

/** @deprecated Use useUserDisplayName() */
export const USER_DISPLAY_NAME = "User";
