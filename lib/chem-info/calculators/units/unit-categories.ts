export const UNIT_CATEGORIES = [
  "MASS",
  "VOLUME",
  "CONCENTRATION_MOLAR",
  "CONCENTRATION_MASS",
  "CONCENTRATION_BRIDGE",
  "PERCENT",
  "PPM_PPB",
  "AMOUNT",
  "NORMALITY_MOLALITY",
  "MASS_VOLUME",
  "TEMPERATURE",
  "PRESSURE",
  "DENSITY",
  "CONDUCTIVITY",
  "FLOW_RATE",
  "TIME",
  "CENTRIFUGATION",
] as const;

export type UnitCategory = (typeof UNIT_CATEGORIES)[number];

export const UNIT_CATEGORY_LABELS: Record<UnitCategory, string> = {
  MASS: "Khối lượng",
  VOLUME: "Thể tích",
  CONCENTRATION_MOLAR: "Nồng độ mol",
  CONCENTRATION_MASS: "Nồng độ khối lượng",
  CONCENTRATION_BRIDGE: "Quy đổi mol ↔ khối lượng",
  PERCENT: "Phần trăm",
  PPM_PPB: "ppm / ppb",
  AMOUNT: "Lượng chất",
  NORMALITY_MOLALITY: "Normality / Molality",
  MASS_VOLUME: "Khối lượng ↔ thể tích",
  TEMPERATURE: "Nhiệt độ",
  PRESSURE: "Áp suất",
  DENSITY: "Mật độ",
  CONDUCTIVITY: "Độ dẫn điện",
  FLOW_RATE: "Lưu lượng HPLC/GC",
  TIME: "Thời gian",
  CENTRIFUGATION: "Ly tâm",
};

/** Categories shown in UI by default (Phase 1 + bridge + Phase 2). */
export const UI_UNIT_CATEGORIES: UnitCategory[] = [
  "MASS",
  "VOLUME",
  "CONCENTRATION_MOLAR",
  "CONCENTRATION_MASS",
  "CONCENTRATION_BRIDGE",
  "PERCENT",
  "PPM_PPB",
  "AMOUNT",
  "NORMALITY_MOLALITY",
  "MASS_VOLUME",
  "TEMPERATURE",
  "PRESSURE",
  "DENSITY",
  "CONDUCTIVITY",
  "FLOW_RATE",
  "TIME",
  "CENTRIFUGATION",
];

export type UnitCategoryOption = {
  code: UnitCategory;
  label: string;
};

export function getUnitCategories(): UnitCategoryOption[] {
  return UI_UNIT_CATEGORIES.map((code) => ({
    code,
    label: UNIT_CATEGORY_LABELS[code],
  }));
}
