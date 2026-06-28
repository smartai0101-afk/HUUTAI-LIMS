import type { ContextField, ConversionContext } from "./conversion-context";
import type { UnitDefinition } from "./unit-definitions";
import { resolveUnit } from "./unit-definitions";

export type UnitConvertResult =
  | { ok: true; result: number; formula: string }
  | { ok: false; error: string };

export type ValidationResult = {
  valid: boolean;
  requiresContext: ContextField[];
  message?: string;
};

const MOLAR_BASE = "MOL_PER_L";
const MASS_CONC_BASE = "G_PER_L";
const MASS_BASE = "G";
const VOLUME_BASE = "L";

function round(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function toBaseValue(value: number, unit: UnitDefinition): number {
  return value * unit.factorToBase;
}

function fromBaseValue(base: number, unit: UnitDefinition): number {
  return base / unit.factorToBase;
}

function isMolarUnit(unit: UnitDefinition): boolean {
  return unit.baseUnit === MOLAR_BASE;
}

function isMassConcUnit(unit: UnitDefinition): boolean {
  return unit.baseUnit === MASS_CONC_BASE;
}

function isMassUnit(unit: UnitDefinition): boolean {
  return unit.baseUnit === MASS_BASE;
}

function isVolumeUnit(unit: UnitDefinition): boolean {
  return unit.baseUnit === VOLUME_BASE;
}

function isPercentWv(unit: UnitDefinition): boolean {
  return unit.baseUnit === "PCT_WV";
}

function isPercentWw(unit: UnitDefinition): boolean {
  return unit.baseUnit === "PCT_WW";
}

function convertTemperature(value: number, from: UnitDefinition, to: UnitDefinition): number | null {
  let kelvin: number;
  if (from.label === "°C") kelvin = value + 273.15;
  else if (from.label === "K") kelvin = value;
  else if (from.label === "°F") kelvin = ((value - 32) * 5) / 9 + 273.15;
  else return null;

  if (to.label === "°C") return kelvin - 273.15;
  if (to.label === "K") return kelvin;
  if (to.label === "°F") return ((kelvin - 273.15) * 9) / 5 + 32;
  return null;
}

function convertCentrifugation(
  value: number,
  from: UnitDefinition,
  to: UnitDefinition,
  context: ConversionContext,
): UnitConvertResult | null {
  const r = context.rotorRadiusCm;
  if (!r || r <= 0) {
    return {
      ok: false,
      error: "Quy đổi rpm ↔ RCF cần bán kính rotor (cm).",
    };
  }

  const k = 1.118e-5 * r;

  if (from.label === "rpm" && to.label === "RCF") {
    const rcf = k * value * value;
    return {
      ok: true,
      result: round(rcf, 0),
      formula: `RCF = 1.118×10⁻⁵ × r × rpm² = 1.118×10⁻⁵ × ${r} × ${value}²`,
    };
  }

  if (from.label === "RCF" && to.label === "rpm") {
    const rpm = Math.sqrt(value / k);
    return {
      ok: true,
      result: round(rpm, 2),
      formula: `rpm = √(RCF / (1.118×10⁻⁵ × r)) = √(${value} / (1.118×10⁻⁵ × ${r}))`,
    };
  }

  return null;
}

function convertMassVolume(
  value: number,
  from: UnitDefinition,
  to: UnitDefinition,
  context: ConversionContext,
): UnitConvertResult | null {
  const density = context.density;
  if (!density || density <= 0) {
    return {
      ok: false,
      error: "Không thể quy đổi khối lượng sang thể tích mà không có mật độ (g/mL).",
    };
  }

  if (isMassUnit(from) && isVolumeUnit(to)) {
    const grams = toBaseValue(value, from);
    const liters = grams / (density * 1000);
    const result = fromBaseValue(liters, to);
    return {
      ok: true,
      result: round(result, to.precision),
      formula: `${value} ${from.label} → ${grams} g → ${liters} L (ρ=${density} g/mL) → ${result} ${to.label}`,
    };
  }

  if (isVolumeUnit(from) && isMassUnit(to)) {
    const liters = toBaseValue(value, from);
    const grams = liters * density * 1000;
    const result = fromBaseValue(grams, to);
    return {
      ok: true,
      result: round(result, to.precision),
      formula: `${value} ${from.label} → ${liters} L (ρ=${density} g/mL) → ${grams} g → ${result} ${to.label}`,
    };
  }

  return null;
}

function convertMolarMassConc(
  value: number,
  from: UnitDefinition,
  to: UnitDefinition,
  context: ConversionContext,
): UnitConvertResult | null {
  const mw = context.molecularWeight;
  if (!mw || mw <= 0) {
    return {
      ok: false,
      error: "Quy đổi nồng độ mol ↔ khối lượng cần khối lượng mol (g/mol).",
    };
  }

  if (isMolarUnit(from) && isMassConcUnit(to)) {
    const molPerL = toBaseValue(value, from);
    const gPerL = molPerL * mw;
    const result = fromBaseValue(gPerL, to);
    return {
      ok: true,
      result: round(result, to.precision),
      formula: `g/L = M × MW → ${molPerL} mol/L × ${mw} = ${gPerL} g/L → ${result} ${to.label}`,
    };
  }

  if (isMassConcUnit(from) && isMolarUnit(to)) {
    const gPerL = toBaseValue(value, from);
    const molPerL = gPerL / mw;
    const result = fromBaseValue(molPerL, to);
    return {
      ok: true,
      result: round(result, to.precision),
      formula: `M = g/L / MW → ${gPerL} g/L / ${mw} = ${molPerL} mol/L → ${result} ${to.label}`,
    };
  }

  return null;
}

function convertPercentBridge(
  value: number,
  from: UnitDefinition,
  to: UnitDefinition,
  context: ConversionContext,
): UnitConvertResult | null {
  // % w/v → mg/mL: 1% w/v = 10 mg/mL
  if (isPercentWv(from) && to.label === "mg/mL") {
    const result = value * 10;
    return {
      ok: true,
      result: round(result, to.precision),
      formula: `mg/mL = (% w/v) × 10 = ${value} × 10`,
    };
  }
  if (from.label === "mg/mL" && isPercentWv(to)) {
    const result = value / 10;
    return {
      ok: true,
      result: round(result, to.precision),
      formula: `% w/v = mg/mL / 10 = ${value} / 10`,
    };
  }

  // % w/v ↔ g/L: 1% w/v = 10 g/L
  if (isPercentWv(from) && to.label === "g/L") {
    const result = value * 10;
    return {
      ok: true,
      result: round(result, to.precision),
      formula: `g/L = (% w/v) × 10 = ${value} × 10`,
    };
  }
  if (from.label === "g/L" && isPercentWv(to)) {
    const result = value / 10;
    return {
      ok: true,
      result: round(result, to.precision),
      formula: `% w/v = g/L / 10 = ${value} / 10`,
    };
  }

  // % w/w → mg/mL needs density
  if (isPercentWw(from) && to.label === "mg/mL") {
    const density = context.density;
    if (!density || density <= 0) {
      return {
        ok: false,
        error: "Quy đổi % w/w sang mg/mL cần mật độ dung dịch (g/mL).",
      };
    }
    const result = value * density * 10;
    return {
      ok: true,
      result: round(result, to.precision),
      formula: `mg/mL = (% w/w) × ρ × 10 = ${value} × ${density} × 10`,
    };
  }
  if (from.label === "mg/mL" && isPercentWw(to)) {
    const density = context.density;
    if (!density || density <= 0) {
      return {
        ok: false,
        error: "Quy đổi mg/mL sang % w/w cần mật độ dung dịch (g/mL).",
      };
    }
    const result = value / (density * 10);
    return {
      ok: true,
      result: round(result, to.precision),
      formula: `% w/w = mg/mL / (ρ × 10) = ${value} / (${density} × 10)`,
    };
  }

  return null;
}

function convertPpmBridge(
  value: number,
  from: UnitDefinition,
  to: UnitDefinition,
): UnitConvertResult | null {
  // Aqueous dilute: 1 ppm ≈ 1 mg/L, 1 ppb ≈ 1 µg/L
  if (from.label === "ppm" && to.label === "mg/L") {
    return {
      ok: true,
      result: round(value, to.precision),
      formula: `1 ppm ≈ 1 mg/L (dung dịch aqueous pha loãng)`,
    };
  }
  if (from.label === "mg/L" && to.label === "ppm") {
    return {
      ok: true,
      result: round(value, to.precision),
      formula: `1 mg/L ≈ 1 ppm (dung dịch aqueous pha loãng)`,
    };
  }
  if (from.label === "ppb" && to.label === "µg/L") {
    return {
      ok: true,
      result: round(value, to.precision),
      formula: `1 ppb ≈ 1 µg/L (dung dịch aqueous pha loãng)`,
    };
  }
  if (from.label === "µg/L" && to.label === "ppb") {
    return {
      ok: true,
      result: round(value, to.precision),
      formula: `1 µg/L ≈ 1 ppb (dung dịch aqueous pha loãng)`,
    };
  }
  return null;
}

export function validateConversion(from: string, to: string): ValidationResult {
  const fromUnit = resolveUnit(from);
  const toUnit = resolveUnit(to);
  if (!fromUnit || !toUnit) {
    return { valid: false, requiresContext: [], message: "Đơn vị không hợp lệ." };
  }

  if (fromUnit.label === toUnit.label) {
    return { valid: true, requiresContext: [] };
  }

  const requiresContext: ContextField[] = [];

  if (
    (isMolarUnit(fromUnit) && isMassConcUnit(toUnit)) ||
    (isMassConcUnit(fromUnit) && isMolarUnit(toUnit))
  ) {
    requiresContext.push("molecularWeight");
  }

  if (
    (isMassUnit(fromUnit) && isVolumeUnit(toUnit)) ||
    (isVolumeUnit(fromUnit) && isMassUnit(toUnit))
  ) {
    requiresContext.push("density");
  }

  if (isPercentWw(fromUnit) && toUnit.label === "mg/mL") {
    requiresContext.push("density");
  }
  if (fromUnit.label === "mg/mL" && isPercentWw(toUnit)) {
    requiresContext.push("density");
  }

  if (
    (fromUnit.label === "rpm" && toUnit.label === "RCF") ||
    (fromUnit.label === "RCF" && toUnit.label === "rpm")
  ) {
    requiresContext.push("rotorRadius");
  }

  return { valid: true, requiresContext };
}

export function tryBridgeConversion(
  value: number,
  from: UnitDefinition,
  to: UnitDefinition,
  context: ConversionContext,
): UnitConvertResult | null {
  if (from.category === "TEMPERATURE" && to.category === "TEMPERATURE") {
    const result = convertTemperature(value, from, to);
    if (result == null) return null;
    return {
      ok: true,
      result: round(result, to.precision),
      formula: `${value} ${from.label} → ${result} ${to.label}`,
    };
  }

  if (from.category === "CENTRIFUGATION" || to.category === "CENTRIFUGATION") {
    const centrifuge = convertCentrifugation(value, from, to, context);
    if (centrifuge) return centrifuge;
  }

  if (
    (isMassUnit(from) && isVolumeUnit(to)) ||
    (isVolumeUnit(from) && isMassUnit(to))
  ) {
    const mv = convertMassVolume(value, from, to, context);
    if (mv) return mv;
  }

  if (
    (isMolarUnit(from) && isMassConcUnit(to)) ||
    (isMassConcUnit(from) && isMolarUnit(to))
  ) {
    const molarMass = convertMolarMassConc(value, from, to, context);
    if (molarMass) return molarMass;
  }

  const percent = convertPercentBridge(value, from, to, context);
  if (percent) return percent;

  const ppm = convertPpmBridge(value, from, to);
  if (ppm) return ppm;

  return null;
}

export function convertDirect(
  value: number,
  from: UnitDefinition,
  to: UnitDefinition,
): UnitConvertResult | null {
  if (from.baseUnit !== to.baseUnit) return null;

  const base = toBaseValue(value, from);
  const result = fromBaseValue(base, to);
  return {
    ok: true,
    result: round(result, to.precision),
    formula: `${value} ${from.label} → ${base} ${from.baseUnit} → ${result} ${to.label}`,
  };
}
