"use server";

import type { Prisma, StockInSourceType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { saveCoaFile } from "@/lib/coa-upload";
import { db } from "@/lib/db";
import { isValidFormDate, parseFormDate } from "@/lib/modules/shared";
import {
  chemicalIdentityMatches,
  codesMatch,
  identityCodeMismatchMessage,
  parseStockInSourceType,
  standardIdentityMatches,
  strainIdentityMatches,
} from "@/lib/services/stock-in-match";
import { computeStandardStatus } from "@/lib/standard-status";
import { STOCK_IN_VALIDATION } from "@/lib/stock-in-fields";
import { describeUnitMismatch, unitsAreConvertible } from "@/lib/inventory-units";
import { applyStockIn, findMasterByIdentity } from "@/lib/stock-lot";

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

async function ensureMaster(
  tx: Prisma.TransactionClient,
  sourceType: StockInSourceType,
  fd: FormData,
  coaPath: string | null,
): Promise<{ id: string; code: string; name: string } | { error: string }> {
  const code = str(fd, "code");
  const name = str(fd, "name");
  if (!code) return { error: STOCK_IN_VALIDATION.missingCode };
  if (!name) return { error: STOCK_IN_VALIDATION.missingName };

  const identity = {
    name,
    casNumber: str(fd, "casNumber"),
    manufacturer: str(fd, "manufacturer"),
    productCode: str(fd, "productCode"),
    atccProductCode: str(fd, "atccProductCode"),
  };

  const existingMasterId = str(fd, "existingMasterId");
  if (existingMasterId) {
    if (sourceType === "Chemical") {
      const row = await tx.chemical.findUnique({ where: { id: existingMasterId } });
      if (!row) return { error: "Không tìm thấy hoá chất đã chọn" };
      if (!codesMatch(row.code, code)) {
        return { error: identityCodeMismatchMessage("Chemical", row.code) };
      }
      if (
        !chemicalIdentityMatches(row, {
          name: identity.name,
          casNumber: identity.casNumber,
          manufacturer: identity.manufacturer,
          productCode: identity.productCode,
        })
      ) {
        return { error: STOCK_IN_VALIDATION.identityMismatch };
      }
      return { id: row.id, code: row.code, name: row.name };
    }
    if (sourceType === "Standard") {
      const row = await tx.standard.findUnique({ where: { id: existingMasterId } });
      if (!row) return { error: "Không tìm thấy chất chuẩn đã chọn" };
      if (!codesMatch(row.code, code)) {
        return { error: identityCodeMismatchMessage("Standard", row.code) };
      }
      if (
        !standardIdentityMatches(row, {
          name: identity.name,
          manufacturer: identity.manufacturer,
          productCode: identity.productCode,
        })
      ) {
        return { error: STOCK_IN_VALIDATION.identityMismatch };
      }
      return { id: row.id, code: row.code, name: row.name };
    }
    const row = await tx.microbialStrain.findUnique({ where: { id: existingMasterId } });
    if (!row) return { error: "Không tìm thấy chủng đã chọn" };
    if (!codesMatch(row.code, code)) {
      return { error: identityCodeMismatchMessage("MicrobialStrain", row.code) };
    }
    if (
      !strainIdentityMatches(row, {
        name: identity.name,
        atccProductCode: identity.atccProductCode,
        manufacturer: identity.manufacturer,
      })
    ) {
      return { error: STOCK_IN_VALIDATION.identityMismatch };
    }
    return { id: row.id, code: row.code, name: row.name };
  }

  const matched = await findMasterByIdentity(tx, sourceType, identity);
  if (matched) {
    if (!codesMatch(matched.code, code)) {
      return { error: identityCodeMismatchMessage(sourceType, matched.code) };
    }
    return { id: matched.id, code: matched.code, name: matched.name };
  }

  const expiryDate = parseFormDate(str(fd, "expiryDate"));
  const status = computeStandardStatus(expiryDate);

  if (sourceType === "Chemical") {
    if (await tx.chemical.findUnique({ where: { code } })) {
      return { error: STOCK_IN_VALIDATION.duplicateCode };
    }
    const row = await tx.chemical.create({
      data: {
        code,
        name,
        chemicalGroup: str(fd, "chemicalGroup") || "Dung môi",
        manufacturer: identity.manufacturer,
        casNumber: identity.casNumber,
        productCode: identity.productCode,
        lot: "",
        purity: str(fd, "purity"),
        uncertainty: str(fd, "uncertainty"),
        coaPath,
        unit: str(fd, "unit"),
        quantity: 0,
        expiryDate,
        storageCondition: str(fd, "storageCondition"),
        storageLocation: str(fd, "storageLocation"),
        notes: str(fd, "notes"),
        status,
      },
    });
    return { id: row.id, code: row.code, name: row.name };
  }

  if (sourceType === "Standard") {
    if (await tx.standard.findUnique({ where: { code } })) {
      return { error: STOCK_IN_VALIDATION.duplicateCode };
    }
    const row = await tx.standard.create({
      data: {
        code,
        name,
        standardGroup: str(fd, "standardGroup") || "CRM",
        manufacturer: identity.manufacturer,
        casNumber: str(fd, "casNumber"),
        productCode: identity.productCode,
        lot: "",
        purity: str(fd, "purity"),
        uncertainty: str(fd, "uncertainty"),
        coaPath,
        unit: str(fd, "unit"),
        quantity: 0,
        expiryDate,
        afterOpenExpiry: parseFormDate(str(fd, "afterOpenExpiry")),
        storageCondition: str(fd, "storageCondition"),
        storageLocation: str(fd, "storageLocation"),
        notes: str(fd, "notes"),
        status,
      },
    });
    return { id: row.id, code: row.code, name: row.name };
  }

  if (await tx.microbialStrain.findUnique({ where: { code } })) {
    return { error: STOCK_IN_VALIDATION.duplicateCode };
  }
  const row = await tx.microbialStrain.create({
    data: {
      code,
      name,
      strainGroup: str(fd, "strainGroup") || "Vi khuẩn",
      manufacturer: identity.manufacturer,
      atccProductCode: identity.atccProductCode,
      lot: "",
      purity: str(fd, "purity"),
      uncertainty: str(fd, "uncertainty"),
      coaPath,
      unit: str(fd, "unit"),
      quantity: 0,
      expiryDate,
      storageCondition: str(fd, "storageCondition"),
      storageLocation: str(fd, "storageLocation"),
      notes: str(fd, "notes"),
      status,
    },
  });
  return { id: row.id, code: row.code, name: row.name };
}

export async function createStockIn(formData: FormData) {
  const user = String(formData.get("user") ?? "System");
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

    await writeAuditLog({
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
