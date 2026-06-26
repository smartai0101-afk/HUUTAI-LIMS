import type { StockInSourceType } from "@prisma/client";
import { db } from "@/lib/db";
import {
  catalogLotsMatch,
  catalogRowKey,
  detectWithinFileDuplicates,
  type CatalogDuplicateInDb,
} from "@/lib/excel-import-utils";
import { describeUnitMismatch, unitsAreConvertible } from "@/lib/inventory-units";
import { isValidFormDate, parseFormDate } from "@/lib/modules/shared";
import { STOCK_IN_VALIDATION } from "@/lib/stock-in-fields";
import { applyStockIn } from "@/lib/stock-lot";
import { catalogRowToFormData, ensureMaster } from "@/lib/stock-in-master";
import { normalizeGroupedImportRows } from "@/lib/catalog-excel";
import {
  CHEMICAL_CATALOG_MASTER_KEYS,
  CHEMICAL_IMPORT_COLUMN_MAP,
} from "@/lib/chemicals-fields";
import {
  STANDARD_CATALOG_MASTER_KEYS,
  STANDARD_IMPORT_COLUMN_MAP,
} from "@/lib/standards-fields";
import {
  STRAIN_CATALOG_MASTER_KEYS,
  STRAIN_IMPORT_COLUMN_MAP,
} from "@/lib/strains-fields";

export type CatalogImportKind = "chemical" | "standard" | "strain";

const CONFIG: Record<
  CatalogImportKind,
  {
    sourceType: StockInSourceType;
    masterKeys: readonly string[];
    columnMap: Record<string, string>;
  }
> = {
  chemical: {
    sourceType: "Chemical",
    masterKeys: CHEMICAL_CATALOG_MASTER_KEYS,
    columnMap: CHEMICAL_IMPORT_COLUMN_MAP,
  },
  standard: {
    sourceType: "Standard",
    masterKeys: STANDARD_CATALOG_MASTER_KEYS,
    columnMap: STANDARD_IMPORT_COLUMN_MAP,
  },
  strain: {
    sourceType: "MicrobialStrain",
    masterKeys: STRAIN_CATALOG_MASTER_KEYS,
    columnMap: STRAIN_IMPORT_COLUMN_MAP,
  },
};

