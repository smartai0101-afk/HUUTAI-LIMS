import { concentrationToUnit, convertVolumeForDisplay, roundForDisplay } from "./normalize";
import { calculateSingleDilution } from "./single-dilution";
import type {
  CalibrationStandardRow,
  CalibrationStandardsInput,
  CalibrationStandardsResult,
  TableVolumeUnit,
} from "./types";
import { collectVolumeWarnings, validatePositive } from "./validate";

export function parseTargetConcentrations(raw: string): number[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n) && n > 0);
}

export function calculateCalibrationStandards(
  input: CalibrationStandardsInput,
): CalibrationStandardsResult {
  const stockCheck = validatePositive(input.stockConcentration, "Nồng độ stock");
  if (!stockCheck.ok) return stockCheck;

  const volCheck = validatePositive(input.finalVolume, "Thể tích cuối");
  if (!volCheck.ok) return volCheck;

  if (input.targetConcentrations.length === 0) {
    return { ok: false, error: "Cần ít nhất một nồng độ đích." };
  }

  const context = {
    molecularWeight: input.molecularWeight,
    density: input.density,
  };

  const displayUnit: TableVolumeUnit = input.volumeDisplayUnit ?? "mL";

  const stockInTarget = concentrationToUnit(
    input.stockConcentration,
    input.stockUnit,
    input.targetUnit,
    context,
  );
  if (!stockInTarget.ok) return stockInTarget;

  const rows: CalibrationStandardRow[] = [];

  for (let i = 0; i < input.targetConcentrations.length; i++) {
    const cTarget = input.targetConcentrations[i]!;

    if (cTarget >= stockInTarget.value) {
      return {
        ok: false,
        error: `Nồng độ đích ${cTarget} ${input.targetUnit} phải nhỏ hơn nồng độ stock (${roundForDisplay(stockInTarget.value)} ${input.targetUnit}).`,
      };
    }

    const dilution = calculateSingleDilution({
      c1: input.stockConcentration,
      v1: 0,
      c2: cTarget,
      v2: input.finalVolume,
      c1Unit: input.stockUnit,
      c2Unit: input.targetUnit,
      v1Unit: input.finalVolumeUnit,
      v2Unit: input.finalVolumeUnit,
      solveFor: "v1",
      molecularWeight: input.molecularWeight,
      density: input.density,
    });

    if (!dilution.ok) return dilution;

    const vStockDisp = convertVolumeForDisplay(
      dilution.value,
      input.finalVolumeUnit,
      displayUnit,
    );
    if (!vStockDisp.ok) return vStockDisp;

    const warnings = collectVolumeWarnings(
      vStockDisp.value,
      displayUnit,
      input.finalVolume,
      input.finalVolumeUnit,
    );

    rows.push({
      level: i + 1,
      cTarget: roundForDisplay(cTarget),
      cTargetUnit: input.targetUnit,
      vStock: vStockDisp.value,
      vStockUnit: displayUnit,
      vFinal: roundForDisplay(input.finalVolume),
      vFinalUnit: input.finalVolumeUnit,
      warnings,
    });
  }

  return {
    ok: true,
    rows,
    formula: `Vstock = Ctarget × Vfinal / Cstock · Thêm dung môi đến vạch Vfinal`,
  };
}
