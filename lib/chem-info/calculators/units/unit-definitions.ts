import type { UnitCategory } from "./unit-categories";

export type UnitDefinition = {
  code: string;
  label: string;
  category: UnitCategory;
  factorToBase: number;
  baseUnit: string;
  precision: number;
  aliases?: string[];
};

function def(
  code: string,
  label: string,
  category: UnitCategory,
  factorToBase: number,
  baseUnit: string,
  precision = 6,
  aliases?: string[],
): UnitDefinition {
  return { code, label, category, factorToBase, baseUnit, precision, aliases };
}

const CORE_DEFINITIONS: UnitDefinition[] = [
  // MASS (base: G)
  def("KG", "kg", "MASS", 1000, "G", 6),
  def("G", "g", "MASS", 1, "G"),
  def("MG", "mg", "MASS", 0.001, "G"),
  def("UG", "µg", "MASS", 1e-6, "G", 6, ["ug", "μg", "mcg"]),
  def("NG", "ng", "MASS", 1e-9, "G"),

  // VOLUME (base: L)
  def("L", "L", "VOLUME", 1, "L"),
  def("ML", "mL", "VOLUME", 0.001, "L", 6, ["ml"]),
  def("UL", "µL", "VOLUME", 1e-6, "L", 6, ["uL", "μL", "ul"]),
  def("NL", "nL", "VOLUME", 1e-9, "L", 6, ["nl"]),
  def("CM3", "cm³", "VOLUME", 0.001, "L", 6, ["cm3", "cm^3"]),
  def("CC", "cc", "VOLUME", 0.001, "L"),

  // CONCENTRATION_MOLAR (base: MOL_PER_L)
  def("M", "M", "CONCENTRATION_MOLAR", 1, "MOL_PER_L", 6, ["mol/L"]),
  def("MM", "mM", "CONCENTRATION_MOLAR", 1e-3, "MOL_PER_L", 6, ["mmol/L"]),
  def("UM", "µM", "CONCENTRATION_MOLAR", 1e-6, "MOL_PER_L", 6, ["uM", "μM"]),
  def("NM", "nM", "CONCENTRATION_MOLAR", 1e-9, "MOL_PER_L", 6),
  def("MOL_L", "mol/L", "CONCENTRATION_MOLAR", 1, "MOL_PER_L"),
  def("MMOL_L", "mmol/L", "CONCENTRATION_MOLAR", 1e-3, "MOL_PER_L"),
  def("UMOL_L", "µmol/L", "CONCENTRATION_MOLAR", 1e-6, "MOL_PER_L", 6, ["umol/L"]),

  // CONCENTRATION_MASS (base: G_PER_L)
  def("G_L", "g/L", "CONCENTRATION_MASS", 1, "G_PER_L"),
  def("MG_L", "mg/L", "CONCENTRATION_MASS", 1e-3, "G_PER_L"),
  def("UG_L", "µg/L", "CONCENTRATION_MASS", 1e-6, "G_PER_L", 6, ["ug/L"]),
  def("NG_L", "ng/L", "CONCENTRATION_MASS", 1e-9, "G_PER_L"),
  def("MG_ML", "mg/mL", "CONCENTRATION_MASS", 1, "G_PER_L"),
  def("UG_ML", "µg/mL", "CONCENTRATION_MASS", 1e-3, "G_PER_L", 6, ["ug/mL"]),
  def("NG_ML", "ng/mL", "CONCENTRATION_MASS", 1e-6, "G_PER_L"),

  // PERCENT
  def("PCT_WW", "% w/w", "PERCENT", 1, "PCT_WW", 6, ["%w/w"]),
  def("PCT_WV", "% w/v", "PERCENT", 1, "PCT_WV", 6, ["%w/v"]),
  def("PCT_VV", "% v/v", "PERCENT", 1, "PCT_VV", 6, ["%v/v"]),

  // PPM_PPB (base: PPM)
  def("PPM", "ppm", "PPM_PPB", 1, "PPM"),
  def("PPB", "ppb", "PPM_PPB", 1e-3, "PPM"),
  def("PPT", "ppt", "PPM_PPB", 1e-6, "PPM"),

  // AMOUNT (base: MOL)
  def("MOL", "mol", "AMOUNT", 1, "MOL"),
  def("MMOL", "mmol", "AMOUNT", 1e-3, "MOL"),
  def("UMOL", "µmol", "AMOUNT", 1e-6, "MOL", 6, ["umol"]),
  def("NMOL", "nmol", "AMOUNT", 1e-9, "MOL"),

  // NORMALITY_MOLALITY
  def("N", "N", "NORMALITY_MOLALITY", 1, "NORMALITY"),
  def("MOL_KG", "mol/kg", "NORMALITY_MOLALITY", 1, "MOLALITY"),

  // TEMPERATURE (formula-based)
  def("CELSIUS", "°C", "TEMPERATURE", 1, "K", 2, ["C"]),
  def("KELVIN", "K", "TEMPERATURE", 1, "K"),
  def("FAHRENHEIT", "°F", "TEMPERATURE", 1, "K", 2, ["F"]),

  // PRESSURE (base: PA)
  def("PA", "Pa", "PRESSURE", 1, "PA"),
  def("KPA", "kPa", "PRESSURE", 1000, "PA"),
  def("BAR", "bar", "PRESSURE", 1e5, "PA"),
  def("MBAR", "mbar", "PRESSURE", 100, "PA"),
  def("PSI", "psi", "PRESSURE", 6894.76, "PA"),
  def("ATM", "atm", "PRESSURE", 101325, "PA"),
  def("MMHG", "mmHg", "PRESSURE", 133.322, "PA"),

  // DENSITY (base: G_PER_ML)
  def("G_ML", "g/mL", "DENSITY", 1, "G_PER_ML"),
  def("G_CM3", "g/cm³", "DENSITY", 1, "G_PER_ML", 6, ["g/cm3"]),
  def("KG_M3", "kg/m³", "DENSITY", 0.001, "G_PER_ML", 6, ["kg/m3"]),

  // CONDUCTIVITY (base: S_PER_M)
  def("US_CM", "µS/cm", "CONDUCTIVITY", 1e-4, "S_PER_M", 6, ["uS/cm"]),
  def("MS_CM", "mS/cm", "CONDUCTIVITY", 0.1, "S_PER_M"),
  def("S_M", "S/m", "CONDUCTIVITY", 1, "S_PER_M"),

  // FLOW_RATE (base: ML_PER_MIN)
  def("ML_MIN", "mL/min", "FLOW_RATE", 1, "ML_PER_MIN"),
  def("UL_MIN", "µL/min", "FLOW_RATE", 0.001, "ML_PER_MIN", 6, ["uL/min"]),
  def("L_H", "L/h", "FLOW_RATE", 1000 / 60, "ML_PER_MIN"),

  // TIME (base: S)
  def("S", "s", "TIME", 1, "S"),
  def("MIN", "min", "TIME", 60, "S"),
  def("H", "h", "TIME", 3600, "S"),
  def("DAY", "day", "TIME", 86400, "S"),

  // CENTRIFUGATION
  def("RPM", "rpm", "CENTRIFUGATION", 1, "RPM"),
  def("RCF", "RCF", "CENTRIFUGATION", 1, "RCF", 0, ["×g", "xg"]),
];

