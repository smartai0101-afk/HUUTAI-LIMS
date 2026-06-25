"use server";

import type { Prisma, RepairProposalPriority, RepairProposalStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { requireApproveRole, requireEditRole, requireManageRole } from "@/lib/equipment-auth";
import { appendEquipmentHistory } from "@/lib/equipment-history";
import { addCycleMonths, computeScheduleStatus } from "@/lib/equipment-schedule";
import { deleteEquipmentFile, saveEquipmentFile } from "@/lib/equipment-upload";
import { generateTicketNo } from "@/lib/services/equipment-maintenance";
import { isValidFormDate, parseFormDate } from "@/lib/modules/shared";

const MAINTENANCE_PATHS = [
  "/equipment",
  "/equipment/catalog",
  "/equipment/maintenance-plans",
  "/equipment/maintenance-logs",
  "/equipment/repair-proposals",
  "/equipment/history",
];

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseFloatValue(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseIntValue(value: string, fallback = 6) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
}

function parsePriority(value: string): RepairProposalPriority {
  const priorities: RepairProposalPriority[] = ["Low", "Medium", "High", "Critical"];
  return priorities.includes(value as RepairProposalPriority)
    ? (value as RepairProposalPriority)
    : "Medium";
}

function parseProposalStatus(value: string): RepairProposalStatus {
  const statuses: RepairProposalStatus[] = ["Open", "InProgress", "Completed", "Cancelled"];
  return statuses.includes(value as RepairProposalStatus)
    ? (value as RepairProposalStatus)
    : "Open";
}

function parseAttachmentPaths(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // ignore
  }
  return raw ? [raw] : [];
}

function revalidateMaintenance() {
  MAINTENANCE_PATHS.forEach((p) => revalidatePath(p));
}

async function syncMaintenancePlansAfterLog(
  tx: Prisma.TransactionClient,
  equipmentId: string,
  completedDate: Date,
  user: string,
) {
  const plans = await tx.maintenancePlan.findMany({ where: { equipmentId } });
  for (const plan of plans) {
    const nextDate = addCycleMonths(completedDate, plan.cycleMonths);
    await tx.maintenancePlan.update({
      where: { id: plan.id },
      data: {
        lastDate: completedDate,
        nextDate,
        status: computeScheduleStatus(nextDate),
        updatedBy: user,
      },
    });
  }
}

async function resolveAttachmentPaths(
  fd: FormData,
  existingPaths: string[],
): Promise<{ attachmentPaths: string[]; error?: string }> {
  const files = fd.getAll("attachments");
  const paths = [...existingPaths];
  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;
    const saved = await saveEquipmentFile(file, "maintenance");
    if (saved.error) return { attachmentPaths: paths, error: saved.error };
    if (saved.path) paths.push(saved.path);
  }
  const kept = str(fd, "attachmentPaths");
  if (kept) {
    try {
      const parsed = JSON.parse(kept);
      if (Array.isArray(parsed)) return { attachmentPaths: parsed.map(String) };
    } catch {
      // keep uploaded paths
    }
  }
  return { attachmentPaths: paths };
}

export async function createMaintenancePlan(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";

  const equipmentId = str(formData, "equipmentId");
  const name = str(formData, "name");
  if (!equipmentId || !name) return { error: "Thiết bị và tên kế hoạch là bắt buộc" };

  const equipment = await db.equipment.findUnique({ where: { id: equipmentId } });
  if (!equipment) return { error: "Không tìm thấy thiết bị" };

  const lastDateStr = str(formData, "lastDate");
  const lastDate = lastDateStr && isValidFormDate(lastDateStr) ? parseFormDate(lastDateStr) : null;
  const cycleMonths = parseIntValue(str(formData, "cycleMonths"));
  const nextDate = lastDate ? addCycleMonths(lastDate, cycleMonths) : null;

  const row = await db.maintenancePlan.create({
    data: {
      equipmentId,
      name,
      cycleMonths,
      lastDate,
      nextDate,
      vendor: str(formData, "vendor"),
      status: computeScheduleStatus(nextDate),
      notes: str(formData, "notes"),
      createdBy: user,
      updatedBy: user,
    },
  });

  await writeAuditLog({
    user,
    action: "Created",
    entityType: "MaintenancePlan",
    entityId: row.id,
    object: `${equipment.code} — ${name}`,
    after: row,
  });
  revalidateMaintenance();
  return { success: true };
}

