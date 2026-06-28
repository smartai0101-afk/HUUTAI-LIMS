export type {
  UnitConvertInput,
  UnitConvertResult,
  ValidationResult,
  ConversionContext,
  UnitDefinition,
  UnitCategory,
  LegacyUnitCategory,
} from "./units/index";
export {
  convertUnits,
  validateConversion,
  getUnitCategories,
  getUnitsByCategory,
  getUnitLabelsByCategory,
  UNIT_OPTIONS,
} from "./units/index";

/** @deprecated Use UnitCategory from units module */
export type UnitCategoryLegacy = "mass" | "volume" | "concentration_molar" | "concentration_mass";
