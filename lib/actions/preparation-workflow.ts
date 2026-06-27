"use server";

import type { PreparationWorkflowStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getPreparationHistory } from "@/lib/services/preparation-history";
import {
  buildTraceTree,
  findPreparedDerivatives,
  type CatalogSourceKind,
} from "@/lib/services/preparation-traceability";
import {
  creditPreparedStandardOutput,
  deductPreparationStock,
} from "@/lib/services/preparation-transition-stock";
import { recordRejectPreparationTransaction } from "@/lib/services/inventory-transaction-engine";
import type { PreparationRecordType } from "@/lib/services/preparation-workflow";
import {
  assertSeparationOfDuties,
  assertWorkflowTransition,
  PREPARATION_TYPE_MAP,
  recordPreparationTransition,
  WORKFLOW_TRANSITIONS,
} from "@/lib/services/preparation-workflow";

const REVALIDATE_BY_TYPE: Record<PreparationRecordType, string[]> = {
  CHEMICAL: ["/prepared-chemicals", "/chemicals", "/", "/reports"],
  STANDARD: ["/prepared-standards", "/standards", "/chemicals", "/", "/reports"],
  STRAIN: ["/prepared-strains", "/microbial-strains", "/", "/reports"],
};

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseType(raw: string): PreparationRecordType | null {
  if (raw === "CHEMICAL" || raw === "STANDARD" || raw === "STRAIN") return raw;
  return null;
}

function revalidate(type: PreparationRecordType) {
  try {
    REVALIDATE_BY_TYPE[type].forEach((p) => revalidatePath(p));
  } catch {
    // ignore outside request context
  }
}

type WorkflowRecord = {
  id: string;
  code: string;
  workflowStatus: PreparationWorkflowStatus;
  version: number;
  deletedAt: Date | null;
  preparedByStaffId: string | null;
  checkedByStaffId: string | null;
  approvedByStaffId: string | null;
};

async function loadWorkflowRecord(type: PreparationRecordType, id: string) {
  if (type === "CHEMICAL") {
    return db.preparedChemical.findUnique({
      where: { id },
      include: { ingredients: true },
    });
  }
  if (type === "STANDARD") {
    return db.preparedStandard.findUnique({
      where: { id },
      include: { components: true, solvents: true },
    });
  }
  return db.preparedStrain.findUnique({ where: { id }, include: { sourceStrain: true } });
}

export async function transitionPreparationWorkflow(fd: FormData) {
  const user = str(fd, "user") || "System";
  const type = parseType(str(fd, "preparationType"));
  const id = str(fd, "id");
  const to = str(fd, "toStatus") as PreparationWorkflowStatus;
  const staffId = str(fd, "staffId") || null;
  const reason = str(fd, "reason");

  if (!type || !id || !to) return { error: "Thiếu thông tin chuyển trạng thái" };

  const before = (await loadWorkflowRecord(type, id)) as WorkflowRecord | null;
  if (!before) return { error: "Không tìm thấy bản ghi pha chế" };
  if (before.deletedAt) return { error: "Bản ghi đã bị xóa mềm" };

  const transitionError = assertWorkflowTransition(before.workflowStatus, to);
  if (transitionError) return { error: transitionError };

  if (to === "Checked") {
    const dutyError = assertSeparationOfDuties("check", staffId, before.preparedByStaffId);
    if (dutyError) return { error: dutyError };
  }
  if (to === "Approved") {
    const dutyError = assertSeparationOfDuties(
      "approve",
      staffId,
      before.preparedByStaffId,
      before.checkedByStaffId,
    );
    if (dutyError) return { error: dutyError };
  }
  if (to === "Cancelled" && !reason) {
    return { error: "Bắt buộc nhập lý do hủy" };
  }
  if (to === "Rejected" && !reason) {
    return { error: "Bắt buộc nhập lý do từ chối lô pha" };
  }

  try {
    await db.$transaction(async (tx) => {
      if (to === "Prepared" && before.workflowStatus === "Draft") {
        const stockError = await deductPreparationStock(tx, type, id, user);
        if (stockError) throw new Error(stockError);
      }
      // Materials consumed at Draft→Prepared are never restored on Cancel/Reject (GLP).

      if (to === "Approved" && type === "STANDARD" && before.workflowStatus !== "Approved") {
        const creditError = await creditPreparedStandardOutput(tx, id, user);
        if (creditError) throw new Error(creditError);
      }

      const patch: {
        workflowStatus: PreparationWorkflowStatus;
        inventoryStatus?: "Active" | "Rejected";
        preparedByStaffId?: string | null;
        checkedByStaffId?: string | null;
        approvedByStaffId?: string | null;
      } = { workflowStatus: to };
      if (to === "Rejected") patch.inventoryStatus = "Rejected";
      if (to === "Prepared" && staffId) patch.preparedByStaffId = staffId;
      if (to === "Checked" && staffId) patch.checkedByStaffId = staffId;
      if (to === "Approved" && staffId) patch.approvedByStaffId = staffId;

      const row =
        type === "CHEMICAL"
          ? await tx.preparedChemical.update({
              where: { id },
              data: patch,
              include: { ingredients: true },
            })
          : type === "STANDARD"
            ? await tx.preparedStandard.update({
                where: { id },
                data: patch,
                include: { components: true, solvents: true },
              })
            : await tx.preparedStrain.update({
                where: { id },
                data: patch,
                include: { sourceStrain: true },
              });

      await recordPreparationTransition(
        tx,
        type,
        row as { id: string; version?: number; workflowStatus: PreparationWorkflowStatus },
        before.workflowStatus,
        user,
        reason || undefined,
      );

      if (to === "Rejected" && type === "STANDARD") {
        await recordRejectPreparationTransaction(tx, {
          user,
          preparationType: PREPARATION_TYPE_MAP.STANDARD,
          preparationId: id,
          sourceCode: before.code,
          reason,
          referenceType: "PreparedStandard",
          referenceId: id,
        });
      }
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể chuyển trạng thái" };
  }

  revalidate(type);
  return { success: true };
}

export async function fetchPreparationHistory(fd: FormData) {
  const type = parseType(str(fd, "preparationType"));
  const id = str(fd, "id");
  if (!type || !id) return { error: "Thiếu thông tin" };
  const entries = await getPreparationHistory(type, id);
  return { success: true, entries };
}

function parseCatalogKind(raw: string): CatalogSourceKind | null {
  if (raw === "CHEMICAL" || raw === "STANDARD" || raw === "STRAIN") return raw;
  return null;
}

export async function fetchPreparationTraceTree(fd: FormData) {
  const type = parseType(str(fd, "preparationType"));
  const id = str(fd, "id");
  if (!type || !id) return { error: "Thiếu thông tin" };
  const tree = await buildTraceTree(type, id);
  if (!tree) return { error: "Không tìm thấy bản ghi pha chế" };
  return { success: true, tree };
}

export async function fetchCatalogPreparedDerivatives(fd: FormData) {
  const kind = parseCatalogKind(str(fd, "catalogKind"));
  const id = str(fd, "catalogId");
  if (!kind || !id) return { error: "Thiếu thông tin" };
  const derivatives = await findPreparedDerivatives(kind, id);
  return { success: true, derivatives };
}

export async function getAvailableTransitions(workflowStatus: PreparationWorkflowStatus) {
  return WORKFLOW_TRANSITIONS[workflowStatus] ?? [];
}
