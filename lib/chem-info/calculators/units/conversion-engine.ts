import type { ConversionContext } from "./conversion-context";
import {
  convertDirect,
  tryBridgeConversion,
  validateConversion,
  type UnitConvertResult,
  type ValidationResult,
} from "./bridge-rules";
import type { UnitCategory } from "./unit-categories";
import { getUnitCategories } from "./unit-categories";
import {
  getUnitsByCategory,
  getUnitLabelsByCategory,
  resolveUnit,
  UNIT_OPTIONS,
  type UnitDefinition,
} from "./unit-definitions";

export type UnitConvertInput = {
  value: number;
  from: string;
  to: string;
  molecularWeight?: number;
  context?: ConversionContext;
};

export type { UnitConvertResult, ValidationResult, ConversionContext, UnitDefinition, UnitCategory };

export function buildContext(input: UnitConvertInput): ConversionContext {
  return {
    molecularWeight: input.context?.molecularWeight ?? input.molecularWeight,
    density: input.context?.density,
    rotorRadiusCm: input.context?.rotorRadiusCm,
  };
}

export function convertUnits(input: UnitConvertInput): UnitConvertResult {
  const { value, from, to } = input;
  if (Number.isNaN(value)) return { ok: false, error: "Giá trị không hợp lệ" };
  if (!(value >= 0)) return { ok: false, error: "Giá trị phải ≥ 0" };

  const fromUnit = resolveUnit(from);
  const toUnit = resolveUnit(to);
  if (!fromUnit || !toUnit) {
    return { ok: false, error: "Đơn vị không hợp lệ." };
  }

  if (fromUnit.label === toUnit.label) {
    return { ok: true, result: value, formula: `${value} ${from} = ${value} ${to}` };
  }

  const context = buildContext(input);
  const validation = validateConversion(from, to);

  if (validation.requiresContext.includes("molecularWeight") && !(context.molecularWeight && context.molecularWeight > 0)) {
    return { ok: false, error: "Quy đổi nồng độ mol ↔ khối lượng cần khối lượng mol (g/mol)." };
  }
  if (validation.requiresContext.includes("density") && !(context.density && context.density > 0)) {
    if (
      (fromUnit.baseUnit === "G" && toUnit.baseUnit === "L") ||
      (fromUnit.baseUnit === "L" && toUnit.baseUnit === "G")
    ) {
      return {
        ok: false,
        error: "Không thể quy đổi khối lượng sang thể tích mà không có mật độ (g/mL).",
      };
    }
    return { ok: false, error: "Quy đổi % w/w sang mg/mL cần mật độ dung dịch (g/mL)." };
  }
  if (validation.requiresContext.includes("rotorRadius") && !(context.rotorRadiusCm && context.rotorRadiusCm > 0)) {
    return { ok: false, error: "Quy đổi rpm ↔ RCF cần bán kính rotor (cm)." };
  }

  const bridge = tryBridgeConversion(value, fromUnit, toUnit, context);
  if (bridge) return bridge;

  const direct = convertDirect(value, fromUnit, toUnit);
  if (direct) return direct;

  if (fromUnit.baseUnit !== toUnit.baseUnit) {
    return {
      ok: false,
      error: `Không thể quy đổi trực tiếp giữa ${fromUnit.label} và ${toUnit.label} — khác nhóm đơn vị.`,
    };
  }

  return { ok: false, error: "Không hỗ trợ cặp đơn vị này." };
}

export { getUnitCategories, getUnitsByCategory, getUnitLabelsByCategory, resolveUnit, UNIT_OPTIONS, validateConversion };

/** @deprecated Use UnitCategory from unit-categories */
export type LegacyUnitCategory = "mass" | "volume" | "concentration_molar" | "concentration_mass";
