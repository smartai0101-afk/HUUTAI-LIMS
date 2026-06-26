"use server";

import type { StockInSourceType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import { requireSessionCanEdit } from "@/lib/auth/guards";
import { saveCoaFile } from "@/lib/coa-upload";
import { db } from "@/lib/db";
import { isValidFormDate, parseFormDate } from "@/lib/modules/shared";
import { parseStockInSourceType } from "@/lib/services/stock-in-match";
import { STOCK_IN_VALIDATION } from "@/lib/stock-in-fields";
import { describeUnitMismatch, unitsAreConvertible } from "@/lib/inventory-units";
import { applyStockIn } from "@/lib/stock-lot";
import { ensureMaster } from "@/lib/stock-in-master";

const REVALIDATE_PATHS = [
  "/stock-in",
  "/containers",
  "/chemicals",
  "/standards",
  "/microbial-strains",
  "/usage-logs",
  "/",
  "/reports",
];

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseQuantity(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function revalidateAll() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

async function resolveCoaPath(fd: FormData): Promise<{ coaPath: string | null; error?: string }> {
  const file = fd.get("coa");
  if (file instanceof File && file.size > 0) {
    const saved = await saveCoaFile(file);
    if (saved.error) return { coaPath: null, error: saved.error };
    return { coaPath: saved.path ?? null };
  }
  const kept = str(fd, "coaPath");
  return { coaPath: kept || null };
}

export async function createStockIn(formData: FormData) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };

  const user = auth.user.name || auth.user.email;
  const performedBy = str(formData, "performedBy") || user;
  const sourceType = parseStockInSourceType(String(formData.get("sourceType") ?? ""));

  if (!sourceType) return { error: STOCK_IN_VALIDATION.missingType };

  const code = str(formData, "code");
  const name = str(formData, "name");
  const lot = str(formData, "lot");
  const unit = str(formData, "unit");
  const quantityIn = parseQuantity(str(formData, "quantityIn"));

  if (!code) return { error: STOCK_IN_VALIDATION.missingCode };
  if (!name) return { error: STOCK_IN_VALIDATION.missingName };
  if (!lot) return { error: STOCK_IN_VALIDATION.missingLot };
  if (!unit) return { error: STOCK_IN_VALIDATION.missingUnit };
  if (quantityIn <= 0) return { error: STOCK_IN_VALIDATION.invalidQuantity };

  if (!isValidFormDate(str(formData, "expiryDate"))) {
    return { error: "Ngày hết hạn không hợp lệ" };
  }
  if (sourceType === "Standard" && str(formData, "afterOpenExpiry") && !isValidFormDate(str(formData, "afterOpenExpiry"))) {
    return { error: "Ngày hết hạn sau mở nắp không hợp lệ" };
  }

  const resolvedCoa = await resolveCoaPath(formData);
  if (resolvedCoa.error) return { error: resolvedCoa.error };

  try {
    const result = await db.$transaction(async (tx) => {
      const master = await ensureMaster(tx, sourceType, formData, resolvedCoa.coaPath);
      if ("error" in master) return master;

      const masterUnit =
        sourceType === "Chemical"
          ? (await tx.chemical.findUnique({ where: { id: master.id } }))?.unit ?? ""
          : sourceType === "Standard"
            ? (await tx.standard.findUnique({ where: { id: master.id } }))?.unit ?? ""
            : (await tx.microbialStrain.findUnique({ where: { id: master.id } }))?.unit ?? "";

      if (masterUnit.trim() && !unitsAreConvertible(unit, masterUnit)) {
        return {
          error: `Vật tư gốc dùng đơn vị ${masterUnit.trim()}; không thể nhập ${unit}. ${describeUnitMismatch(unit, masterUnit)}`,
        };
      }

      const applied = await applyStockIn(tx, {
        user: performedBy,
        sourceType,
        masterId: master.id,
        sourceCode: master.code,
        sourceName: master.name,
        lotInput: {
          lot,
          quantityIn,
          unit,
          expiryDate: parseFormDate(str(formData, "expiryDate")),
          afterOpenExpiry:
            sourceType === "Standard" ? parseFormDate(str(formData, "afterOpenExpiry")) : null,
          coaPath: resolvedCoa.coaPath,
          storageLocation: str(formData, "storageLocation"),
          notes: str(formData, "notes"),
        },
        notes: str(formData, "notes"),
      });

      if ("error" in applied) return { error: applied.error };
      return { success: true as const, master, applied };
    });

    if ("error" in result) return { error: result.error };

    await logActivity({
      user,
      action: "StockIn",
      entityType: sourceType,
      entityId: result.applied.stockLotId,
      object: `${result.master.code} / ${lot}`,
      after: { quantityIn, unit, stockInLogId: result.applied.stockInLogId },
    });

    revalidateAll();
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Không thể lưu nhập kho" };
  }
}
