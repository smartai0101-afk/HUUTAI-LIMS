import type { ConversionContext } from "../units/conversion-context";

export const DILUTION_CONCENTRATION_UNITS = [
  "M",
  "mM",
  "µM",
  "mg/mL",
  "µg/mL",
  "mg/L",
  "µg/L",
  "ng/L",
  "ppm",
  "ppb",
  "% w/v",
  "% w/w",
  "% v/v",
] as const;

export const DILUTION_VOLUME_UNITS = ["L", "mL", "µL"] as const;

export const DILUTION_TABLE_VOLUME_UNITS = ["mL", "µL"] as const;

export type ConcentrationUnit = (typeof DILUTION_CONCENTRATION_UNITS)[number];
export type VolumeUnit = (typeof DILUTION_VOLUME_UNITS)[number];
export type TableVolumeUnit = (typeof DILUTION_TABLE_VOLUME_UNITS)[number];
export type SolveFor = "c1" | "v1" | "c2" | "v2";

export type DilutionContext = ConversionContext;

export type SingleDilutionInput = {
  c1: number;
  v1: number;
  c2: number;
  v2: number;
  c1Unit: ConcentrationUnit;
  c2Unit: ConcentrationUnit;
  v1Unit: VolumeUnit;
  v2Unit: VolumeUnit;
  solveFor: SolveFor;
  molecularWeight?: number;
  density?: number;
};

export type DilutionProcedure = {
  steps: string[];
  note?: string;
};

export type SingleDilutionSuccess = {
  ok: true;
  value: number;
  valueUnit: string;
  variable: SolveFor;
  formula: string;
  procedure?: DilutionProcedure;
  warnings: string[];
  /** Resolved values for display (with units). */
  resolved: {
    c1: number;
    c1Unit: ConcentrationUnit;
    v1: number;
    v1Unit: VolumeUnit;
    c2: number;
    c2Unit: ConcentrationUnit;
    v2: number;
    v2Unit: VolumeUnit;
  };
};

export type DilutionError = { ok: false; error: string };

export type SingleDilutionResult = SingleDilutionSuccess | DilutionError;

export type SerialDilutionInput = {
  cInitial: number;
  cInitialUnit: ConcentrationUnit;
  dilutionFactor: number;
  steps: number;
  finalVolumePerTube: number;
  finalVolumeUnit: VolumeUnit;
  volumeDisplayUnit?: TableVolumeUnit;
  molecularWeight?: number;
  density?: number;
};

export type SerialDilutionRow = {
  step: number;
  cFinal: number;
  cFinalUnit: ConcentrationUnit;
  vStock: number;
  vStockUnit: VolumeUnit;
  vDiluent: number;
  vDiluentUnit: VolumeUnit;
  vFinal: number;
  vFinalUnit: VolumeUnit;
  warnings: string[];
};

export type SerialDilutionSuccess = {
  ok: true;
  rows: SerialDilutionRow[];
  formula: string;
};

export type SerialDilutionResult = SerialDilutionSuccess | DilutionError;

export type CalibrationStandardsInput = {
  stockConcentration: number;
  stockUnit: ConcentrationUnit;
  targetConcentrations: number[];
  targetUnit: ConcentrationUnit;
  finalVolume: number;
  finalVolumeUnit: VolumeUnit;
  volumeDisplayUnit?: TableVolumeUnit;
  molecularWeight?: number;
  density?: number;
};

export type CalibrationStandardRow = {
  level: number;
  cTarget: number;
  cTargetUnit: ConcentrationUnit;
  vStock: number;
  vStockUnit: VolumeUnit;
  vFinal: number;
  vFinalUnit: VolumeUnit;
  warnings: string[];
};

export type CalibrationStandardsSuccess = {
  ok: true;
  rows: CalibrationStandardRow[];
  formula: string;
};

export type CalibrationStandardsResult = CalibrationStandardsSuccess | DilutionError;

/** @deprecated Legacy dimensionless input. */
export type DilutionInput = {
  c1: number;
  v1: number;
  c2: number;
  v2: number;
  solveFor: SolveFor;
};
