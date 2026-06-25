"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { db } from "@/lib/db";
import { requireEditRole, requireManageRole } from "@/lib/equipment-auth";
import { appendEquipmentHistory } from "@/lib/equipment-history";
import { isValidFormDate, parseFormDate } from "@/lib/modules/shared";

const SPARE_PART_PATHS = [
  "/equipment",
  "/equipment/spare-parts",
  "/equipment/catalog",
  "/equipment/history",
];

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseFloatValue(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function revalidateSpareParts() {
  SPARE_PART_PATHS.forEach((p) => revalidatePath(p));
}

export async function createSparePart(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";

  const code = str(formData, "code");
  const name = str(formData, "name");
  if (!code || !name) return { error: "Mã và tên phụ kiện là bắt buộc" };

  if (await db.sparePart.findUnique({ where: { code } })) {
    return { error: "Mã phụ kiện đã tồn tại" };
  }

  const row = await db.sparePart.create({
    data: {
      code,
      name,
      manufacturer: str(formData, "manufacturer"),
      productCode: str(formData, "productCode"),
      lotNumber: str(formData, "lotNumber"),
      stockQty: parseFloatValue(str(formData, "stockQty")),
      minQty: parseFloatValue(str(formData, "minQty")),
      unit: str(formData, "unit"),
      notes: str(formData, "notes"),
      createdBy: user,
      updatedBy: user,
    },
  });

  await writeAuditLog({
    user,
    action: "Created",
    entityType: "SparePart",
    entityId: row.id,
    object: code,
    after: row,
  });
  revalidateSpareParts();
  return { success: true };
}

export async function updateSparePart(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");
  const code = str(formData, "code");
  const name = str(formData, "name");
  if (!id || !code || !name) return { error: "Thiếu thông tin bắt buộc" };

  const before = await db.sparePart.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy phụ kiện" };

  const duplicate = await db.sparePart.findFirst({ where: { code, NOT: { id } } });
  if (duplicate) return { error: "Mã phụ kiện đã tồn tại" };

  const row = await db.sparePart.update({
    where: { id },
    data: {
      code,
      name,
      manufacturer: str(formData, "manufacturer"),
      productCode: str(formData, "productCode"),
      lotNumber: str(formData, "lotNumber"),
      stockQty: parseFloatValue(str(formData, "stockQty")),
      minQty: parseFloatValue(str(formData, "minQty")),
      unit: str(formData, "unit"),
      notes: str(formData, "notes"),
      updatedBy: user,
    },
  });

  await writeAuditLog({
    user,
    action: "Updated",
    entityType: "SparePart",
    entityId: id,
    object: code,
    before,
    after: row,
  });
  revalidateSpareParts();
  return { success: true };
}

export async function deleteSparePart(formData: FormData) {
  const auth = await requireManageRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");

  const before = await db.sparePart.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy phụ kiện" };

  await db.sparePart.delete({ where: { id } });
  await writeAuditLog({
    user,
    action: "Deleted",
    entityType: "SparePart",
    entityId: id,
    object: before.code,
    before,
  });
  revalidateSpareParts();
  return { success: true };
}

export async function linkSparePartToEquipment(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";

  const equipmentId = str(formData, "equipmentId");
  const sparePartId = str(formData, "sparePartId");
  if (!equipmentId || !sparePartId) return { error: "Thiết bị và phụ kiện là bắt buộc" };

  const equipment = await db.equipment.findUnique({ where: { id: equipmentId } });
  if (!equipment) return { error: "Không tìm thấy thiết bị" };

  const sparePart = await db.sparePart.findUnique({ where: { id: sparePartId } });
  if (!sparePart) return { error: "Không tìm thấy phụ kiện" };

  const existing = await db.equipmentSparePartLink.findUnique({
    where: { equipmentId_sparePartId: { equipmentId, sparePartId } },
  });
  if (existing) return { error: "Linh kiện đã được liên kết với thiết bị này" };

  const row = await db.equipmentSparePartLink.create({
    data: {
      equipmentId,
      sparePartId,
      notes: str(formData, "notes"),
    },
  });

  await writeAuditLog({
    user,
    action: "Linked",
    entityType: "EquipmentSparePartLink",
    entityId: row.id,
    object: `${equipment.code} ↔ ${sparePart.code}`,
    after: row,
  });
  revalidateSpareParts();
  return { success: true };
}

export async function unlinkSparePartFromEquipment(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";
  const id = str(formData, "id");
  if (!id) return { error: "Thiếu mã liên kết" };

  const before = await db.equipmentSparePartLink.findUnique({
    where: { id },
    include: { equipment: true, sparePart: true },
  });
  if (!before) return { error: "Không tìm thấy liên kết" };

  await db.equipmentSparePartLink.delete({ where: { id } });
  await writeAuditLog({
    user,
    action: "Unlinked",
    entityType: "EquipmentSparePartLink",
    entityId: id,
    object: `${before.equipment.code} ↔ ${before.sparePart.code}`,
    before,
  });
  revalidateSpareParts();
  return { success: true };
}

export async function recordSparePartUsage(formData: FormData) {
  const auth = await requireEditRole();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || "System";

  const equipmentId = str(formData, "equipmentId");
  const sparePartId = str(formData, "sparePartId");
  const quantityStr = str(formData, "quantity");
  const usedDateStr = str(formData, "usedDate");

  if (!equipmentId || !sparePartId || !quantityStr || !isValidFormDate(usedDateStr)) {
    return { error: "Thiết bị, phụ kiện, số lượng và ngày sử dụng là bắt buộc" };
  }

  const quantity = parseFloatValue(quantityStr);
  if (quantity <= 0) return { error: "Số lượng phải lớn hơn 0" };

  const equipment = await db.equipment.findUnique({ where: { id: equipmentId } });
  if (!equipment) return { error: "Không tìm thấy thiết bị" };

  const sparePart = await db.sparePart.findUnique({ where: { id: sparePartId } });
  if (!sparePart) return { error: "Không tìm thấy phụ kiện" };
  if (sparePart.stockQty < quantity) {
    return { error: `Tồn kho không đủ (còn ${sparePart.stockQty} ${sparePart.unit})` };
  }

  const usedDate = parseFormDate(usedDateStr)!;

  const row = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const usage = await tx.sparePartUsage.create({
      data: {
        equipmentId,
        sparePartId,
        quantity,
        usedDate,
        notes: str(formData, "notes"),
        createdBy: user,
      },
    });

    await tx.sparePart.update({
      where: { id: sparePartId },
      data: { stockQty: sparePart.stockQty - quantity, updatedBy: user },
    });

    await appendEquipmentHistory(tx, {
      equipmentId,
      eventType: "SparePartReplacement",
      eventDate: usedDate,
      title: `Thay thế ${sparePart.name}`,
      description: `${quantity} ${sparePart.unit} — ${str(formData, "notes")}`,
      sourceType: "SparePartUsage",
      sourceId: usage.id,
      createdBy: user,
      updatedBy: user,
    });

    return usage;
  });

  await writeAuditLog({
    user,
    action: "Used",
    entityType: "SparePartUsage",
    entityId: row.id,
    object: `${equipment.code} — ${sparePart.code}`,
    after: row,
  });
  revalidateSpareParts();
  return { success: true };
}
