"use server";

import type { EquipmentHistoryEventType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import { db } from "@/lib/db";
import { requireEditRole, requireManageRole } from "@/lib/equipment-auth";
import { isAutoSyncedHistory } from "@/lib/equipment-history";
import { HISTORY_ATTACHMENT_ENTITY } from "@/lib/equipment-history-media";
import { deleteEquipmentFile, saveEquipmentAttachments } from "@/lib/equipment-upload";
import { isValidFormDate, parseFormDate } from "@/lib/modules/shared";

const HISTORY_PATHS = [
  "/equipment",
  "/equipment/catalog",
  "/equipment/history",
];

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseEventType(value: string): EquipmentHistoryEventType {
  const types: EquipmentHistoryEventType[] = [
    "Calibration",
    "Maintenance",
    "Repair",
    "SparePartReplacement",
    "Disposal",
    "Installation",
    "Manual",
    "Other",
  ];
  return types.includes(value as EquipmentHistoryEventType)
    ? (value as EquipmentHistoryEventType)
    : "Manual";
}

function revalidateHistory() {
  HISTORY_PATHS.forEach((p) => revalidatePath(p));
}

async function saveHistoryAttachmentsFromForm(
  formData: FormData,
  eventId: string,
  user: string,
): Promise<{ error?: string }> {
  const files = formData.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return {};

  const result = await db.$transaction(async (tx) => {
    return saveEquipmentAttachments(tx, {
      entityType: HISTORY_ATTACHMENT_ENTITY,
      entityId: eventId,
      files,
      createdBy: user,
    });
  });

  if (result.error) return { error: result.error };
  return {};
}

export async function createHistoryEvent(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";

  const equipmentId = str(formData, "equipmentId");
  const eventDateStr = str(formData, "eventDate");
  const title = str(formData, "title");
  if (!equipmentId || !isValidFormDate(eventDateStr) || !title) {
    return { error: "Thiết bị, ngày sự kiện và tiêu đề là bắt buộc" };
  }

  const equipment = await db.equipment.findUnique({ where: { id: equipmentId } });
  if (!equipment) return { error: "Không tìm thấy thiết bị" };

  const row = await db.equipmentHistoryEvent.create({
    data: {
      equipmentId,
      eventType: parseEventType(str(formData, "eventType")),
      eventDate: parseFormDate(eventDateStr)!,
      title,
      description: str(formData, "description"),
      sourceType: "Manual",
      sourceId: null,
      createdBy: user,
      updatedBy: user,
    },
  });

  const uploadResult = await saveHistoryAttachmentsFromForm(formData, row.id, user);
  if (uploadResult.error) return { error: uploadResult.error };

  await logActivity({ actorUserId: auth.user.id,
    user,
    action: "Created",
    entityType: "EquipmentHistoryEvent",
    entityId: row.id,
    object: `${equipment.code} — ${title}`,
    after: row,
  });
  revalidateHistory();
  return { success: true };
}

export async function updateHistoryEvent(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");
  if (!id) return { error: "Thiếu mã sự kiện" };

  const before = await db.equipmentHistoryEvent.findUnique({
    where: { id },
    include: { equipment: true },
  });
  if (!before) return { error: "Không tìm thấy sự kiện" };
  if (isAutoSyncedHistory(before.sourceType)) {
    return { error: "Không thể sửa sự kiện được đồng bộ tự động" };
  }

  const eventDateStr = str(formData, "eventDate");
  if (!isValidFormDate(eventDateStr)) return { error: "Ngày sự kiện không hợp lệ" };

  const row = await db.equipmentHistoryEvent.update({
    where: { id },
    data: {
      eventType: parseEventType(str(formData, "eventType")),
      eventDate: parseFormDate(eventDateStr)!,
      title: str(formData, "title") || before.title,
      description: str(formData, "description"),
      updatedBy: user,
    },
  });

  const uploadResult = await saveHistoryAttachmentsFromForm(formData, id, user);
  if (uploadResult.error) return { error: uploadResult.error };

  await logActivity({ actorUserId: auth.user.id,
    user,
    action: "Updated",
    entityType: "EquipmentHistoryEvent",
    entityId: id,
    object: `${before.equipment.code} — ${row.title}`,
    before,
    after: row,
  });
  revalidateHistory();
  return { success: true };
}

export async function addHistoryEventImages(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const eventId = str(formData, "eventId");

  if (!eventId) return { error: "Thiếu mã sự kiện" };

  const event = await db.equipmentHistoryEvent.findUnique({
    where: { id: eventId },
    include: { equipment: true },
  });
  if (!event) return { error: "Không tìm thấy sự kiện" };

  const files = formData.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "Chọn ít nhất một ảnh" };

  const uploadResult = await saveHistoryAttachmentsFromForm(formData, eventId, user);
  if (uploadResult.error) return { error: uploadResult.error };

  await logActivity({ actorUserId: auth.user.id,
    user,
    action: "Updated",
    entityType: "EquipmentHistoryEvent",
    entityId: eventId,
    object: `${event.equipment.code} — thêm ảnh lý lịch`,
  });
  revalidateHistory();
  return { success: true };
}

export async function deleteHistoryEventImage(formData: FormData) {
  const auth = await requireManageRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const attachmentId = str(formData, "attachmentId");
  if (!attachmentId) return { error: "Thiếu mã tệp đính kèm" };

  const attachment = await db.equipmentAttachment.findUnique({ where: { id: attachmentId } });
  if (!attachment) return { error: "Không tìm thấy tệp đính kèm" };
  if (attachment.entityType !== HISTORY_ATTACHMENT_ENTITY) {
    return { error: "Chỉ có thể xóa ảnh đã thêm trên lý lịch" };
  }

  const event = await db.equipmentHistoryEvent.findUnique({
    where: { id: attachment.entityId },
    include: { equipment: true },
  });

  await deleteEquipmentFile(attachment.filePath);
  await db.equipmentAttachment.delete({ where: { id: attachmentId } });

  if (event) {
    await logActivity({ actorUserId: auth.user.id,
      user,
      action: "Deleted",
      entityType: "EquipmentAttachment",
      entityId: attachmentId,
      object: `${event.equipment.code} — xóa ảnh lý lịch`,
      before: attachment,
    });
  }

  revalidateHistory();
  return { success: true };
}

export async function deleteHistoryEvent(formData: FormData) {
  const auth = await requireManageRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");

  const before = await db.equipmentHistoryEvent.findUnique({
    where: { id },
    include: { equipment: true },
  });
  if (!before) return { error: "Không tìm thấy sự kiện" };
  if (isAutoSyncedHistory(before.sourceType)) {
    return { error: "Không thể xóa sự kiện được đồng bộ tự động" };
  }

  const attachments = await db.equipmentAttachment.findMany({
    where: { entityType: HISTORY_ATTACHMENT_ENTITY, entityId: id },
  });
  for (const att of attachments) {
    await deleteEquipmentFile(att.filePath);
  }
  await db.equipmentAttachment.deleteMany({
    where: { entityType: HISTORY_ATTACHMENT_ENTITY, entityId: id },
  });

  await db.equipmentHistoryEvent.delete({ where: { id } });
  await logActivity({ actorUserId: auth.user.id,
    user,
    action: "Deleted",
    entityType: "EquipmentHistoryEvent",
    entityId: id,
    object: `${before.equipment.code} — ${before.title}`,
    before,
  });
  revalidateHistory();
  return { success: true };
}
