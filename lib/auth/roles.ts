import type { UserRole } from "@prisma/client";

export const roles = ["Admin", "Lab Manager", "Analyst", "QA/QC", "Viewer"] as const;
export type Role = (typeof roles)[number];

const ROLE_TO_LABEL: Record<UserRole, Role> = {
  Admin: "Admin",
  LabManager: "Lab Manager",
  Analyst: "Analyst",
  QAQC: "QA/QC",
  Viewer: "Viewer",
};

const LABEL_TO_ROLE: Record<Role, UserRole> = {
  Admin: "Admin",
  "Lab Manager": "LabManager",
  Analyst: "Analyst",
  "QA/QC": "QAQC",
  Viewer: "Viewer",
};

export function roleToLabel(role: UserRole): Role {
  return ROLE_TO_LABEL[role];
}

export function labelToRole(label: Role | string): UserRole {
  return LABEL_TO_ROLE[label as Role] ?? "Viewer";
}

export interface RoleCapabilities {
  canManage: boolean;
  canEdit: boolean;
  canApprove: boolean;
  isViewer: boolean;
  canViewAuditReports: boolean;
}

export function roleCapabilities(role: UserRole | Role): RoleCapabilities {
  const label = (roles as readonly string[]).includes(role as string)
    ? (role as Role)
    : roleToLabel(role as UserRole);
  const canManage = label === "Admin" || label === "Lab Manager";
  const isViewer = label === "Viewer";
  const canEdit = canManage || label === "Analyst";
  const canApprove = canManage || label === "QA/QC";
  const canViewAuditReports = canManage || label === "QA/QC" || label === "Analyst";
  return { canManage, canEdit, canApprove, isViewer, canViewAuditReports };
}
