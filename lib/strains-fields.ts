export const DEFAULT_STRAIN_GROUPS = ["Vi khuẩn", "Nấm men", "Nấm mốc", "Chủng chuẩn", "Chủng nội bộ"] as const;

export const STRAIN_GROUP_FILTER_ALL = "All" as const;

export type StrainGroupFilter =
  | typeof STRAIN_GROUP_FILTER_ALL
  | (typeof DEFAULT_STRAIN_GROUPS)[number];

export const STRAIN_GROUP_FILTER_OPTIONS: {
  value: StrainGroupFilter;
  label: string;
}[] = [
  { value: STRAIN_GROUP_FILTER_ALL, label: "Tất cả nhóm" },
  ...DEFAULT_STRAIN_GROUPS.map((group) => ({ value: group, label: group })),
];

export const STRAIN_FORM_FIELD_KEYS = [
  "code",
  "name",
  "strainGroup",
  "manufacturer",
  "atccProductCode",
  "lot",
  "purity",
  "uncertainty",
  "unit",
  "quantity",
  "expiryDate",
  "storageCondition",
  "storageLocation",
  "coaPath",
] as const;

export const STRAIN_EXCEL_COLUMNS = [
  { key: "code", header: "Mã" },
  { key: "name", header: "Tên chủng" },
  { key: "strainGroup", header: "Nhóm chủng" },
  { key: "manufacturer", header: "Hãng/Nguồn cung cấp" },
  { key: "atccProductCode", header: "Mã ATCC / PRODUCT CODE" },
  { key: "lot", header: "Lot Number" },
  { key: "purity", header: "Purity" },
  { key: "uncertainty", header: "Uncertainty" },
  { key: "coaPath", header: "COA" },
  { key: "unit", header: "ĐVT" },
  { key: "quantity", header: "Số lượng" },
  { key: "expiryDate", header: "Ngày hết hạn" },
  { key: "storageCondition", header: "Điều kiện bảo quản" },
  { key: "status", header: "Trạng thái" },
  { key: "storageLocation", header: "Vị trí lưu" },
] as const;

export const STRAIN_CATALOG_MASTER_KEYS = [
  "code",
  "name",
  "strainGroup",
  "manufacturer",
  "atccProductCode",
] as const;

export const STRAIN_IMPORT_COLUMN_MAP: Record<string, string> = Object.fromEntries(
  STRAIN_EXCEL_COLUMNS.map((c) => [c.header, c.key]),
);
