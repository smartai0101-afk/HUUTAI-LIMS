import { exportGroupedValue } from "@/lib/catalog-lot-rows";
import type { ExcelColumn } from "@/lib/excel";
import {
  CHEMICAL_CATALOG_MASTER_KEYS,
  CHEMICAL_CSV_FIELD_KEYS,
  CHEMICAL_EXCEL_COLUMNS,
} from "@/lib/chemicals-fields";
import {
  STANDARD_CATALOG_MASTER_KEYS,
  STANDARD_CSV_FIELD_KEYS,
  STANDARD_EXCEL_COLUMNS,
} from "@/lib/standards-fields";
import {
  STRAIN_CATALOG_MASTER_KEYS,
  STRAIN_EXCEL_COLUMNS,
} from "@/lib/strains-fields";

export type CatalogExportRow = Record<string, string | number>;

type LotRowLike = {
  showMasterFields: boolean;
  [key: string]: unknown;
};

/** Fill empty master columns from the previous row (inverse of exportGroupedValue). */
export function normalizeGroupedImportRows(
  rows: Record<string, string>[],
  masterKeys: readonly string[],
): Record<string, string>[] {
  const carry: Record<string, string> = {};
  return rows.map((row) => {
    const merged = { ...row };
    for (const key of masterKeys) {
      const value = String(merged[key] ?? "").trim();
      if (value) {
        carry[key] = value;
        merged[key] = value;
      } else if (carry[key]) {
        merged[key] = carry[key];
      }
    }
    return merged;
  });
}

export function buildCatalogExportRows<T extends LotRowLike>(
  displayRows: T[],
  fieldKeys: readonly string[],
  masterKeys: readonly string[],
): CatalogExportRow[] {
  const masterKeySet = new Set(masterKeys);
  let stt = 0;
  return displayRows.map((item) => {
    if (item.showMasterFields) stt += 1;
    const row: CatalogExportRow = {
      stt: item.showMasterFields ? stt : "",
    };
    fieldKeys.forEach((key) => {
      const value = item[key] ?? "";
      row[key] =
        masterKeySet.has(key) && (typeof value === "string" || typeof value === "number")
          ? exportGroupedValue(item.showMasterFields, value)
          : typeof value === "string" || typeof value === "number"
            ? value
            : "";
    });
    return row;
  });
}

export function buildStrainExportRows<T extends LotRowLike>(
  displayRows: T[],
): CatalogExportRow[] {
  let stt = 0;
  return displayRows.map((item) => {
    if (item.showMasterFields) stt += 1;
    return {
    stt: item.showMasterFields ? stt : "",
    code: exportGroupedValue(item.showMasterFields, String(item.code ?? "")),
    name: exportGroupedValue(item.showMasterFields, String(item.name ?? "")),
    strainGroup: exportGroupedValue(item.showMasterFields, String(item.strainGroup ?? "")),
    manufacturer: exportGroupedValue(item.showMasterFields, String(item.manufacturer ?? "")),
    atccProductCode: exportGroupedValue(item.showMasterFields, String(item.atccProductCode ?? "")),
    lot: String(item.lot ?? ""),
    purity: String(item.purity ?? ""),
    uncertainty: String(item.uncertainty ?? ""),
    coaPath: String(item.coaPath ?? ""),
    unit: String(item.unit ?? ""),
    quantity: typeof item.quantity === "number" ? item.quantity : Number(item.quantity) || 0,
    expiryDate: String(item.expiryDate ?? ""),
    storageCondition: String(item.storageCondition ?? ""),
    status: String(item.status ?? ""),
    storageLocation: String(item.storageLocation ?? ""),
  };
  });
}

const STT_COLUMN: ExcelColumn = { key: "stt", header: "STT" };

export const CATALOG_EXCEL = {
  chemical: {
    columns: [STT_COLUMN, ...(CHEMICAL_EXCEL_COLUMNS as unknown as ExcelColumn[])],
    fieldKeys: CHEMICAL_CSV_FIELD_KEYS,
    masterKeys: CHEMICAL_CATALOG_MASTER_KEYS,
    filename: "hoa-chat-goc",
  },
  standard: {
    columns: [STT_COLUMN, ...(STANDARD_EXCEL_COLUMNS as unknown as ExcelColumn[])],
    fieldKeys: STANDARD_CSV_FIELD_KEYS,
    masterKeys: STANDARD_CATALOG_MASTER_KEYS,
    filename: "chat-chuan-goc",
  },
  strain: {
    columns: [STT_COLUMN, ...(STRAIN_EXCEL_COLUMNS as unknown as ExcelColumn[])],
    masterKeys: STRAIN_CATALOG_MASTER_KEYS,
    filename: "chung-goc-vi-sinh",
  },
} as const;