function cloneForCategory(
  source: UnitDefinition,
  category: UnitCategory,
  codeSuffix: string,
): UnitDefinition {
  return {
    ...source,
    code: `${source.code}_${codeSuffix}`,
    category,
  };
}

function buildCompositeCategory(
  category: UnitCategory,
  labels: string[],
  suffix: string,
): UnitDefinition[] {
  const byLabel = new Map(CORE_DEFINITIONS.map((u) => [u.label, u]));
  return labels
    .map((label) => byLabel.get(label))
    .filter((u): u is UnitDefinition => Boolean(u))
    .map((u) => cloneForCategory(u, category, suffix));
}

const COMPOSITE_DEFINITIONS: UnitDefinition[] = [
  ...buildCompositeCategory(
    "CONCENTRATION_BRIDGE",
    ["M", "mM", "µM", "nM", "mol/L", "mmol/L", "µmol/L", "g/L", "mg/L", "µg/L", "ng/L", "mg/mL", "µg/mL", "ng/mL"],
    "BRIDGE",
  ),
  ...buildCompositeCategory(
    "MASS_VOLUME",
    ["kg", "g", "mg", "µg", "ng", "L", "mL", "µL", "nL", "cm³", "cc"],
    "MV",
  ),
  ...buildCompositeCategory("PERCENT", ["mg/mL", "g/L"], "PCT"),
  ...buildCompositeCategory("PPM_PPB", ["mg/L", "µg/L"], "PPM"),
];

export const UNIT_DEFINITIONS: UnitDefinition[] = [...CORE_DEFINITIONS, ...COMPOSITE_DEFINITIONS];

const lookupMap = new Map<string, UnitDefinition>();

function normalizeToken(raw: string): string {
  return raw
    .trim()
    .replace(/\u00b5|\u03bc/g, "u")
    .toLowerCase()
    .replace(/\s+/g, "");
}

for (const unit of CORE_DEFINITIONS) {
  lookupMap.set(normalizeToken(unit.label), unit);
  lookupMap.set(normalizeToken(unit.code), unit);
  for (const alias of unit.aliases ?? []) {
    lookupMap.set(normalizeToken(alias), unit);
  }
}

export function resolveUnit(input: string): UnitDefinition | null {
  return lookupMap.get(normalizeToken(input)) ?? null;
}

export function getUnitsByCategory(category: UnitCategory): UnitDefinition[] {
  const seen = new Set<string>();
  const result: UnitDefinition[] = [];
  for (const unit of UNIT_DEFINITIONS) {
    if (unit.category !== category) continue;
    if (seen.has(unit.label)) continue;
    seen.add(unit.label);
    result.push(unit);
  }
  return result;
}

export function getUnitLabelsByCategory(category: UnitCategory): string[] {
  return getUnitsByCategory(category).map((u) => u.label);
}

/** Legacy UNIT_OPTIONS shape for backward compatibility. */
export const UNIT_OPTIONS = {
  mass: getUnitLabelsByCategory("MASS"),
  volume: getUnitLabelsByCategory("VOLUME"),
  concentration: [
    ...getUnitLabelsByCategory("CONCENTRATION_MOLAR"),
    ...getUnitLabelsByCategory("CONCENTRATION_MASS"),
    "% w/v",
  ],
} as const;
