export const DEFAULT_CHEMICAL_GROUPS = ["Dung môi", "Acid", "Base", "Muối", "Thuốc BVTV"] as const;

export const CHEMICAL_GROUP_FILTER_ALL = "All" as const;

export type ChemicalGroupFilter =
  | typeof CHEMICAL_GROUP_FILTER_ALL
  | (typeof DEFAULT_CHEMICAL_GROUPS)[number];

export const CHEMICAL_GROUP_FILTER_OPTIONS: {
  value: ChemicalGroupFilter;
  label: string;
}[] = [
  { value: CHEMICAL_GROUP_FILTER_ALL, label: "Tất cả nhóm" },
  ...DEFAULT_CHEMICAL_GROUPS.map((group) => ({ value: group, label: group })),
];

export const CHEMICAL_FORM_FIELD_KEYS = [
  "code",
  "name",
  "chemicalGroup",
  "manufacturer",
  "casNumber",
  "productCode",
  "lot",
  "purity",
  "uncertainty",
  "unit",
  "quantity",
  "expiryDate",
  "storageCondition",
  "storageLocation",
  "notes",
  "coaPath",
] as const;

export const CHEMICAL_CSV_FIELD_KEYS = [
  "code",
  "name",
  "chemicalGroup",
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
  "storageCondition",
  "status",
  "storageLocation",
  "notes",
] as const;

export const CHEMICAL_EXCEL_COLUMNS = [
  { key: "code", header: "Mã hóa chất" },
  { key: "name", header: "Tên hóa chất" },
  { key: "chemicalGroup", header: "Nhóm hóa chất" },
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
  { key: "storageCondition", header: "Điều kiện bảo quản" },
  { key: "status", header: "Trạng thái" },
  { key: "storageLocation", header: "Vị trí lưu" },
  { key: "notes", header: "Ghi chú" },
] as const;

export const CHEMICAL_CATALOG_MASTER_KEYS = [
  "code",
  "name",
  "chemicalGroup",
  "manufacturer",
  "casNumber",
  "productCode",
] as const;

export const CHEMICAL_IMPORT_COLUMN_MAP: Record<string, string> = Object.fromEntries(
  CHEMICAL_EXCEL_COLUMNS.map((c) => [c.header, c.key]),
);

export function formatCasProductSnapshot(casNumber: string, productCode: string): string {
  return [casNumber, productCode].filter(Boolean).join(" / ");
}
