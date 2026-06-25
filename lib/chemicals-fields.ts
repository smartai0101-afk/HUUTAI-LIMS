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

export function formatCasProductSnapshot(casNumber: string, productCode: string): string {
  return [casNumber, productCode].filter(Boolean).join(" / ");
}
