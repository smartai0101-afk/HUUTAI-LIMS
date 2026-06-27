import type { PreparationWorkflowStatus } from "@prisma/client";

export const PREPARATION_WORKFLOW_STATUS_LABELS: Record<PreparationWorkflowStatus, string> = {
  Draft: "Nháp",
  Prepared: "Đã pha chế",
  Checked: "Đã kiểm tra",
  Approved: "Đã duyệt",
  Rejected: "Bị từ chối",
  Cancelled: "Đã hủy",
};

export const PREPARATION_WORKFLOW_FILTERS = [
  "All",
  "Draft",
  "Prepared",
  "Checked",
  "Approved",
  "Rejected",
  "Cancelled",
] as const;

export type PreparationWorkflowFilter = (typeof PREPARATION_WORKFLOW_FILTERS)[number];

export const PREPARATION_WORKFLOW_BADGE_CLASS: Record<PreparationWorkflowStatus, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Prepared: "bg-sky-100 text-sky-800",
  Checked: "bg-amber-100 text-amber-900",
  Approved: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-orange-100 text-orange-900",
  Cancelled: "bg-rose-100 text-rose-800",
};

export const TRANSITION_ACTION_LABELS: Partial<
  Record<`${PreparationWorkflowStatus}->${PreparationWorkflowStatus}`, string>
> = {
  "Draft->Prepared": "Xác nhận đã pha chế",
  "Draft->Cancelled": "Hủy nháp",
  "Prepared->Checked": "Ghi nhận đã kiểm tra",
  "Prepared->Rejected": "Từ chối lô pha (pha sai)",
  "Prepared->Cancelled": "Hủy phiếu",
  "Checked->Approved": "Duyệt",
  "Checked->Rejected": "Từ chối lô pha (pha sai)",
  "Checked->Cancelled": "Hủy phiếu",
  "Approved->Cancelled": "Hủy bản ghi đã duyệt",
};

export function transitionActionLabel(
  from: PreparationWorkflowStatus,
  to: PreparationWorkflowStatus,
): string {
  return TRANSITION_ACTION_LABELS[`${from}->${to}`] ?? `Chuyển sang ${PREPARATION_WORKFLOW_STATUS_LABELS[to]}`;
}

export function staffRoleForTransition(
  to: PreparationWorkflowStatus,
): "preparedByStaffId" | "checkedByStaffId" | "approvedByStaffId" | null {
  if (to === "Prepared") return "preparedByStaffId";
  if (to === "Checked") return "checkedByStaffId";
  if (to === "Approved") return "approvedByStaffId";
  return null;
}