function parseQuantity(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function strRow(row: Record<string, string>, key: string) {
  return String(row[key] ?? "").trim();
}

export function getCatalogImportColumnMap(kind: CatalogImportKind) {
  return CONFIG[kind].columnMap;
}

function catalogDuplicateLabel(row: Record<string, string>, key: string): string {
  const [code, lot] = key.split("|");
  return `mã ${code}, lot ${lot ?? row.lot}`;
}

function catalogRowDuplicateKey(row: Record<string, string>): string {
  const code = strRow(row, "code");
  const lot = strRow(row, "lot");
  if (!code || !lot) return "";
  return catalogRowKey(code, lot);
}

async function findExistingLotInDb(
  sourceType: StockInSourceType,
  code: string,
  lot: string,
): Promise<{ quantity: number; unit: string } | null> {
  const master =
    sourceType === "Chemical"
      ? await db.chemical.findUnique({ where: { code } })
      : sourceType === "Standard"
        ? await db.standard.findUnique({ where: { code } })
        : await db.microbialStrain.findUnique({ where: { code } });
  if (!master) return null;

  const lots = await db.stockLot.findMany({
    where:
      sourceType === "Chemical"
        ? { chemicalId: master.id }
        : sourceType === "Standard"
          ? { standardId: master.id }
          : { microbialStrainId: master.id },
  });
  const hit = lots.find((row) => catalogLotsMatch(row.lot, lot));
  if (!hit) return null;
  return { quantity: hit.quantity, unit: hit.unit };
}

export async function previewCatalogImport(params: {
  kind: CatalogImportKind;
  rows: Record<string, string>[];
}): Promise<{ duplicates?: CatalogDuplicateInDb[]; errors?: string[] }> {
  const { kind, rows } = params;
  const { sourceType, masterKeys } = CONFIG[kind];
  if (!rows.length) return { errors: ["Không có dòng hợp lệ để import"] };

  const normalized = normalizeGroupedImportRows(rows, masterKeys);
  const fileDup = detectWithinFileDuplicates(
    normalized,
    catalogRowDuplicateKey,
    catalogDuplicateLabel,
  );
  const duplicates: CatalogDuplicateInDb[] = [];

  for (let i = 0; i < normalized.length; i++) {
    if (fileDup.skipIndices.has(i)) continue;
    const row = normalized[i]!;
    const line = i + 2;
    const code = strRow(row, "code");
    const lot = strRow(row, "lot");
    if (!code || !lot) continue;

    const existing = await findExistingLotInDb(sourceType, code, lot);
    if (existing) {
      duplicates.push({
        line,
        code,
        lot,
        quantity: existing.quantity,
        unit: existing.unit,
      });
    }
  }

  return {
    duplicates: duplicates.length ? duplicates : undefined,
    errors: fileDup.errors.length ? fileDup.errors : undefined,
  };
}

export async function importCatalogLotRows(params: {
  kind: CatalogImportKind;
  rows: Record<string, string>[];
  user: string;
  mergeDuplicates?: boolean;
}): Promise<{ count?: number; error?: string; errors?: string[] }> {
  const { kind, rows, user, mergeDuplicates = false } = params;
  const { sourceType, masterKeys } = CONFIG[kind];

  if (!rows.length) return { error: "Không có dòng hợp lệ để import" };

  const normalized = normalizeGroupedImportRows(rows, masterKeys);
  const fileDup = detectWithinFileDuplicates(
    normalized,
    catalogRowDuplicateKey,
    catalogDuplicateLabel,
  );
  const errors: string[] = [...fileDup.errors];
  let count = 0;

  for (let i = 0; i < normalized.length; i++) {
    if (fileDup.skipIndices.has(i)) continue;

    const row = normalized[i];
    const line = i + 2;
    const code = strRow(row, "code");
    const name = strRow(row, "name");
    const lot = strRow(row, "lot");
    const unit = strRow(row, "unit");
    const quantityIn = parseQuantity(strRow(row, "quantity"));

    if (!code && !name && !lot) continue;
    if (!code || !name) {
      errors.push(`Dòng ${line}: thiếu mã hoặc tên`);
      continue;
    }

    if (!lot) {
      errors.push(`Dòng ${line} (${code}): thiếu Lot Number`);
      continue;
    }
    if (!unit) {
      errors.push(`Dòng ${line} (${code}): thiếu đơn vị`);
      continue;
    }
    if (quantityIn <= 0) {
      errors.push(`Dòng ${line} (${code}): số lượng phải lớn hơn 0`);
      continue;
    }
    if (!isValidFormDate(strRow(row, "expiryDate"))) {
      errors.push(`Dòng ${line} (${code}): ngày hết hạn không hợp lệ`);
      continue;
    }
    if (
      sourceType === "Standard" &&
      strRow(row, "afterOpenExpiry") &&
      !isValidFormDate(strRow(row, "afterOpenExpiry"))
    ) {
      errors.push(`Dòng ${line} (${code}): ngày hết hạn sau mở nắp không hợp lệ`);
      continue;
    }

    if (!mergeDuplicates) {
      const existing = await findExistingLotInDb(sourceType, code, lot);
      if (existing) {
        errors.push(
          `Dòng ${line}: lot "${lot}" của mã ${code} đã tồn tại (tồn ${existing.quantity} ${existing.unit}) — bỏ qua`,
        );
        continue;
      }
    }

    const coaPath = strRow(row, "coaPath") || null;
    const fd = catalogRowToFormData(row);

    try {
      const result = await db.$transaction(async (tx) => {
        const master = await ensureMaster(tx, sourceType, fd, coaPath);
        if ("error" in master) return { error: master.error };

        const masterUnit =
          sourceType === "Chemical"
            ? (await tx.chemical.findUnique({ where: { id: master.id } }))?.unit ?? ""
            : sourceType === "Standard"
              ? (await tx.standard.findUnique({ where: { id: master.id } }))?.unit ?? ""
              : (await tx.microbialStrain.findUnique({ where: { id: master.id } }))?.unit ?? "";

        if (masterUnit.trim() && !unitsAreConvertible(unit, masterUnit)) {
          return {
            error: `Dòng ${line}: vật tư ${code} dùng đơn vị ${masterUnit.trim()}; không thể nhập ${unit}. ${describeUnitMismatch(unit, masterUnit)}`,
          };
        }

        const applied = await applyStockIn(tx, {
          user,
          sourceType,
          masterId: master.id,
          sourceCode: master.code,
          sourceName: master.name,
          lotInput: {
            lot,
            quantityIn,
            unit,
            expiryDate: parseFormDate(strRow(row, "expiryDate")),
            afterOpenExpiry:
              sourceType === "Standard" ? parseFormDate(strRow(row, "afterOpenExpiry")) : null,
            coaPath,
            storageLocation: strRow(row, "storageLocation"),
            notes: strRow(row, "notes"),
          },
          notes: strRow(row, "notes"),
        });

        if ("error" in applied) return { error: applied.error };
        return { success: true as const };
      });

      if ("error" in result) {
        const msg =
          typeof result.error === "string" ? result.error : STOCK_IN_VALIDATION.invalidQuantity;
        errors.push(msg.startsWith("Dòng ") ? msg : `Dòng ${line} (${code}): ${msg}`);
        continue;
      }
      count++;
    } catch {
      errors.push(`Dòng ${line} (${code}): không thể lưu`);
    }
  }

  if (count === 0) {
    return { error: errors.length ? errors.slice(0, 5).join("; ") : "Không có dòng hợp lệ để import" };
  }

  return { count, errors: errors.length ? errors : undefined };
}
