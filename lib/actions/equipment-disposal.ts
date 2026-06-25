"use server";

import type { EquipmentDisposalStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { requireApproveRole, requireEditRole, requireManageRole } from "@/lib/equipment-auth";
import { appendEquipmentHistory } from "@/lib/equipment-history";
import { deleteEquipmentFile, saveEquipmentFile } from "@/lib/equipment-upload";
import { isValidFormDate, parseFormDate } from "@/lib/modules/shared";

const DISPOSAL_PATHS = [
  "/equipment",
  "/equipment/catalog",
  "/equipment/disposal",
  "/equipment/history",
];

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseFloatValue(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseDisposalStatus(value: string): EquipmentDisposalStatus {
  const statuses: EquipmentDisposalStatus[] = ["Pending", "Approved", "Rejected"];
  return statuses.includes(value as EquipmentDisposalStatus)
    ? (value as EquipmentDisposalStatus)
    : "Pending";
}

function revalidateDisposal() {
  DISPOSAL_PATHS.forEach((p) => revalidatePath(p));
}

async function resolveDocumentPath(
  fd: FormData,
  existingPath?: string | null,
): Promise<{ documentPath: string | null; error?: string }> {
  const file = fd.get("document");
  if (file instanceof File && file.size > 0) {
    const saved = await saveEquipmentFile(file, "disposal");
    if (saved.error) return { documentPath: null, error: saved.error };
    if (saved.path && existingPath && existingPath !== saved.path) {
      await deleteEquipmentFile(existingPath);
    }
    return { documentPath: saved.path ?? null };
  }
  const kept = str(fd, "documentPath") || existingPath || null;
  return { documentPath: kept || null };
}

export async function createDisposal(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";

  const equipmentId = str(formData, "equipmentId");
  const disposalDateStr = str(formData, "disposalDate");
  if (!equipmentId || !isValidFormDate(disposalDateStr)) {
    return { error: "Thiết bị và ngày thanh lý là bắt buộc" };
  }

  const equipment = await db.equipment.findUnique({ where: { id: equipmentId } });
  if (!equipment) return { error: "Không tìm thấy thiết bị" };
  if (equipment.status === "Disposed") return { error: "Thiết bị đã được thanh lý" };

  const resolved = await resolveDocumentPath(formData);
  if (resolved.error) return { error: resolved.error };

  const row = await db.equipmentDisposal.create({
    data: {
      equipmentId,
      disposalDate: parseFormDate(disposalDateStr)!,
      residualValue: parseFloatValue(str(formData, "residualValue")),
      decision: str(formData, "decision"),
      approver: str(formData, "approver"),
      documentPath: resolved.documentPath,
      status: "Pending",
      notes: str(formData, "notes"),
      createdBy: user,
      updatedBy: user,
    },
  });

  await writeAuditLog({
    user,
    action: "Created",
    entityType: "EquipmentDisposal",
    entityId: row.id,
    object: equipment.code,
    after: row,
  });
  revalidateDisposal();
  return { success: true };
}

export async function updateDisposal(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");
  if (!id) return { error: "Thiếu mã thanh lý" };

  const before = await db.equipmentDisposal.findUnique({
    where: { id },
    include: { equipment: true },
  });
  if (!before) return { error: "Không tìm thấy hồ sơ thanh lý" };
  if (before.status === "Approved") return { error: "Hồ sơ đã được duyệt, không thể sửa" };

  const disposalDateStr = str(formData, "disposalDate");
  if (!isValidFormDate(disposalDateStr)) return { error: "Ngày thanh lý không hợp lệ" };

  const resolved = await resolveDocumentPath(formData, before.documentPath);
  if (resolved.error) return { error: resolved.error };

  const row = await db.equipmentDisposal.update({
    where: { id },
    data: {
      disposalDate: parseFormDate(disposalDateStr)!,
      residualValue: parseFloatValue(str(formData, "residualValue")),
      decision: str(formData, "decision"),
      approver: str(formData, "approver"),
      documentPath: resolved.documentPath,
      notes: str(formData, "notes"),
      updatedBy: user,
    },
  });

  await writeAuditLog({
    user,
    action: "Updated",
    entityType: "EquipmentDisposal",
    entityId: id,
    object: before.equipment.code,
    before,
    after: row,
  });
  revalidateDisposal();
  return { success: true };
}

export async function deleteDisposal(formData: FormData) {
  const auth = await requireManageRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");

  const before = await db.equipmentDisposal.findUnique({
    where: { id },
    include: { equipment: true },
  });
  if (!before) return { error: "Không tìm thấy hồ sơ thanh lý" };

  if (before.documentPath) await deleteEquipmentFile(before.documentPath);

  await db.$transaction(async (tx) => {
    await tx.equipmentHistoryEvent.deleteMany({
      where: { sourceType: "EquipmentDisposal", sourceId: id },
    });
    await tx.equipmentDisposal.delete({ where: { id } });
  });

  await writeAuditLog({
    user,
    action: "Deleted",
    entityType: "EquipmentDisposal",
    entityId: id,
    object: before.equipment.code,
    before,
  });
  revalidateDisposal();
  return { success: true };
}

export async function approveDisposal(formData: FormData) {
  const auth = await requireApproveRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");
  if (!id) return { error: "Thiếu mã thanh lý" };

  const before = await db.equipmentDisposal.findUnique({
    where: { id },
    include: { equipment: true },
  });
  if (!before) return { error: "Không tìm thấy hồ sơ thanh lý" };
  if (before.status === "Approved") return { error: "Hồ sơ đã được duyệt" };

  const newStatus = parseDisposalStatus(str(formData, "status"));
  if (newStatus === "Pending") return { error: "Trạng thái phê duyệt không hợp lệ" };

  const approver = str(formData, "approver") || user;

  const row = await db.$transaction(async (tx) => {
    const disposal = await tx.equipmentDisposal.update({
      where: { id },
      data: {
        status: newStatus,
        approver,
        notes: str(formData, "notes") || before.notes,
        updatedBy: user,
      },
    });

    if (newStatus === "Approved") {
      await tx.equipment.update({
        where: { id: before.equipmentId },
        data: { status: "Disposed", updatedBy: user },
      });

      await appendEquipmentHistory(tx, {
        equipmentId: before.equipmentId,
        eventType: "Disposal",
        eventDate: before.disposalDate,
        title: "Thanh lý thiết bị",
        description: before.decision || before.notes,
        sourceType: "EquipmentDisposal",
        sourceId: id,
        createdBy: user,
        updatedBy: user,
      });
    }

    return disposal;
  });

  await writeAuditLog({
    user,
    action: newStatus === "Approved" ? "Approved" : "Rejected",
    entityType: "EquipmentDisposal",
    entityId: id,
    object: before.equipment.code,
    before,
    after: row,
  });
  revalidateDisposal();
  return { success: true };
}
