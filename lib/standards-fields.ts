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
