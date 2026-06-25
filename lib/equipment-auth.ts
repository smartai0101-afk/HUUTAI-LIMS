import type { Role } from "@/lib/auth/roles";
import {
  requireSessionCanApprove,
  requireSessionCanEdit,
  requireSessionCanManage,
} from "@/lib/auth/guards";

export type { Role };

export function canEditEquipmentRole(role: Role): boolean {
  return role === "Admin" || role === "Lab Manager" || role === "Analyst";
}

export function canManageEquipmentRole(role: Role): boolean {
  return role === "Admin" || role === "Lab Manager";
}

export function canApproveEquipmentRole(role: Role): boolean {
  return role === "Admin" || role === "Lab Manager" || role === "QA/QC";
}

export {
  requireSessionCanEdit as requireCanEdit,
  requireSessionCanManage as requireCanManage,
  requireSessionCanApprove as requireCanApprove,
  requireSessionCanEdit as requireEditRole,
  requireSessionCanManage as requireManageRole,
  requireSessionCanApprove as requireApproveRole,
};
