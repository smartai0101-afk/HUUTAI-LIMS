export const DEFAULT_STANDARD_GROUPS = ["CRM", "RM", "Working"] as const;

export const STANDARD_GROUP_FILTER_ALL = "All" as const;

export type StandardGroupFilter =
  | typeof STANDARD_GROUP_FILTER_ALL
  | (typeof DEFAULT_STANDARD_GROUPS)[number];

export const STANDARD_GROUP_FILTER_OPTIONS: {
  value: StandardGroupFilter;
  label: string;
}[] = [
  { value: STANDARD_GROUP_FILTER_ALL, label: "Tất cả nhóm chuẩn" },
  ...DEFAULT_STANDARD_GROUPS.map((group) => ({ value: group, label: group })),
];

export const STANDARD_FORM_FIELD_KEYS = [
  "code",
  "name",
  "standardGroup",
  "manufacturer",
  "casNumber",
  "productCode",
  "lot",
  "purity",
  "uncertainty",
  "unit",
  "quantity",
  "expiryDate",
  "afterOpenExpiry",
  "storageCondition",
  "storageLocation",
  "notes",
  "coaPath",
] as const;

export const STANDARD_PRISMA_FIELD_KEYS = [
  ...STANDARD_FORM_FIELD_KEYS,
  "status",
] as const;

export const STANDARD_CSV_FIELD_KEYS = [
  "code",
  "name",
  "standardGroup",
  "manufacturer",
  "casNumber",
  "productCode",
  "lot",
  "purity",
  "uncertainty",
  "coaPath",
  "unit",
  "quantity",
  "expiryDate",
  "afterOpenExpiry",
  "storageCondition",
  "status",
  "storageLocation",
  "notes",
] as const;

export const STANDARD_EXCEL_COLUMNS = [
  { key: "code", header: "Mã chuẩn" },
  { key: "name", header: "Tên chuẩn" },
  { key: "standardGroup", header: "Nhóm chuẩn" },
  { key: "manufacturer", header: "Hãng sản xuất" },
  { key: "casNumber", header: "CAS Number" },
  { key: "productCode", header: "Product Code" },
  { key: "lot", header: "Lot Number" },
  { key: "purity", header: "Purity" },
  { key: "uncertainty", header: "Uncertainty" },
  { key: "coaPath", header: "COA" },
  { key: "unit", header: "Đơn vị" },
  { key: "quantity", header: "Số lượng tồn kho" },
  { key: "expiryDate", header: "Hạn dùng" },
  { key: "afterOpenExpiry", header: "Hạn sau mở nắp" },
  { key: "storageCondition", header: "Điều kiện bảo quản" },
  { key: "status", header: "Trạng thái" },
  { key: "storageLocation", header: "Vị trí lưu" },
  { key: "notes", header: "Ghi chú" },
] as const;

export const STANDARD_CATALOG_MASTER_KEYS = [
  "code",
  "name",
  "standardGroup",
  "manufacturer",
  "casNumber",
  "productCode",
] as const;

export const STANDARD_IMPORT_COLUMN_MAP: Record<string, string> = Object.fromEntries(
  STANDARD_EXCEL_COLUMNS.map((c) => [c.header, c.key]),
);
