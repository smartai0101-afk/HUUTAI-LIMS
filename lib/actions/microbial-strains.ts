"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { deleteCoaFile, saveCoaFile } from "@/lib/coa-upload";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/audit";
import { requireSessionCanEdit, requireSessionCanManage } from "@/lib/auth/guards";
import { masterHasStockLots, quantityChangeBlocked } from "@/lib/catalog-quantity-guard";
import { isValidFormDate, parseFormDate } from "@/lib/modules/shared";
import { computeStandardStatus, type StandardExpiryStatus } from "@/lib/standard-status";
import { reserveMasterCode, resolveCodeFromForm } from "@/lib/services/code-generator";

type StrainWriteData = {
  code: string;
  codePrefix: string;
  sequenceNumber: number;
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

function buildData(fd: FormData, coaPath: string | null, code: string, sequenceNumber: number): StrainWriteData {
  const expiryDate = parseFormDate(str(fd, "expiryDate"));
  return {
    code,
    codePrefix: "STR",
    sequenceNumber,
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
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };

  const user = auth.user.name || auth.user.email;
  const name = str(formData, "name");
  const { sequenceInput } = resolveCodeFromForm("STR", str(formData, "code"), str(formData, "sequenceNumber"));

  if (!name) return { error: "Tên chủng là bắt buộc" };
  if (!isValidFormDate(str(formData, "expiryDate"))) return { error: "Ngày hết hạn không hợp lệ" };

  const resolved = await resolveCoaPathString(formData);
  if (resolved.error) return { error: resolved.error };

  const result = await db.$transaction(async (tx) => {
    const reserved = await reserveMasterCode(tx, "STR", sequenceInput);
    if ("error" in reserved) return { error: reserved.error };

    const row = await tx.microbialStrain.create({
      data: toPrisma(buildData(formData, resolved.coaPath, reserved.code, reserved.sequenceNumber)),
    });
    return { row, code: reserved.code };
  });

  if ("error" in result) return { error: result.error };

  const { row, code } = result;

  await logActivity({ user, action: "Created", entityType: "MicrobialStrain", entityId: row.id, object: code, after: row });
  revalidatePath("/microbial-strains");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}

export async function updateMicrobialStrain(formData: FormData) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };

  const user = auth.user.name || auth.user.email;
  const id = str(formData, "id");
  const name = str(formData, "name");

  if (!id || !name) return { error: "Thiếu thông tin bắt buộc" };
  if (!isValidFormDate(str(formData, "expiryDate"))) return { error: "Ngày hết hạn không hợp lệ" };

  const before = await db.microbialStrain.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy chủng" };

  const resolved = await resolveCoaPathString(formData, before.coaPath);
  if (resolved.error) return { error: resolved.error };

  const writeData = buildData(formData, resolved.coaPath, before.code, before.sequenceNumber);
  const hasLots = await masterHasStockLots(db, "MicrobialStrain", id);
  const qtyBlock = quantityChangeBlocked(hasLots, before.quantity, writeData.quantity);
  if (qtyBlock) return { error: qtyBlock };

  const row = await db.microbialStrain.update({ where: { id }, data: toPrisma(writeData) });

  await logActivity({ user, action: "Updated", entityType: "MicrobialStrain", entityId: id, object: before.code, before, after: row });
  revalidatePath("/microbial-strains");
  revalidatePath("/prepared-strains");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}

export async function deleteMicrobialStrain(formData: FormData) {
  const auth = await requireSessionCanManage();
  if ("error" in auth) return { error: auth.error };

  const user = auth.user.name || auth.user.email;
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
