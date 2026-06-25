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
