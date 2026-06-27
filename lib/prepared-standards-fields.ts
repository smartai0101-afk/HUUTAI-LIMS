import type { PreparedStandardLevel } from "@prisma/client";

export const PREPARED_STANDARD_FORM_FIELD_KEYS = [
  "parentCode",
  "code",
  "name",
  "concentration",
  "concentrationUnit",
  "solventVolume",
  "solventUnit",
  "preparedDate",
  "expiryDate",
  "preparedBy",
  "level",
  "storageLocation",
  "storageCondition",
  "notes",
] as const;

export const PREPARED_STANDARD_LEVEL_TABS: {
  value: PreparedStandardLevel;
  label: string;
}[] = [
  { value: "RootPrepared", label: "Chuẩn gốc pha" },
  { value: "Intermediate1", label: "Chuẩn trung gian pha cấp 1" },
  { value: "Intermediate2", label: "Chuẩn trung gian pha cấp 2" },
  { value: "Intermediate3", label: "Chuẩn trung gian pha cấp 3" },
  { value: "WorkingPrepared", label: "Chuẩn làm việc" },
];

export const PREPARED_STANDARD_LEVEL_FILTER_ALL = "All" as const;

export type PreparedStandardLevelFilter =
  | typeof PREPARED_STANDARD_LEVEL_FILTER_ALL
  | PreparedStandardLevel;

export const PREPARED_STANDARD_LEVEL_FILTER_OPTIONS: {
  value: PreparedStandardLevelFilter;
  label: string;
}[] = [
  { value: PREPARED_STANDARD_LEVEL_FILTER_ALL, label: "Tất cả cấp chuẩn" },
  ...PREPARED_STANDARD_LEVEL_TABS,
];

export const PREPARED_STANDARD_LEVEL_LABELS: Record<PreparedStandardLevel, string> =
  Object.fromEntries(
    PREPARED_STANDARD_LEVEL_TABS.map((t) => [t.value, t.label]),
  ) as Record<PreparedStandardLevel, string>;

/** Cấp chuẩn liền trước — nguồn cho "Chuẩn gốc sử dụng" (trừ Chuẩn làm việc). */
export const PARENT_SOURCE_LEVEL: Record<
  PreparedStandardLevel,
  PreparedStandardLevel | "Standard" | null
> = {
  RootPrepared: "Standard",
  Intermediate1: "RootPrepared",
  Intermediate2: "Intermediate1",
  Intermediate3: "Intermediate2",
  WorkingPrepared: null,
};

/** Các cấp nguồn được phép khi pha Chuẩn làm việc — mỗi dòng chọn một cấp. */
export const WORKING_SOURCE_LEVELS: PreparedStandardLevel[] = [
  "RootPrepared",
  "Intermediate1",
  "Intermediate2",
  "Intermediate3",
];

export const PARENT_LEVEL_REQUIRED_MESSAGE: Record<
  PreparedStandardLevel,
  string | null
> = {
  RootPrepared: null,
  Intermediate1: "Chưa có Chuẩn gốc pha. Vui lòng tạo Chuẩn gốc pha trước.",
  Intermediate2:
    "Chưa có Chuẩn trung gian pha cấp 1. Vui lòng tạo cấp 1 trước.",
  Intermediate3:
    "Chưa có Chuẩn trung gian pha cấp 2. Vui lòng tạo cấp 2 trước.",
  WorkingPrepared:
    "Chưa có chuẩn pha chế nguồn. Vui lòng tạo ít nhất một chuẩn gốc pha hoặc chuẩn trung gian trước.",
};

export function usesStandardCatalog(level: PreparedStandardLevel): boolean {
  return PARENT_SOURCE_LEVEL[level] === "Standard";
}

export function usesMultiLevelSource(level: PreparedStandardLevel): boolean {
  return level === "WorkingPrepared";
}

export function getFixedParentSourceLevel(
  level: PreparedStandardLevel,
): PreparedStandardLevel | "Standard" | null {
  return PARENT_SOURCE_LEVEL[level];
}

export function formatComponentDropdownLabel(
  code: string,
  name: string,
  concentration: string,
  concentrationUnit: string,
  lot: string,
): string {
  const conc = [concentration, concentrationUnit].filter(Boolean).join(" ");
  const lotLabel = lot.trim() || "/";
  return `${code} - ${name} - ${conc || "/"} - ${lotLabel}`;
}

