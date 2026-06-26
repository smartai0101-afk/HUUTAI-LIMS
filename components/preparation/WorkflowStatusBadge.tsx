import type { PreparationWorkflowStatus } from "@prisma/client";
import {
  PREPARATION_WORKFLOW_BADGE_CLASS,
  PREPARATION_WORKFLOW_STATUS_LABELS,
} from "@/lib/preparation-workflow-labels";

export function WorkflowStatusBadge({ status }: { status: string }) {
  const key = status as PreparationWorkflowStatus;
  const label = PREPARATION_WORKFLOW_STATUS_LABELS[key] ?? status;
  const className = PREPARATION_WORKFLOW_BADGE_CLASS[key] ?? "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
