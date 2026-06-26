"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { deleteCoaFile, saveCoaFile } from "@/lib/coa-upload";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/audit";
import { isValidFormDate, parseFormDate } from "@/lib/modules/shared";
import { computeStandardStatus, type StandardExpiryStatus } from "@/lib/standard-status";

type StrainWriteData = {
  code: string;
  name: string;
  strainGroup: string;
  manufacturer: string;
  atccProductCode: string;
  lot: string;
  purity: string;
  uncertainty: string;
  coaPath: string | null;
  unit: string;
  quantity: number;
  expiryDate: Date | null;
  storageCondition: string;
  storageLocation: string;
  status: StandardExpiryStatus;
};

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseGroup(value: string) {
  return value.trim() || "Vi khuẩn";
}

function parseQuantity(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
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

function buildData(fd: FormData, coaPath: string | null): StrainWriteData {
  const expiryDate = parseFormDate(str(fd, "expiryDate"));
  return {
    code: str(fd, "code"),
    name: str(fd, "name"),
    strainGroup: parseGroup(str(fd, "strainGroup")),
    manufacturer: str(fd, "manufacturer"),
    atccProductCode: str(fd, "atccProductCode"),
    lot: str(fd, "lot"),
    purity: str(fd, "purity"),
    uncertainty: str(fd, "uncertainty"),
    coaPath: coaPath ?? null,
    unit: str(fd, "unit"),
    quantity: parseQuantity(str(fd, "quantity")),
    expiryDate,
    storageCondition: str(fd, "storageCondition"),
    storageLocation: str(fd, "storageLocation"),
    status: computeStandardStatus(expiryDate),
  };
}

function toPrisma(data: StrainWriteData): Prisma.MicrobialStrainUncheckedCreateInput {
  return { ...data, coaPath: data.coaPath ?? null };
}

async function isInUse(id: string) {
  const prepared = await db.preparedStrain.count({ where: { sourceStrainId: id } });
  return prepared > 0;
}

export async function createMicrobialStrain(formData: FormData) {
  const user = String(formData.get("user") ?? "System");
  const code = str(formData, "code");
  const name = str(formData, "name");

  if (!code || !name) return { error: "Mã và tên chủng là bắt buộc" };
  if (!isValidFormDate(str(formData, "expiryDate"))) return { error: "Ngày hết hạn không hợp lệ" };
  if (await db.microbialStrain.findUnique({ where: { code } })) return { error: "Mã chủng đã tồn tại" };

  const resolved = await resolveCoaPathString(formData);
  if (resolved.error) return { error: resolved.error };

  const row = await db.microbialStrain.create({ data: toPrisma(buildData(formData, resolved.coaPath)) });

  await logActivity({ user, action: "Created", entityType: "MicrobialStrain", entityId: row.id, object: code, after: row });
  revalidatePath("/microbial-strains");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}

export async function updateMicrobialStrain(formData: FormData) {
  const user = String(formData.get("user") ?? "System");
  const id = str(formData, "id");
  const code = str(formData, "code");
  const name = str(formData, "name");

  if (!id || !code || !name) return { error: "Thiếu thông tin bắt buộc" };
  if (!isValidFormDate(str(formData, "expiryDate"))) return { error: "Ngày hết hạn không hợp lệ" };

  const before = await db.microbialStrain.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy chủng" };

  const resolved = await resolveCoaPathString(formData, before.coaPath);
  if (resolved.error) return { error: resolved.error };

  const row = await db.microbialStrain.update({ where: { id }, data: toPrisma(buildData(formData, resolved.coaPath)) });

  await logActivity({ user, action: "Updated", entityType: "MicrobialStrain", entityId: id, object: code, before, after: row });
  revalidatePath("/microbial-strains");
  revalidatePath("/prepared-strains");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}

export async function deleteMicrobialStrain(formData: FormData) {
  const user = String(formData.get("user") ?? "System");
  const id = String(formData.get("id") ?? "");

  const before = await db.microbialStrain.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy chủng" };
  if (await isInUse(id)) return { error: "Không thể xóa vì mục này đang được sử dụng." };

  if (before.coaPath) await deleteCoaFile(before.coaPath);
  await db.microbialStrain.delete({ where: { id } });

  await logActivity({ user, action: "Deleted", entityType: "MicrobialStrain", entityId: id, object: before.code, before });
  revalidatePath("/microbial-strains");
  revalidatePath("/prepared-strains");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}
