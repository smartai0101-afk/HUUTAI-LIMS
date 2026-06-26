import { PREPARED_CHEMICAL_CSV_FIELD_KEYS } from "@/lib/prepared-chemicals-fields";
import { PREPARED_STANDARD_LEVEL_LABELS } from "@/lib/prepared-standards-fields";
import type { ExcelColumn } from "@/lib/excel";
import type { PreparedStandardLevel } from "@prisma/client";
import { detectWithinFileDuplicates } from "@/lib/excel-import-utils";

export const PREPARED_CHEMICAL_IMPORT_COLUMN_MAP: Record<string, string> = Object.fromEntries(
  PREPARED_CHEMICAL_CSV_FIELD_KEYS.map((header) => {
    const keyMap: Record<string, string> = {
      "Mã hóa chất pha": "code",
      "Tên hóa chất pha": "name",
      "Nồng độ": "concentration",
      "Đơn vị nồng độ": "concentrationUnit",
      "Thể tích/Khối lượng pha chế": "preparedQuantity",
      "ĐVT": "unit",
      "Ngày pha chế": "preparedDate",
      "Ngày hết hạn": "expiryDate",
      "Người pha": "preparedBy",
      "Vị trí lưu": "storageLocation",
      "Điều kiện bảo quản": "storageCondition",
      "Trạng thái": "status",
      "Ghi chú": "notes",
      "Hóa chất gốc sử dụng": "ingredientsSummary",
    };
    return [header, keyMap[header] ?? header];
  }),
);

export const PREPARED_CHEMICAL_EXCEL_COLUMNS: ExcelColumn[] = PREPARED_CHEMICAL_CSV_FIELD_KEYS.map(
  (header) => ({ key: header, header }),
);

/** Header columns carried forward when grouped by Mã chuẩn pha chế. */
export const PREPARED_STANDARD_HEADER_KEYS = [
  "STT",
  "Cấp chuẩn",
  "Mã chuẩn pha chế",
  "Tên chuẩn pha chế",
  "Nồng độ",
  "Đơn vị nồng độ",
  "Thể tích/Khối lượng dung môi định mức",
  "Đơn vị dung môi",
  "Ngày pha chế",
  "Ngày hết hạn pha chế",
  "Người pha",
  "Trạng thái",
  "Vị trí lưu",
  "Điều kiện bảo quản",
  "Ghi chú",
] as const;

export const PREPARED_STANDARD_COMPONENT_HEADERS = [
  "Mã chuẩn gốc",
  "Tên chuẩn gốc",
  "Hãng SX chuẩn gốc",
  "Product code chuẩn gốc",
  "Lot chuẩn gốc",
  "Purity chuẩn gốc",
  "Nồng độ nguồn",
  "ĐVT nồng độ nguồn",
  "Cấp nguồn",
  "Ngày pha nguồn",
  "Hạn dùng nguồn",
  "Loại nguồn",
  "Lượng chuẩn gốc sử dụng",
] as const;

export const PREPARED_STANDARD_SOLVENT_HEADERS = [
  "Mã hóa chất gốc",
  "Tên hóa chất gốc",
  "CAS/Product code dung môi",
  "Lot dung môi",
  "Lượng dung môi sử dụng",
] as const;

export const PREPARED_STANDARD_EXCEL_HEADERS = [
  ...PREPARED_STANDARD_HEADER_KEYS,
  ...PREPARED_STANDARD_COMPONENT_HEADERS,
  ...PREPARED_STANDARD_SOLVENT_HEADERS,
] as const;

export const PREPARED_STANDARD_EXCEL_COLUMNS: ExcelColumn[] = PREPARED_STANDARD_EXCEL_HEADERS.map(
  (header) => ({ key: header, header }),
);

