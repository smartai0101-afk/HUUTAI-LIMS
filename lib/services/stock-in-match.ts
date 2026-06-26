import type { StockInSourceType } from "@prisma/client";

export function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeLot(value: string): string {
  return value.trim();
}

export function lotsMatch(a: string, b: string): boolean {
  return normalizeKey(a) === normalizeKey(b);
}

function optionalFieldMatches(a: string, b: string): boolean {
  const left = normalizeKey(a);
  const right = normalizeKey(b);
  if (!left && !right) return true;
  if (left && right) return left === right;
  return false;
}

export type ChemicalIdentity = {
  name: string;
  casNumber: string;
  manufacturer: string;
  productCode: string;
};

export type StandardIdentity = {
  name: string;
  manufacturer: string;
  productCode: string;
};

export type StrainIdentity = {
  name: string;
  atccProductCode: string;
  manufacturer: string;
};

export function chemicalIdentityMatches(
  record: ChemicalIdentity,
  input: ChemicalIdentity,
): boolean {
  return (
    normalizeKey(record.name) === normalizeKey(input.name) &&
    normalizeKey(record.casNumber) === normalizeKey(input.casNumber) &&
    normalizeKey(record.manufacturer) === normalizeKey(input.manufacturer) &&
    optionalFieldMatches(record.productCode, input.productCode)
  );
}

export function standardIdentityMatches(
  record: StandardIdentity,
  input: StandardIdentity,
): boolean {
  return (
    normalizeKey(record.name) === normalizeKey(input.name) &&
    normalizeKey(record.manufacturer) === normalizeKey(input.manufacturer) &&
    optionalFieldMatches(record.productCode, input.productCode)
  );
}

export function strainIdentityMatches(record: StrainIdentity, input: StrainIdentity): boolean {
  return (
    normalizeKey(record.name) === normalizeKey(input.name) &&
    normalizeKey(record.atccProductCode) === normalizeKey(input.atccProductCode) &&
    normalizeKey(record.manufacturer) === normalizeKey(input.manufacturer)
  );
}

export function codesMatch(a: string, b: string): boolean {
  return normalizeKey(a) === normalizeKey(b);
}

export function existingCodeIdentityMismatchMessage(
  sourceType: StockInSourceType,
  code: string,
): string {
  if (sourceType === "Chemical") {
    return `Mã ${code} đã tồn tại — không khớp tên/hãng/CAS/product code`;
  }
  if (sourceType === "Standard") {
    return `Mã ${code} đã tồn tại — không khớp tên/hãng/product code`;
  }
  return `Mã ${code} đã tồn tại — không khớp tên/hãng/ATCC product code`;
}

export function identityCodeMismatchMessage(
  sourceType: StockInSourceType,
  existingCode: string,
): string {
  if (sourceType === "Chemical") {
    return `Hóa chất với cùng tên, hãng sản xuất, CAS và Product Code đã có mã ${existingCode}. Vui lòng dùng mã này.`;
  }
  if (sourceType === "Standard") {
    return `Chất chuẩn với cùng tên, hãng sản xuất và Product Code đã có mã ${existingCode}. Vui lòng dùng mã này.`;
  }
  return `Chủng với cùng tên, hãng sản xuất và ATCC/Product Code đã có mã ${existingCode}. Vui lòng dùng mã này.`;
}

export function findChemicalByIdentity<T extends ChemicalIdentity>(records: T[], input: ChemicalIdentity): T | undefined {
  return records.find((row) => chemicalIdentityMatches(row, input));
}

export function findStandardByIdentity<T extends StandardIdentity>(records: T[], input: StandardIdentity): T | undefined {
  return records.find((row) => standardIdentityMatches(row, input));
}

export function findStrainByIdentity<T extends StrainIdentity>(records: T[], input: StrainIdentity): T | undefined {
  return records.find((row) => strainIdentityMatches(row, input));
}

export function stockInSourceLabel(sourceType: StockInSourceType): string {
  switch (sourceType) {
    case "Chemical":
      return "Hoá chất gốc";
    case "Standard":
      return "Chất chuẩn gốc";
    case "MicrobialStrain":
      return "Chủng gốc vi sinh";
    default:
      return sourceType;
  }
}

export function parseStockInSourceType(value: string): StockInSourceType | null {
  if (value === "Chemical" || value === "Standard" || value === "MicrobialStrain") {
    return value;
  }
  return null;
}

export function toInventorySourceType(sourceType: StockInSourceType) {
  return sourceType;
}