export function formatComponentLine(
  code: string,
  name: string,
  lot: string,
  quantityUsed: number,
  unit: string,
  concentration?: string,
  concentrationUnit?: string,
): string {
  const lotLabel = lot.trim() || "/";
  const qty = Number.isInteger(quantityUsed) ? String(quantityUsed) : String(quantityUsed);
  const unitSuffix = unit.trim() ? ` ${unit.trim()}` : "";
  const conc = [concentration, concentrationUnit].filter(Boolean).join(" ");
  const concPart = conc ? ` · ${conc}` : "";
  return `${code} · ${name}${concPart} · ${lotLabel} · ${qty}${unitSuffix}`;
}

export function formatSolventLine(
  code: string,
  name: string,
  lot: string,
  quantityUsed: number,
  unit: string,
): string {
  const lotLabel = lot.trim() || "/";
  const qty = Number.isInteger(quantityUsed) ? String(quantityUsed) : String(quantityUsed);
  const unitSuffix = unit.trim() ? ` ${unit.trim()}` : "";
  return `${code} · ${name} · ${lotLabel} · ${qty}${unitSuffix}`;
}

export function buildPreparedStandardExportRows(
  items: import("@/types").PreparedStandardView[],
): Array<Record<string, string | number>> {
  const rows: Array<Record<string, string | number>> = [];
  items.forEach((item, index) => {
    const maxRows = Math.max(item.components.length, item.solvents.length, 1);
    for (let i = 0; i < maxRows; i += 1) {
      const comp = item.components[i];
      const sol = item.solvents[i];
      rows.push({
        STT: i === 0 ? index + 1 : "",
        "Cấp chuẩn": i === 0 ? item.levelLabel : "",
        "Mã chuẩn pha chế": i === 0 ? item.code : "",
        "Tên chuẩn pha chế": i === 0 ? item.name : "",
        "Nồng độ": i === 0 ? item.concentration : "",
        "Đơn vị nồng độ": i === 0 ? item.concentrationUnit : "",
        "Thể tích/Khối lượng dung môi định mức": i === 0 ? item.solventVolume : "",
        "Đơn vị dung môi": i === 0 ? item.solventUnit : "",
        "Ngày pha chế": i === 0 ? item.preparedDate : "",
        "Ngày hết hạn pha chế": i === 0 ? item.expiryDate : "",
        "Người pha": i === 0 ? item.preparedBy : "",
        "Trạng thái": i === 0 ? item.status : "",
        "Trạng thái quy trình": i === 0 ? item.workflowStatusLabel : "",
        "Vị trí lưu": i === 0 ? item.storageLocation : "",
        "Điều kiện bảo quản": i === 0 ? item.storageCondition : "",
        "Ghi chú": i === 0 ? item.notes : "",
        "Mã chuẩn gốc": comp?.standardCode ?? "",
        "Tên chuẩn gốc": comp?.standardName ?? "",
        "Hãng SX chuẩn gốc": comp?.manufacturer ?? "",
        "Product code chuẩn gốc": comp?.productCode ?? "",
        "Lot chuẩn gốc": comp?.lotNumber ?? "",
        "Purity chuẩn gốc": comp?.purity ?? "",
        "Nồng độ nguồn": comp?.concentration ?? "",
        "ĐVT nồng độ nguồn": comp?.concentrationUnit ?? "",
        "Cấp nguồn": comp?.levelLabel ?? "",
        "Ngày pha nguồn": comp?.preparedDate ?? "",
        "Hạn dùng nguồn": comp?.expiryDate ?? "",
        "Loại nguồn": comp?.sourceType === "Standard" ? "Chất chuẩn gốc" : "Chuẩn pha chế",
        "Lượng chuẩn gốc sử dụng": comp ? `${comp.quantityUsed} ${comp.unit}`.trim() : "",
        "Mã hóa chất gốc": sol?.chemicalCode ?? "",
        "Tên hóa chất gốc": sol?.chemicalName ?? "",
        "CAS/Product code dung môi": sol?.casProductCode ?? "",
        "Lot dung môi": sol?.lotNumber ?? "",
        "Lượng dung môi sử dụng": sol ? `${sol.quantityUsed} ${sol.unit}`.trim() : "",
      });
    }
  });
  return rows;
}