export async function updateMaintenancePlan(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");
  if (!id) return { error: "Thiếu mã kế hoạch" };

  const before = await db.maintenancePlan.findUnique({ where: { id }, include: { equipment: true } });
  if (!before) return { error: "Không tìm thấy kế hoạch bảo trì" };

  const lastDateStr = str(formData, "lastDate");
  const lastDate = lastDateStr && isValidFormDate(lastDateStr) ? parseFormDate(lastDateStr) : null;
  const cycleMonths = parseIntValue(str(formData, "cycleMonths"), before.cycleMonths);
  const nextDate = lastDate ? addCycleMonths(lastDate, cycleMonths) : before.nextDate;

  const row = await db.maintenancePlan.update({
    where: { id },
    data: {
      name: str(formData, "name") || before.name,
      cycleMonths,
      lastDate,
      nextDate,
      vendor: str(formData, "vendor"),
      status: computeScheduleStatus(nextDate),
      notes: str(formData, "notes"),
      updatedBy: user,
    },
  });

  await writeAuditLog({
    user,
    action: "Updated",
    entityType: "MaintenancePlan",
    entityId: id,
    object: `${before.equipment.code} — ${row.name}`,
    before,
    after: row,
  });
  revalidateMaintenance();
  return { success: true };
}

export async function deleteMaintenancePlan(formData: FormData) {
  const auth = await requireManageRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");

  const before = await db.maintenancePlan.findUnique({ where: { id }, include: { equipment: true } });
  if (!before) return { error: "Không tìm thấy kế hoạch bảo trì" };

  await db.maintenancePlan.delete({ where: { id } });
  await writeAuditLog({
    user,
    action: "Deleted",
    entityType: "MaintenancePlan",
    entityId: id,
    object: `${before.equipment.code} — ${before.name}`,
    before,
  });
  revalidateMaintenance();
  return { success: true };
}

export async function createMaintenanceLog(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";

  const equipmentId = str(formData, "equipmentId");
  const issueDateStr = str(formData, "issueDate");
  if (!equipmentId || !isValidFormDate(issueDateStr)) {
    return { error: "Thiết bị và ngày phát hiện là bắt buộc" };
  }

  const equipment = await db.equipment.findUnique({ where: { id: equipmentId } });
  if (!equipment) return { error: "Không tìm thấy thiết bị" };

  const resolved = await resolveAttachmentPaths(formData, []);
  if (resolved.error) return { error: resolved.error };

  const issueDate = parseFormDate(issueDateStr)!;
  const completedDateStr = str(formData, "completedDate");
  const completedDate =
    completedDateStr && isValidFormDate(completedDateStr) ? parseFormDate(completedDateStr) : null;

  const row = await db.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.create({
      data: {
        equipmentId,
        repairProposalId: str(formData, "repairProposalId") || null,
        issueDate,
        description: str(formData, "description"),
        rootCause: str(formData, "rootCause"),
        action: str(formData, "action"),
        vendor: str(formData, "vendor"),
        cost: parseFloatValue(str(formData, "cost")),
        completedDate,
        attachmentPaths: JSON.stringify(resolved.attachmentPaths),
        notes: str(formData, "notes"),
        createdBy: user,
        updatedBy: user,
      },
    });

    if (completedDate) {
      await syncMaintenancePlansAfterLog(tx, equipmentId, completedDate, user);
      await appendEquipmentHistory(tx, {
        equipmentId,
        eventType: "Maintenance",
        eventDate: completedDate,
        title: "Bảo trì hoàn thành",
        description: str(formData, "description") || str(formData, "action"),
        sourceType: "MaintenanceLog",
        sourceId: log.id,
        createdBy: user,
        updatedBy: user,
      });
    }

    return log;
  });

  await writeAuditLog({
    user,
    action: "Created",
    entityType: "MaintenanceLog",
    entityId: row.id,
    object: equipment.code,
    after: row,
  });
  revalidateMaintenance();
  return { success: true };
}

