"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { deleteCoaFile, saveCoaFile } from "@/lib/coa-upload";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/audit";
import { requireSessionCanEdit, requireSessionCanManage } from "@/lib/auth/guards";
import { masterHasStockLots, quantityChangeBlocked } from "@/lib/catalog-quantity-guard";
import { isValidFormDate, parseFormDate } from "@/lib/modules/shared";
import {
  codesMatch,
  identityCodeMismatchMessage,
} from "@/lib/services/stock-in-match";
import { findMasterByIdentity } from "@/lib/stock-lot";
import { computeStandardStatus, type StandardExpiryStatus } from "@/lib/standard-status";
import { reserveMasterCode, resolveCodeFromForm } from "@/lib/services/code-generator";

type ChemicalWriteData = {
  code: string;
  codePrefix: string;
  sequenceNumber: number;
  name: string;
  chemicalGroup: string;
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
  storageCondition: string;
  storageLocation: string;
  notes: string;
  status: StandardExpiryStatus;
};

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseGroup(value: string) {
  return value.trim() || "Dung môi";
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

function buildData(fd: FormData, coaPath: string | null, code: string, sequenceNumber: number): ChemicalWriteData {
  const expiryDate = parseFormDate(str(fd, "expiryDate"));
  return {
    code,
    codePrefix: "CHEM",
    sequenceNumber,
    name: str(fd, "name"),
    chemicalGroup: parseGroup(str(fd, "chemicalGroup")),
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
    storageCondition: str(fd, "storageCondition"),
    storageLocation: str(fd, "storageLocation"),
    notes: str(fd, "notes"),
    status: computeStandardStatus(expiryDate),
  };
}

function toPrisma(data: ChemicalWriteData): Prisma.ChemicalUncheckedCreateInput {
  return { ...data, coaPath: data.coaPath ?? null };
}

async function isInUse(id: string) {
  const [containers, ingredients, usageLogs] = await Promise.all([
    db.container.count({ where: { chemicalId: id } }),
    db.preparedChemicalIngredient.count({ where: { chemicalId: id } }),
    db.usageLog.count({
      where: {
        OR: [{ sourceType: "Chemical", sourceId: id }, { container: { chemicalId: id } }],
      },
    }),
  ]);
  return containers > 0 || ingredients > 0 || usageLogs > 0;
}

export async function createChemical(formData: FormData) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };

  const user = auth.user.name || auth.user.email;
  const name = str(formData, "name");
  const { sequenceInput } = resolveCodeFromForm("CHEM", str(formData, "code"), str(formData, "sequenceNumber"));

  if (!name) return { error: "Tên hoá chất là bắt buộc" };
  if (!isValidFormDate(str(formData, "expiryDate"))) return { error: "Ngày hết hạn không hợp lệ" };

  const resolved = await resolveCoaPathString(formData);
  if (resolved.error) return { error: resolved.error };

  const manufacturer = str(formData, "manufacturer");
  const casNumber = str(formData, "casNumber");
  const productCode = str(formData, "productCode");

  const result = await db.$transaction(async (tx) => {
    const matched = await findMasterByIdentity(tx, "Chemical", {
      name,
      casNumber,
      manufacturer,
      productCode,
    });

    const reserved = await reserveMasterCode(tx, "CHEM", sequenceInput);
    if ("error" in reserved) return { error: reserved.error };

    if (matched && !codesMatch(matched.code, reserved.code)) {
      return { error: identityCodeMismatchMessage("Chemical", matched.code) };
    }

    const chemical = await tx.chemical.create({
      data: toPrisma(buildData(formData, resolved.coaPath, reserved.code, reserved.sequenceNumber)),
    });
    return { chemical, code: reserved.code };
  });

  if ("error" in result) return { error: result.error };

  const { chemical, code } = result;
  await logActivity({ user, action: "Created", entityType: "Chemical", entityId: chemical.id, object: code, after: chemical });
  revalidatePath("/chemicals");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}

export async function updateChemical(formData: FormData) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };

  const user = auth.user.name || auth.user.email;
  const id = str(formData, "id");
  const name = str(formData, "name");

  if (!id || !name) return { error: "Thiếu thông tin bắt buộc" };
  if (!isValidFormDate(str(formData, "expiryDate"))) return { error: "Ngày hết hạn không hợp lệ" };

  const before = await db.chemical.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy hoá chất" };

  const resolved = await resolveCoaPathString(formData, before.coaPath);
  if (resolved.error) return { error: resolved.error };

  const writeData = buildData(formData, resolved.coaPath, before.code, before.sequenceNumber);
  const hasLots = await masterHasStockLots(db, "Chemical", id);
  const qtyBlock = quantityChangeBlocked(hasLots, before.quantity, writeData.quantity);
  if (qtyBlock) return { error: qtyBlock };

  const chemical = await db.chemical.update({ where: { id }, data: toPrisma(writeData) });

  await logActivity({ user, action: "Updated", entityType: "Chemical", entityId: id, object: before.code, before, after: chemical });
  revalidatePath("/chemicals");
  revalidatePath("/containers");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}

export async function deleteChemical(formData: FormData) {
  const auth = await requireSessionCanManage();
  if ("error" in auth) return { error: auth.error };

  const user = auth.user.name || auth.user.email;
  const id = String(formData.get("id") ?? "");

  const before = await db.chemical.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy hoá chất" };
  if (await isInUse(id)) return { error: "Không thể xóa vì mục này đang được sử dụng." };

  if (before.coaPath) await deleteCoaFile(before.coaPath);
  await db.chemical.delete({ where: { id } });

  await logActivity({ user, action: "Deleted", entityType: "Chemical", entityId: id, object: before.code, before });
  revalidatePath("/chemicals");
  revalidatePath("/containers");
  revalidatePath("/");
  revalidatePath("/reports");
  return { success: true };
}
