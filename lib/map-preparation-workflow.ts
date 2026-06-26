import type { PreparationWorkflowStatus } from "@prisma/client";
import { PREPARATION_WORKFLOW_STATUS_LABELS } from "@/lib/preparation-workflow-labels";

type StaffNames = {
  preparedByStaff?: { name: string } | null;
  checkedByStaff?: { name: string } | null;
  approvedByStaff?: { name: string } | null;
};

type WorkflowRow = StaffNames & {
  workflowStatus: PreparationWorkflowStatus;
  version: number;
  amendmentReason: string;
  preparedByStaffId: string | null;
  checkedByStaffId: string | null;
  approvedByStaffId: string | null;
};

export function mapPreparationWorkflowFields(row: WorkflowRow) {
  return {
    workflowStatus: row.workflowStatus,
    workflowStatusLabel: PREPARATION_WORKFLOW_STATUS_LABELS[row.workflowStatus],
    version: row.version,
    amendmentReason: row.amendmentReason,
    preparedByStaffId: row.preparedByStaffId,
    checkedByStaffId: row.checkedByStaffId,
    approvedByStaffId: row.approvedByStaffId,
    preparedByStaffName: row.preparedByStaff?.name ?? "",
    checkedByStaffName: row.checkedByStaff?.name ?? "",
    approvedByStaffName: row.approvedByStaff?.name ?? "",
  };
}