export async function updateMaintenanceLog(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");
  if (!id) return { error: "Thiếu mã nhật ký" };

  const before = await db.maintenanceLog.findUnique({
    where: { id },
    include: { equipment: true },
  });
  if (!before) return { error: "Không tìm thấy nhật ký bảo trì" };

  const issueDateStr = str(formData, "issueDate");
  if (!isValidFormDate(issueDateStr)) return { error: "Ngày phát hiện không hợp lệ" };

  const existingPaths = parseAttachmentPaths(before.attachmentPaths);
  const resolved = await resolveAttachmentPaths(formData, existingPaths);
  if (resolved.error) return { error: resolved.error };

  const issueDate = parseFormDate(issueDateStr)!;
  const completedDateStr = str(formData, "completedDate");
  const completedDate =
    completedDateStr && isValidFormDate(completedDateStr) ? parseFormDate(completedDateStr) : null;

  const row = await db.maintenanceLog.update({
    where: { id },
    data: {
      issueDate,
      description: str(formData, "description"),
      rootCause: str(formData, "rootCause"),
      action: str(formData, "action"),
      vendor: str(formData, "vendor"),
      cost: parseFloatValue(str(formData, "cost")),
      completedDate,
      attachmentPaths: JSON.stringify(resolved.attachmentPaths),
      notes: str(formData, "notes"),
      updatedBy: user,
    },
  });

  await writeAuditLog({
    user,
    action: "Updated",
    entityType: "MaintenanceLog",
    entityId: id,
    object: before.equipment.code,
    before,
    after: row,
  });
  revalidateMaintenance();
  return { success: true };
}

export async function completeMaintenanceLog(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");

  const completedDateStr = str(formData, "completedDate");
  if (!id || !isValidFormDate(completedDateStr)) {
    return { error: "Mã nhật ký và ngày hoàn thành là bắt buộc" };
  }

  const before = await db.maintenanceLog.findUnique({
    where: { id },
    include: { equipment: true },
  });
  if (!before) return { error: "Không tìm thấy nhật ký bảo trì" };

  const completedDate = parseFormDate(completedDateStr)!;

  const row = await db.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.update({
      where: { id },
      data: {
        completedDate,
        cost: parseFloatValue(str(formData, "cost")) || before.cost,
        action: str(formData, "action") || before.action,
        vendor: str(formData, "vendor") || before.vendor,
        notes: str(formData, "notes") || before.notes,
        updatedBy: user,
      },
    });

    await syncMaintenancePlansAfterLog(tx, before.equipmentId, completedDate, user);

    await appendEquipmentHistory(tx, {
      equipmentId: before.equipmentId,
      eventType: "Maintenance",
      eventDate: completedDate,
      title: "Bảo trì hoàn thành",
      description: log.description || log.action,
      sourceType: "MaintenanceLog",
      sourceId: log.id,
      createdBy: user,
      updatedBy: user,
    });

    return log;
  });

  await writeAuditLog({
    user,
    action: "Completed",
    entityType: "MaintenanceLog",
    entityId: id,
    object: before.equipment.code,
    before,
    after: row,
  });
  revalidateMaintenance();
  return { success: true };
}

export async function deleteMaintenanceLog(formData: FormData) {
  const auth = await requireManageRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");

  const before = await db.maintenanceLog.findUnique({
    where: { id },
    include: { equipment: true },
  });
  if (!before) return { error: "Không tìm thấy nhật ký bảo trì" };

  const paths = parseAttachmentPaths(before.attachmentPaths);
  for (const path of paths) await deleteEquipmentFile(path);

  await db.$transaction(async (tx) => {
    await tx.equipmentHistoryEvent.deleteMany({
      where: { sourceType: "MaintenanceLog", sourceId: id },
    });
    await tx.maintenanceLog.delete({ where: { id } });
  });

  await writeAuditLog({
    user,
    action: "Deleted",
    entityType: "MaintenanceLog",
    entityId: id,
    object: before.equipment.code,
    before,
  });
  revalidateMaintenance();
  return { success: true };
}

export async function createRepairProposal(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";

  const equipmentId = str(formData, "equipmentId");
  const description = str(formData, "description");
  if (!equipmentId || !description) return { error: "Thiết bị và mô tả sự cố là bắt buộc" };

  const equipment = await db.equipment.findUnique({ where: { id: equipmentId } });
  if (!equipment) return { error: "Không tìm thấy thiết bị" };

  const ticketNo = str(formData, "ticketNo") || await generateTicketNo();

  const row = await db.repairProposal.create({
    data: {
      equipmentId,
      ticketNo,
      priority: parsePriority(str(formData, "priority")),
      status: "Open",
      description,
      reportedBy: str(formData, "reportedBy"),
      notes: str(formData, "notes"),
      createdBy: user,
      updatedBy: user,
    },
  });

  await writeAuditLog({
    user,
    action: "Created",
    entityType: "RepairProposal",
    entityId: row.id,
    object: ticketNo,
    after: row,
  });
  revalidateMaintenance();
  return { success: true, ticketNo };
}

