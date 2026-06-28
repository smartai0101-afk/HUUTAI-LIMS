import { convertUnits } from "../units/conversion-engine";
import type { ConversionContext } from "../units/conversion-context";
import { resolveUnit } from "../units/unit-definitions";
import type { ConcentrationUnit, TableVolumeUnit, VolumeUnit } from "./types";
import { DILUTION_CONCENTRATION_UNITS } from "./types";

/** Quy ước gần đúng cho dung dịch nước (ppm/ppb aqueous). */
export const AQUEOUS_CONCENTRATION_DISCLAIMER =
  "Quy ước gần đúng cho dung dịch nước: 1 ppm ≈ 1 mg/L · 1 ppb ≈ 1 µg/L.";

function buildContext(context: ConversionContext): ConversionContext {
  return {
    molecularWeight: context.molecularWeight,
    density: context.density,
  };
}

export function isValidConcentrationUnit(unit: string): unit is ConcentrationUnit {
  return (
    resolveUnit(unit) != null &&
    (DILUTION_CONCENTRATION_UNITS as readonly string[]).includes(unit)
  );
}

export function isValidVolumeUnit(unit: string): unit is VolumeUnit {
  return (["L", "mL", "µL"] as string[]).includes(unit);
}

const AQUEOUS_CONCENTRATION_UNITS = new Set<ConcentrationUnit>([
  "mg/L",
  "µg/L",
  "ng/L",
  "ppm",
  "ppb",
]);

function isAqueousConcentration(unit: ConcentrationUnit): boolean {
  return AQUEOUS_CONCENTRATION_UNITS.has(unit);
}

/** Normalize aqueous concentrations via µg/L hub (ppm≈mg/L, ppb≈µg/L). */
function toMicrogramsPerLiter(
  value: number,
  from: ConcentrationUnit,
  context: ConversionContext,
): { ok: true; value: number } | { ok: false; error: string } {
  if (from === "µg/L") return { ok: true, value };
  const ctx = buildContext(context);
  if (from === "mg/L") {
    const r = convertUnits({ value, from: "mg/L", to: "µg/L", context: ctx });
    if (!r.ok) return r;
    return { ok: true, value: r.result };
  }
  if (from === "ng/L") {
    const r = convertUnits({ value, from: "ng/L", to: "µg/L", context: ctx });
    if (!r.ok) return r;
    return { ok: true, value: r.result };
  }
  if (from === "ppm") {
    const mgL = convertUnits({ value, from: "ppm", to: "mg/L", context: ctx });
    if (!mgL.ok) return mgL;
    const ugL = convertUnits({ value: mgL.result, from: "mg/L", to: "µg/L", context: ctx });
    if (!ugL.ok) return ugL;
    return { ok: true, value: ugL.result };
  }
  if (from === "ppb") {
    const r = convertUnits({ value, from: "ppb", to: "µg/L", context: ctx });
    if (!r.ok) return r;
    return { ok: true, value: r.result };
  }
  return { ok: false, error: `Không hỗ trợ quy đổi aqueous từ ${from}.` };
}

function fromMicrogramsPerLiter(
  ugPerL: number,
  to: ConcentrationUnit,
  context: ConversionContext,
): { ok: true; value: number } | { ok: false; error: string } {
  if (to === "µg/L") return { ok: true, value: ugPerL };
  const ctx = buildContext(context);
  if (to === "mg/L") {
    const r = convertUnits({ value: ugPerL, from: "µg/L", to: "mg/L", context: ctx });
    if (!r.ok) return r;
    return { ok: true, value: r.result };
  }
  if (to === "ng/L") {
    const r = convertUnits({ value: ugPerL, from: "µg/L", to: "ng/L", context: ctx });
    if (!r.ok) return r;
    return { ok: true, value: r.result };
  }
  if (to === "ppb") {
    const r = convertUnits({ value: ugPerL, from: "µg/L", to: "ppb", context: ctx });
    if (!r.ok) return r;
    return { ok: true, value: r.result };
  }
  if (to === "ppm") {
    const mgL = convertUnits({ value: ugPerL, from: "µg/L", to: "mg/L", context: ctx });
    if (!mgL.ok) return mgL;
    const ppm = convertUnits({ value: mgL.result, from: "mg/L", to: "ppm", context: ctx });
    if (!ppm.ok) return ppm;
    return { ok: true, value: ppm.result };
  }
  return { ok: false, error: `Không hỗ trợ quy đổi aqueous sang ${to}.` };
}

export function concentrationToUnit(
  value: number,
  from: ConcentrationUnit,
  to: ConcentrationUnit,
  context: ConversionContext,
): { ok: true; value: number } | { ok: false; error: string } {
  if (from === to) return { ok: true, value };
  const ctx = buildContext(context);
  const direct = convertUnits({
    value,
    from,
    to,
    context: ctx,
    molecularWeight: context.molecularWeight,
  });
  if (direct.ok) return { ok: true, value: direct.result };

  if (isAqueousConcentration(from) && isAqueousConcentration(to)) {
    const hub = toMicrogramsPerLiter(value, from, context);
    if (!hub.ok) return hub;
    return fromMicrogramsPerLiter(hub.value, to, context);
  }

  return direct;
}

export function volumeToLiters(
  value: number,
  unit: VolumeUnit,
): { ok: true; liters: number } | { ok: false; error: string } {
  const result = convertUnits({ value, from: unit, to: "L" });
  if (!result.ok) return result;
  // Avoid L-unit precision loss for sub-mL volumes (e.g. 0.0001 mL → 1e-7 L).
  if (result.result === 0 && value > 0) {
    const viaUl = convertUnits({ value, from: unit, to: "µL" });
    if (viaUl.ok) {
      const liters = viaUl.result * 1e-6;
      return { ok: true, liters };
    }
  }
  return { ok: true, liters: result.result };
}

export function litersToVolume(
  liters: number,
  unit: VolumeUnit,
): { ok: true; value: number } | { ok: false; error: string } {
  const result = convertUnits({ value: liters, from: "L", to: unit });
  if (!result.ok) return result;
  return { ok: true, value: result.result };
}

export function volumeToMicroliters(
  value: number,
  unit: VolumeUnit | TableVolumeUnit,
): { ok: true; microliters: number } | { ok: false; error: string } {
  const result = convertUnits({ value, from: unit, to: "µL" });
  if (!result.ok) return result;
  return { ok: true, microliters: result.result };
}

export function convertVolumeForDisplay(
  value: number,
  fromUnit: VolumeUnit,
  toUnit: TableVolumeUnit,
): { ok: true; value: number } | { ok: false; error: string } {
  if (fromUnit === toUnit) {
    return { ok: true, value: roundForDisplay(value) };
  }
  const result = convertUnits({ value, from: fromUnit, to: toUnit });
  if (!result.ok) return result;
  const def = resolveUnit(toUnit);
  const precision = def?.precision ?? 6;
  return { ok: true, value: roundForDisplay(result.result, precision) };
}

export function getConcentrationBaseUnit(unit: ConcentrationUnit): string {
  const def = resolveUnit(unit);
  return def?.baseUnit ?? unit;
}

export function roundForDisplay(value: number, precision = 6): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