export const PREPARED_STANDARD_IMPORT_COLUMN_MAP: Record<string, string> = {
  STT: "stt",
  "Cấp chuẩn": "level",
  "Mã chuẩn pha chế": "code",
  "Tên chuẩn pha chế": "name",
  "Nồng độ": "concentration",
  "Đơn vị nồng độ": "concentrationUnit",
  "Thể tích/Khối lượng dung môi định mức": "solventVolume",
  "Đơn vị dung môi": "solventUnit",
  "Ngày pha chế": "preparedDate",
  "Ngày hết hạn pha chế": "expiryDate",
  "Người pha": "preparedBy",
  "Trạng thái": "status",
  "Vị trí lưu": "storageLocation",
  "Điều kiện bảo quản": "storageCondition",
  "Ghi chú": "notes",
  "Mã chuẩn gốc": "componentStandardCode",
  "Tên chuẩn gốc": "componentStandardName",
  "Hãng SX chuẩn gốc": "componentManufacturer",
  "Product code chuẩn gốc": "componentProductCode",
  "Lot chuẩn gốc": "componentLotNumber",
  "Purity chuẩn gốc": "componentPurity",
  "Nồng độ nguồn": "componentConcentration",
  "ĐVT nồng độ nguồn": "componentConcentrationUnit",
  "Cấp nguồn": "componentLevelLabel",
  "Ngày pha nguồn": "componentPreparedDate",
  "Hạn dùng nguồn": "componentExpiryDate",
  "Loại nguồn": "componentSourceType",
  "Lượng chuẩn gốc sử dụng": "componentQuantityUsed",
  "Mã hóa chất gốc": "solventChemicalCode",
  "Tên hóa chất gốc": "solventChemicalName",
  "CAS/Product code dung môi": "solventCasProductCode",
  "Lot dung môi": "solventLotNumber",
  "Lượng dung môi sử dụng": "solventQuantityUsed",
};

/** @deprecated Use PREPARED_STANDARD_IMPORT_COLUMN_MAP */
export const PREPARED_STANDARD_HEADER_IMPORT_MAP = PREPARED_STANDARD_IMPORT_COLUMN_MAP;

export const PREPARED_STRAIN_EXCEL_HEADERS = [
  "Mã",
  "Tên",
  "Nguồn gốc",
  "Lot nguồn",
  "Nồng độ",
  "Lot",
  "Ngày pha",
  "Hạn dùng sau pha",
  "Passage",
  "Trạng thái",
  "Công thức",
  "Người pha",
  "Người kiểm tra",
  "Điều kiện bảo quản",
  "Người phụ trách",
  "Ghi chú",
] as const;

export const PREPARED_STRAIN_IMPORT_COLUMN_MAP: Record<string, string> = {
  "Mã": "code",
  "Tên": "name",
  "Nguồn gốc": "sourceCode",
  "Lot nguồn": "sourceLotNumber",
  "Nồng độ": "concentration",
  "Lot": "lot",
  "Ngày pha": "preparedDate",
  "Hạn dùng sau pha": "expiryDate",
  "Passage": "passage",
  "Trạng thái": "status",
  "Công thức": "formula",
  "Người pha": "preparedBy",
  "Người kiểm tra": "checkedBy",
  "Điều kiện bảo quản": "storageCondition",
  "Người phụ trách": "responsiblePerson",
  "Ghi chú": "notes",
};

export const PREPARED_STRAIN_EXCEL_COLUMNS: ExcelColumn[] = PREPARED_STRAIN_EXCEL_HEADERS.map(
  (header) => ({ key: header, header }),
);

export function buildPreparedStrainExportRows(
  items: Array<Record<string, unknown>>,
): Array<Record<string, string | number>> {
  return items.map((item) => ({
    "Mã": String(item.code ?? ""),
    "Tên": String(item.name ?? ""),
    "Nguồn gốc": String(item.sourceCode ?? ""),
    "Lot nguồn": String(item.sourceLotNumber ?? item.sourceLotNumberSnapshot ?? ""),
    "Nồng độ": String(item.concentration ?? ""),
    "Lot": String(item.lot ?? ""),
    "Ngày pha": String(item.preparedDate ?? ""),
    "Hạn dùng sau pha": String(item.expiryDate ?? ""),
    "Passage": typeof item.passage === "number" ? item.passage : Number(item.passage) || 0,
    "Trạng thái": String(item.status ?? ""),
    "Công thức": String(item.formula ?? ""),
    "Người pha": String(item.preparedBy ?? ""),
    "Người kiểm tra": String(item.checkedBy ?? ""),
    "Điều kiện bảo quản": String(item.storageCondition ?? ""),
    "Người phụ trách": String(item.responsiblePerson ?? ""),
    "Ghi chú": String(item.notes ?? ""),
  }));
}

