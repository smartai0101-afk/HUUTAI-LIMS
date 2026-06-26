import type { Prisma, StockInSourceType } from "@prisma/client";
import { parseFormDate } from "@/lib/modules/shared";
import {
  chemicalIdentityMatches,
  codesMatch,
  existingCodeIdentityMismatchMessage,
  identityCodeMismatchMessage,
  standardIdentityMatches,
  strainIdentityMatches,
} from "@/lib/services/stock-in-match";
import { computeStandardStatus } from "@/lib/standard-status";
import { STOCK_IN_VALIDATION } from "@/lib/stock-in-fields";
import { findMasterByIdentity } from "@/lib/stock-lot";

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

type MasterIdentity = {
  name: string;
  casNumber: string;
  manufacturer: string;
  productCode: string;
  atccProductCode: string;
};

async function tryReuseMasterByCode(
  tx: Prisma.TransactionClient,
  sourceType: StockInSourceType,
  code: string,
  identity: MasterIdentity,
): Promise<{ id: string; code: string; name: string } | { error: string } | null> {
  if (sourceType === "Chemical") {
    const row = await tx.chemical.findUnique({ where: { code } });
    if (!row) return null;
    if (
      chemicalIdentityMatches(row, {
        name: identity.name,
        casNumber: identity.casNumber,
        manufacturer: identity.manufacturer,
        productCode: identity.productCode,
      })
    ) {
      return { id: row.id, code: row.code, name: row.name };
    }
    return { error: existingCodeIdentityMismatchMessage("Chemical", code) };
  }

  if (sourceType === "Standard") {
    const row = await tx.standard.findUnique({ where: { code } });
    if (!row) return null;
    if (
      standardIdentityMatches(row, {
        name: identity.name,
        manufacturer: identity.manufacturer,
        productCode: identity.productCode,
      })
    ) {
      return { id: row.id, code: row.code, name: row.name };
    }
    return { error: existingCodeIdentityMismatchMessage("Standard", code) };
  }

  const row = await tx.microbialStrain.findUnique({ where: { code } });
  if (!row) return null;
  if (
    strainIdentityMatches(row, {
      name: identity.name,
      atccProductCode: identity.atccProductCode,
      manufacturer: identity.manufacturer,
    })
  ) {
    return { id: row.id, code: row.code, name: row.name };
  }
  return { error: existingCodeIdentityMismatchMessage("MicrobialStrain", code) };
}

export function catalogRowToFormData(row: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(row)) {
    if (value !== undefined && value !== null) fd.set(key, String(value));
  }
  const qty = row.quantity ?? row.quantityIn ?? "";
  if (qty && !fd.get("quantityIn")) fd.set("quantityIn", qty);
  return fd;
}

export async function ensureMaster(
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

  const byCode = await tryReuseMasterByCode(tx, sourceType, code, identity);
  if (byCode) {
    if ("error" in byCode) return byCode;
    return byCode;
  }

  if (sourceType === "Chemical") {
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
