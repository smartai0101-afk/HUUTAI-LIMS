"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { deleteCoaFile, saveCoaFile } from "@/lib/coa-upload";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/audit";
import { isValidFormDate, parseFormDate } from "@/lib/modules/shared";
import { computeStandardStatus, type StandardExpiryStatus } from "@/lib/standard-status";

type StandardWriteData = {
  code: string;
  name: string;
  standardGroup: string;
  manufacturer: string;
  casNumber: string;
  productCode: string;
  lot: string;
  purity: string;
  uncertainty: string;
  coaPath: string | null;
  unit: string;
  quantity: number;
  expiryDate: Date | null;
  afterOpenExpiry: Date | null;
  storageCondition: string;
  storageLocation: string;
  notes: string;
  status: StandardExpiryStatus;
};

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseStandardGroup(value: string) {
  return value.trim() || "CRM";
}

function parseQuantity(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseOptionalDate(value: string): Date | null {
  if (!value.trim()) return null;
  if (!isValidFormDate(value)) return null;
  return parseFormDate(value);
}

async function resolveCoaPathString(
  fd: FormData,
  existingPath?: string | null,
): Promise<{ coaPath: string | null; error?: string }> {
  const file = fd.get("coa");
  if (file instanceof File && file.size > 0) {
    const saved = await saveCoaFile(file);
    if (saved.error) return { coaPath: null, error: saved.error };
    if (saved.path && existingPath && existingPath !== saved.path) {
      await deleteCoaFile(existingPath);
    }
    return { coaPath: saved.path ?? null };
  }
  const kept = str(fd, "coaPath") || existingPath || null;
  return { coaPath: kept || null };
}

function buildStandardData(fd: FormData, coaPath: string | null): StandardWriteData {
  const expiryDate = parseFormDate(str(fd, "expiryDate"));
  const afterOpenRaw = str(fd, "afterOpenExpiry");
  return {
    code: str(fd, "code"),
    name: str(fd, "name"),
    standardGroup: parseStandardGroup(str(fd, "standardGroup")),
    manufacturer: str(fd, "manufacturer"),
    casNumber: str(fd, "casNumber"),
    productCode: str(fd, "productCode"),
    lot: str(fd, "lot"),
    purity: str(fd, "purity"),
    uncertainty: str(fd, "uncertainty"),
    coaPath: coaPath ?? null,
    unit: str(fd, "unit"),
    quantity: parseQuantity(str(fd, "quantity")),
    expiryDate,
    afterOpenExpiry: parseOptionalDate(afterOpenRaw),
    storageCondition: str(fd, "storageCondition"),
    storageLocation: str(fd, "storageLocation"),
    notes: str(fd, "notes"),
    status: computeStandardStatus(expiryDate),
  };
}

function toPrismaCreateData(data: StandardWriteData): Prisma.StandardUncheckedCreateInput {
  return {
    code: data.code,
    name: data.name,
    standardGroup: data.standardGroup,
    manufacturer: data.manufacturer,
    casNumber: data.casNumber,
    productCode: data.productCode,
    lot: data.lot,
    purity: data.purity,
    uncertainty: data.uncertainty,
    coaPath: data.coaPath ?? null,
    unit: data.unit,
    quantity: data.quantity,
    expiryDate: data.expiryDate,
    afterOpenExpiry: data.afterOpenExpiry,
    storageCondition: data.storageCondition,
    storageLocation: data.storageLocation,
    notes: data.notes,
    status: data.status,
  };
}

export async function createStandard(formData: FormData) {
  const user = String(formData.get("user") ?? "System");
  const code = str(formData, "code");
  const name = str(formData, "name");

  if (!code || !name) {
    return { error: "Mã và tên chất chuẩn là bắt buộc" };
  }

  if (!isValidFormDate(str(formData, "expiryDate"))) {
    return { error: "Hạn chứng chỉ không hợp lệ" };
  }

  const afterOpen = str(formData, "afterOpenExpiry");
  if (afterOpen && !isValidFormDate(afterOpen)) {
    return { error: "Hạn sau mở nắp không hợp lệ" };
  }

  const existing = await db.standard.findUnique({ where: { code } });
  if (existing) {
    return { error: "Mã chất chuẩn đã tồn tại" };
  }

  const resolved = await resolveCoaPathString(formData);
  if (resolved.error) return { error: resolved.error };

  const writeData = buildStandardData(formData, resolved.coaPath);
  const standard = await db.standard.create({ data: toPrismaCreateData(writeData) });

  await logActivity({
    user,
    action: "Created",
    entityType: "Standard",
    entityId: standard.id,
    object: code,
    after: standard,
  });

  revalidatePath("/standards");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}

export async function updateStandard(formData: FormData) {
  const user = String(formData.get("user") ?? "System");
  const id = str(formData, "id");
  const code = str(formData, "code");
  const name = str(formData, "name");

  if (!id || !code || !name) {
    return { error: "Thiếu thông tin bắt buộc" };
  }

  if (!isValidFormDate(str(formData, "expiryDate"))) {
    return { error: "Hạn chứng chỉ không hợp lệ" };
  }

  const afterOpen = str(formData, "afterOpenExpiry");
  if (afterOpen && !isValidFormDate(afterOpen)) {
    return { error: "Hạn sau mở nắp không hợp lệ" };
  }

  const before = await db.standard.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy chất chuẩn" };

  const resolved = await resolveCoaPathString(formData, before.coaPath);
  if (resolved.error) return { error: resolved.error };

  const writeData = buildStandardData(formData, resolved.coaPath);
  const standard = await db.standard.update({ where: { id }, data: toPrismaCreateData(writeData) });

  await logActivity({
    user,
    action: "Updated",
    entityType: "Standard",
    entityId: id,
    object: code,
    before,
    after: standard,
  });

  revalidatePath("/standards");
  revalidatePath("/containers");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}

export async function deleteStandard(formData: FormData) {
  const user = String(formData.get("user") ?? "System");
  const id = String(formData.get("id") ?? "");

  const before = await db.standard.findUnique({
    where: { id },
    include: {
      _count: { select: { containers: true, preparedStandardComponents: true } },
    },
  });
  if (!before) return { error: "Không tìm thấy chất chuẩn" };

  if (before._count.containers > 0 || before._count.preparedStandardComponents > 0) {
    return { error: "Không thể xóa vì chất chuẩn đang được sử dụng." };
  }

  if (before.coaPath) await deleteCoaFile(before.coaPath);
  await db.standard.delete({ where: { id } });

  await logActivity({
    user,
    action: "Deleted",
    entityType: "Standard",
    entityId: id,
    object: before.code,
    before,
  });

  revalidatePath("/standards");
  revalidatePath("/containers");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}