/** Carry forward header fields grouped by Mã chuẩn pha chế (inverse of export grouped cells). */
export function normalizePreparedStandardImportRows(
  rows: Record<string, string>[],
): Record<string, string>[] {
  const carry: Record<string, string> = {};
  return rows.map((row) => {
    const merged = { ...row };
    for (const key of PREPARED_STANDARD_HEADER_KEYS) {
      if (key === "STT") continue;
      const internalKey = PREPARED_STANDARD_IMPORT_COLUMN_MAP[key] ?? key;
      const value = String(merged[internalKey] ?? merged[key] ?? "").trim();
      if (value) {
        carry[internalKey] = value;
        merged[internalKey] = value;
      } else if (carry[internalKey]) {
        merged[internalKey] = carry[internalKey]!;
      }
    }
    return merged;
  });
}

export type PreparedStandardImportGroup = {
  header: Record<string, string>;
  lines: number[];
  componentRows: Record<string, string>[];
};

/** Group normalized rows into one phiếu per code (first line = header row). */
export function groupPreparedStandardImportRows(
  rows: Record<string, string>[],
): PreparedStandardImportGroup[] {
  const normalized = normalizePreparedStandardImportRows(rows);
  const groups: PreparedStandardImportGroup[] = [];
  let current: PreparedStandardImportGroup | null = null;

  for (let i = 0; i < normalized.length; i++) {
    const row = normalized[i]!;
    const line = i + 2;
    const code = String(row.code ?? "").trim();
    if (!code) continue;

    if (!current || String(current.header.code ?? "").trim() !== code) {
      current = { header: row, lines: [line], componentRows: [] };
      groups.push(current);
    } else {
      current.lines.push(line);
      current.componentRows.push(row);
    }
  }

  return groups;
}

export function detectPreparedStandardGroupDuplicates(
  rows: Record<string, string>[],
): { errors: string[]; duplicateCodes: Set<string> } {
  const normalized = normalizePreparedStandardImportRows(rows);
  const groupStartLines = new Map<string, number>();
  const errors: string[] = [];
  const duplicateCodes = new Set<string>();
  let prevCode = "";

  for (let i = 0; i < normalized.length; i++) {
    const code = String(normalized[i]!.code ?? "").trim();
    if (!code) continue;
    const line = i + 2;
    const isNewGroup = i === 0 || code !== prevCode;
    if (isNewGroup) {
      const firstLine = groupStartLines.get(code);
      if (firstLine !== undefined) {
        errors.push(`Dòng ${line} trùng dòng ${firstLine} (mã ${code})`);
        duplicateCodes.add(code);
      } else {
        groupStartLines.set(code, line);
      }
      prevCode = code;
    }
  }

  return { errors, duplicateCodes };
}

export function detectCodeDuplicatesInFile(
  rows: Record<string, string>[],
  codeKey: string,
): { errors: string[]; skipIndices: Set<number> } {
  return detectWithinFileDuplicates(
    rows,
    (row) => String(row[codeKey] ?? "").trim(),
    (_row, key) => `mã ${key}`,
  );
}

export function levelLabelFromImport(label: string): PreparedStandardLevel | null {
  const trimmed = label.trim();
  if (!trimmed) return null;
  const entry = Object.entries(PREPARED_STANDARD_LEVEL_LABELS).find(([, v]) => v === trimmed);
  if (entry) return entry[0] as PreparedStandardLevel;
  return null;
}
