import { convertVolumeForDisplay, roundForDisplay } from "./normalize";
import { calculateSingleDilution } from "./single-dilution";
import type { SerialDilutionInput, SerialDilutionResult, SerialDilutionRow, TableVolumeUnit } from "./types";
import { collectVolumeWarnings, validateFactor, validatePositive, validateSteps } from "./validate";

function toDisplay(
  value: number,
  fromUnit: SerialDilutionInput["finalVolumeUnit"],
  displayUnit: TableVolumeUnit,
): { ok: true; value: number } | { ok: false; error: string } {
  return convertVolumeForDisplay(value, fromUnit, displayUnit);
}

export function calculateSerialDilution(input: SerialDilutionInput): SerialDilutionResult {
  const cCheck = validatePositive(input.cInitial, "Nồng độ ban đầu");
  if (!cCheck.ok) return cCheck;

  const fCheck = validateFactor(input.dilutionFactor);
  if (!fCheck.ok) return fCheck;

  const sCheck = validateSteps(input.steps);
  if (!sCheck.ok) return sCheck;

  const vCheck = validatePositive(input.finalVolumePerTube, "Thể tích cuối mỗi ống");
  if (!vCheck.ok) return vCheck;

  const { cInitialUnit, finalVolumeUnit, dilutionFactor: factor, steps } = input;
  const displayUnit: TableVolumeUnit = input.volumeDisplayUnit ?? "mL";
  const rows: SerialDilutionRow[] = [];

  for (let i = 1; i <= steps; i++) {
    const cSource = input.cInitial / factor ** (i - 1);
    const cFinal = input.cInitial / factor ** i;
    const vStockRaw = input.finalVolumePerTube / factor;
    const vDiluentRaw = input.finalVolumePerTube - vStockRaw;

    const dilution = calculateSingleDilution({
      c1: cSource,
      v1: 0,
      c2: cFinal,
      v2: input.finalVolumePerTube,
      c1Unit: cInitialUnit,
      c2Unit: cInitialUnit,
      v1Unit: finalVolumeUnit,
      v2Unit: finalVolumeUnit,
      solveFor: "v1",
      molecularWeight: input.molecularWeight,
      density: input.density,
    });

    if (!dilution.ok) return dilution;

    const vStockDisp = toDisplay(dilution.value, finalVolumeUnit, displayUnit);
    const vDiluentDisp = toDisplay(vDiluentRaw, finalVolumeUnit, displayUnit);
    const vFinalDisp = toDisplay(input.finalVolumePerTube, finalVolumeUnit, displayUnit);
    if (!vStockDisp.ok) return vStockDisp;
    if (!vDiluentDisp.ok) return vDiluentDisp;
    if (!vFinalDisp.ok) return vFinalDisp;

    const warnings = collectVolumeWarnings(
      vStockDisp.value,
      displayUnit,
      vFinalDisp.value,
      displayUnit,
    );

    rows.push({
      step: i,
      cFinal: roundForDisplay(cFinal),
      cFinalUnit: cInitialUnit,
      vStock: vStockDisp.value,
      vStockUnit: displayUnit,
      vDiluent: vDiluentDisp.value,
      vDiluentUnit: displayUnit,
      vFinal: vFinalDisp.value,
      vFinalUnit: displayUnit,
      warnings,
    });
  }

  return {
    ok: true,
    rows,
    formula: `Mỗi bước: Cfinal = C₀/factor^i · Vstock = Vfinal/factor · Vdiluent = Vfinal − Vstock`,
  };
}