export async function updateRepairProposal(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");
  if (!id) return { error: "Thiếu mã phiếu" };

  const before = await db.repairProposal.findUnique({
    where: { id },
    include: { equipment: true },
  });
  if (!before) return { error: "Không tìm thấy phiếu sửa chữa" };

  const newStatus = parseProposalStatus(str(formData, "status"));
  if (newStatus === "Completed") {
    return { error: "Dùng approveRepairCompletion để hoàn thành phiếu sửa chữa" };
  }

  const row = await db.repairProposal.update({
    where: { id },
    data: {
      priority: parsePriority(str(formData, "priority")),
      status: newStatus,
      description: str(formData, "description") || before.description,
      reportedBy: str(formData, "reportedBy"),
      notes: str(formData, "notes"),
      updatedBy: user,
    },
  });

  await writeAuditLog({
    user,
    action: "Updated",
    entityType: "RepairProposal",
    entityId: id,
    object: before.ticketNo,
    before,
    after: row,
  });
  revalidateMaintenance();
  return { success: true };
}

export async function approveRepairCompletion(formData: FormData) {
  const auth = await requireApproveRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");
  if (!id) return { error: "Thiếu mã phiếu" };

  const before = await db.repairProposal.findUnique({
    where: { id },
    include: { equipment: true },
  });
  if (!before) return { error: "Không tìm thấy phiếu sửa chữa" };
  if (before.status === "Completed") return { error: "Phiếu đã hoàn thành" };
  if (before.status === "Cancelled") return { error: "Phiếu đã bị hủy" };

  const row = await db.repairProposal.update({
    where: { id },
    data: { status: "Completed", updatedBy: user },
  });

  await writeAuditLog({
    user,
    action: "Approved",
    entityType: "RepairProposal",
    entityId: id,
    object: before.ticketNo,
    before,
    after: row,
  });
  revalidateMaintenance();
  return { success: true };
}

export async function deleteRepairProposal(formData: FormData) {
  const auth = await requireManageRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");

  const before = await db.repairProposal.findUnique({
    where: { id },
    include: { equipment: true },
  });
  if (!before) return { error: "Không tìm thấy phiếu sửa chữa" };

  await db.repairProposal.delete({ where: { id } });
  await writeAuditLog({
    user,
    action: "Deleted",
    entityType: "RepairProposal",
    entityId: id,
    object: before.ticketNo,
    before,
  });
  revalidateMaintenance();
  return { success: true };
}

export async function convertProposalToLog(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";

  const proposalId = str(formData, "proposalId");
  if (!proposalId) return { error: "Thiếu mã phiếu sửa chữa" };

  const proposal = await db.repairProposal.findUnique({
    where: { id: proposalId },
    include: { equipment: true },
  });
  if (!proposal) return { error: "Không tìm thấy phiếu sửa chữa" };
  if (proposal.status === "Cancelled") return { error: "Phiếu đã bị hủy" };

  const issueDateStr = str(formData, "issueDate");
  const issueDate =
    issueDateStr && isValidFormDate(issueDateStr)
      ? parseFormDate(issueDateStr)!
      : new Date();

  const resolved = await resolveAttachmentPaths(formData, []);
  if (resolved.error) return { error: resolved.error };

  const row = await db.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.create({
      data: {
        equipmentId: proposal.equipmentId,
        repairProposalId: proposal.id,
        issueDate,
        description: str(formData, "description") || proposal.description,
        rootCause: str(formData, "rootCause"),
        action: str(formData, "action"),
        vendor: str(formData, "vendor"),
        cost: parseFloatValue(str(formData, "cost")),
        attachmentPaths: JSON.stringify(resolved.attachmentPaths),
        notes: str(formData, "notes"),
        createdBy: user,
        updatedBy: user,
      },
    });

    await tx.repairProposal.update({
      where: { id: proposal.id },
      data: { status: "InProgress", updatedBy: user },
    });

    await appendEquipmentHistory(tx, {
      equipmentId: proposal.equipmentId,
      eventType: "Repair",
      eventDate: issueDate,
      title: `Sửa chữa ${proposal.ticketNo}`,
      description: log.description,
      sourceType: "RepairProposal",
      sourceId: proposal.id,
      createdBy: user,
      updatedBy: user,
    });

    return log;
  });

  await writeAuditLog({
    user,
    action: "Converted",
    entityType: "RepairProposal",
    entityId: proposalId,
    object: proposal.ticketNo,
    after: row,
  });
  revalidateMaintenance();
  return { success: true, logId: row.id };
}
