export type { ContextField, ConversionContext } from "./conversion-context";
export {
  convertUnits,
  buildContext,
  getUnitCategories,
  getUnitsByCategory,
  getUnitLabelsByCategory,
  resolveUnit,
  validateConversion,
  UNIT_OPTIONS,
} from "./conversion-engine";
export type {
  UnitConvertInput,
  UnitConvertResult,
  ValidationResult,
  UnitDefinition,
  UnitCategory,
  LegacyUnitCategory,
} from "./conversion-engine";
export { UNIT_CATEGORIES, UNIT_CATEGORY_LABELS, UI_UNIT_CATEGORIES } from "./unit-categories";
export type { UnitCategoryOption } from "./unit-categories";
export { UNIT_DEFINITIONS } from "./unit-definitions";
