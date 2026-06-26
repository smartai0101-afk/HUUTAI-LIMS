import type {
  PreparationType,
  PreparationWorkflowStatus,
  Prisma,
} from "@prisma/client";
import { randomUUID } from "crypto";

export type PreparationRecordType = "CHEMICAL" | "STANDARD" | "STRAIN";

export const PREPARATION_TYPE_MAP: Record<PreparationRecordType, PreparationType> = {
  CHEMICAL: "CHEMICAL",
  STANDARD: "STANDARD",
  STRAIN: "STRAIN",
};

/** Allowed FSM transitions — Phase 2 UI will drive these explicitly. */
export const WORKFLOW_TRANSITIONS: Record<
  PreparationWorkflowStatus,
  PreparationWorkflowStatus[]
> = {
  Draft: ["Prepared", "Cancelled"],
  Prepared: ["Checked", "Cancelled"],
  Checked: ["Approved", "Cancelled"],
  Approved: ["Cancelled"],
  Cancelled: [],
};

export type PreparationSnapshot = Record<string, unknown>;

type Tx = Prisma.TransactionClient;

function serializeSnapshot(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export function canTransitionWorkflow(
  from: PreparationWorkflowStatus,
  to: PreparationWorkflowStatus,
): boolean {
  return WORKFLOW_TRANSITIONS[from]?.includes(to) ?? false;
}

export function requiresStockDeductionOnTransition(
  to: PreparationWorkflowStatus,
): boolean {
  return to === "Prepared";
}

export function isApprovedOrBeyond(status: PreparationWorkflowStatus): boolean {
  return status === "Approved";
}

export function canHardDelete(status: PreparationWorkflowStatus): boolean {
  return status !== "Approved";
}

export function buildPreparationSnapshot(record: unknown): PreparationSnapshot {
  if (record === null || record === undefined) return {};
  if (typeof record !== "object") return { value: record };
  return JSON.parse(JSON.stringify(record)) as PreparationSnapshot;
}

export async function appendPreparationHistory(
  tx: Tx,
  params: {
    preparationType: PreparationRecordType;
    preparationId: string;
    version: number;
    event: string;
    snapshot: unknown;
    reason?: string;
    performedBy: string;
  },
) {
  await tx.preparationHistory.create({
    data: {
      id: randomUUID(),
      preparationType: PREPARATION_TYPE_MAP[params.preparationType],
      preparationId: params.preparationId,
      version: params.version,
      event: params.event,
      snapshotJson: serializeSnapshot(params.snapshot),
      reason: params.reason ?? "",
      performedBy: params.performedBy,
    },
  });
}

export async function appendPreparationAuditLog(
  tx: Tx,
  params: {
    preparationType: PreparationRecordType;
    preparationId: string;
    action: string;
    before?: unknown;
    after?: unknown;
    reason?: string;
    performedBy: string;
  },
) {
  await tx.preparationAuditLog.create({
    data: {
      id: randomUUID(),
      preparationType: PREPARATION_TYPE_MAP[params.preparationType],
      preparationId: params.preparationId,
      action: params.action,
      beforeJson: serializeSnapshot(params.before ?? null),
      afterJson: serializeSnapshot(params.after ?? null),
      reason: params.reason ?? "",
      performedBy: params.performedBy,
    },
  });
}

function workflowVersion(record: { version?: number }): number {
  return record.version && record.version > 0 ? record.version : 1;
}

export async function recordPreparationCreated(
  tx: Tx,
  preparationType: PreparationRecordType,
  record: { id: string; version?: number },
  performedBy: string,
) {
  const version = workflowVersion(record);
  await appendPreparationHistory(tx, {
    preparationType,
    preparationId: record.id,
    version,
    event: "Created",
    snapshot: record,
    performedBy,
  });
  await appendPreparationAuditLog(tx, {
    preparationType,
    preparationId: record.id,
    action: "Created",
    after: record,
    performedBy,
  });
}

export async function recordPreparationUpdated(
  tx: Tx,
  preparationType: PreparationRecordType,
  record: { id: string; version?: number },
  before: unknown,
  performedBy: string,
  reason?: string,
) {
  const version = workflowVersion(record);
  await appendPreparationHistory(tx, {
    preparationType,
    preparationId: record.id,
    version,
    event: reason ? "Amended" : "Updated",
    snapshot: record,
    reason,
    performedBy,
  });
  await appendPreparationAuditLog(tx, {
    preparationType,
    preparationId: record.id,
    action: reason ? "Amended" : "Updated",
    before,
    after: record,
    reason,
    performedBy,
  });
}

export async function recordPreparationDeleted(
  tx: Tx,
  preparationType: PreparationRecordType,
  record: { id: string; version?: number },
  performedBy: string,
  reason?: string,
) {
  const version = workflowVersion(record);
  await appendPreparationHistory(tx, {
    preparationType,
    preparationId: record.id,
    version,
    event: "Deleted",
    snapshot: record,
    reason,
    performedBy,
  });
  await appendPreparationAuditLog(tx, {
    preparationType,
    preparationId: record.id,
    action: "Deleted",
    before: record,
    reason,
    performedBy,
  });
}

export async function recordPreparationTransition(
  tx: Tx,
  preparationType: PreparationRecordType,
  record: { id: string; version?: number; workflowStatus: PreparationWorkflowStatus },
  from: PreparationWorkflowStatus,
  performedBy: string,
  reason?: string,
) {
  const version = workflowVersion(record);
  await appendPreparationHistory(tx, {
    preparationType,
    preparationId: record.id,
    version,
    event: `Transition:${from}->${record.workflowStatus}`,
    snapshot: record,
    reason,
    performedBy,
  });
  await appendPreparationAuditLog(tx, {
    preparationType,
    preparationId: record.id,
    action: `Transition:${from}->${record.workflowStatus}`,
    before: { workflowStatus: from },
    after: record,
    reason,
    performedBy,
  });
}

export function assertWorkflowTransition(
  from: PreparationWorkflowStatus,
  to: PreparationWorkflowStatus,
): string | null {
  if (from === to) return "Trạng thái quy trình không thay đổi";
  if (!canTransitionWorkflow(from, to)) {
    return `Không thể chuyển từ ${from} sang ${to}`;
  }
  return null;
}

export function assertSeparationOfDuties(
  action: "check" | "approve",
  performerStaffId: string | null | undefined,
  preparedByStaffId: string | null | undefined,
  checkedByStaffId?: string | null | undefined,
): string | null {
  if (!performerStaffId) return null;
  if (action === "check" && performerStaffId === preparedByStaffId) {
    return "Người kiểm tra không được trùng người pha chế";
  }
  if (action === "approve") {
    if (performerStaffId === preparedByStaffId) {
      return "Người duyệt không được trùng người pha chế";
    }
    if (checkedByStaffId && performerStaffId === checkedByStaffId) {
      return "Người duyệt không được trùng người kiểm tra";
    }
  }
  return null;
}

export function assertAmendmentAllowed(
  status: PreparationWorkflowStatus,
  reason: string,
): string | null {
  if (status !== "Approved") {
    return "Chỉ bản ghi đã duyệt mới cần sửa đổi (amendment)";
  }
  if (!reason.trim()) {
    return "Bắt buộc nhập lý do sửa đổi sau duyệt";
  }
  return null;
}
