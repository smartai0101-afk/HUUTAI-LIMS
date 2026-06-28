export type {
  CalibrationStandardRow,
  CalibrationStandardsInput,
  CalibrationStandardsResult,
  CalibrationStandardsSuccess,
  ConcentrationUnit,
  DilutionContext,
  DilutionError,
  DilutionInput,
  DilutionProcedure,
  SerialDilutionInput,
  SerialDilutionResult,
  SerialDilutionRow,
  SerialDilutionSuccess,
  SingleDilutionInput,
  SingleDilutionResult,
  SingleDilutionSuccess,
  SolveFor,
  TableVolumeUnit,
  VolumeUnit,
} from "./types";

export {
  DILUTION_CONCENTRATION_UNITS,
  DILUTION_TABLE_VOLUME_UNITS,
  DILUTION_VOLUME_UNITS,
} from "./types";

export {
  AQUEOUS_CONCENTRATION_DISCLAIMER,
  concentrationToUnit,
  convertVolumeForDisplay,
  getConcentrationBaseUnit,
  isValidConcentrationUnit,
  isValidVolumeUnit,
  litersToVolume,
  roundForDisplay,
  volumeToLiters,
  volumeToMicroliters,
} from "./normalize";

export {
  checkPipetteWarning,
  checkVStockExceedsVFinal,
  collectVolumeWarnings,
  validateDilutionConcentrations,
  validateDilutionVolumes,
  validateFactor,
  validatePositive,
  validateSteps,
} from "./validate";

export { calculateSingleDilution } from "./single-dilution";
export { calculateSerialDilution } from "./serial-dilution";
export {
  calculateCalibrationStandards,
  parseTargetConcentrations,
} from "./calibration-standards";

import type { DilutionInput } from "./types";
import type { SingleDilutionResult } from "./types";
import { calculateSingleDilution } from "./single-dilution";

/** @deprecated Use calculateSingleDilution with units. */
export type DilutionResult =
  | { ok: true; value: number; variable: DilutionInput["solveFor"]; formula: string }
  | { ok: false; error: string };

/** @deprecated Use calculateSingleDilution with units. */
export function calculateDilution(input: DilutionInput): DilutionResult {
  const result = calculateSingleDilution({
    c1: input.c1,
    v1: input.v1,
    c2: input.c2,
    v2: input.v2,
    c1Unit: "M",
    c2Unit: "M",
    v1Unit: "mL",
    v2Unit: "mL",
    solveFor: input.solveFor,
  });

  if (!result.ok) return result;

  return {
    ok: true,
    value: result.value,
    variable: result.variable,
    formula: result.formula,
  };
}
