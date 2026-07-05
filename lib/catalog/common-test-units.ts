/** Common result units for LIMS test methods (select or type custom). */
export const COMMON_TEST_UNITS = [
  "%",
  "mg/kg",
  "µg/kg",
  "g/kg",
  "mg/L",
  "µg/L",
  "g/L",
  "ppm",
  "ppb",
  "CFU/g",
  "CFU/mL",
  "MPN/g",
  "MPN/100mL",
  "cells/mL",
  "IU/g",
  "NTU",
  "pH",
  "-",
] as const;

export function mergeTestUnitSuggestions(existing: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const unit of [...COMMON_TEST_UNITS, ...existing]) {
    const trimmed = unit.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    merged.push(trimmed);
  }

  return merged;
}
