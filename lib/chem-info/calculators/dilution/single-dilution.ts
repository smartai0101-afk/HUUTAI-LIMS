import {
  concentrationToUnit,
  litersToVolume,
  roundForDisplay,
  volumeToLiters,
} from "./normalize";
import type {
  DilutionContext,
  DilutionProcedure,
  SingleDilutionInput,
  SingleDilutionResult,
  SolveFor,
} from "./types";
import {
  checkPipetteWarning,
  validateDilutionConcentrations,
  validateDilutionVolumes,
  validatePositive,
} from "./validate";

function buildContext(input: SingleDilutionInput): DilutionContext {
  return {
    molecularWeight: input.molecularWeight,
    density: input.density,
  };
}

function buildProcedure(v1: number, v1Unit: string, v2: number, v2Unit: string): DilutionProcedure {
  return {
    steps: [
      `Lấy ${v1} ${v1Unit} dung dịch stock.`,
      `Thêm dung môi đến vạch ${v2} ${v2Unit}.`,
    ],
  };
}

function formatFormula(
  solveFor: SolveFor,
  c1: number,
  c1Unit: string,
  v1: number,
  v1Unit: string,
  c2: number,
  c2Unit: string,
  v2: number,
  v2Unit: string,
  result: number,
  resultUnit: string,
): string {
  switch (solveFor) {
    case "v2":
      return `V₂ = C₁×V₁/C₂ = ${c1} ${c1Unit} × ${v1} ${v1Unit} / ${c2} ${c2Unit} = ${result} ${resultUnit}`;
    case "v1":
      return `V₁ = C₂×V₂/C₁ = ${c2} ${c2Unit} × ${v2} ${v2Unit} / ${c1} ${c1Unit} = ${result} ${resultUnit}`;
    case "c2":
      return `C₂ = C₁×V₁/V₂ = ${c1} ${c1Unit} × ${v1} ${v1Unit} / ${v2} ${v2Unit} = ${result} ${resultUnit}`;
    case "c1":
      return `C₁ = C₂×V₂/V₁ = ${c2} ${c2Unit} × ${v2} ${v2Unit} / ${v1} ${v1Unit} = ${result} ${resultUnit}`;
  }
}

export function calculateSingleDilution(input: SingleDilutionInput): SingleDilutionResult {
  const { solveFor, c1Unit, c2Unit, v1Unit, v2Unit } = input;
  const context = buildContext(input);
  const warnings: string[] = [];

  const requiredLabels: Record<SolveFor, Array<[string, number]>> = {
    v2: [
      ["C₁", input.c1],
      ["V₁", input.v1],
      ["C₂", input.c2],
    ],
    v1: [
      ["C₁", input.c1],
      ["C₂", input.c2],
      ["V₂", input.v2],
    ],
    c2: [
      ["C₁", input.c1],
      ["V₁", input.v1],
      ["V₂", input.v2],
    ],
    c1: [
      ["C₂", input.c2],
      ["V₁", input.v1],
      ["V₂", input.v2],
    ],
  };

  for (const [label, val] of requiredLabels[solveFor]) {
    const check = validatePositive(val, label);
    if (!check.ok) return check;
  }

  // Align concentrations to c1Unit for internal math
  let c1Base = input.c1;
  let c2Base: number;

  if (solveFor === "c1") {
    const c2Aligned = concentrationToUnit(input.c2, c2Unit, c1Unit, context);
    if (!c2Aligned.ok) return c2Aligned;
    c2Base = c2Aligned.value;
  } else if (solveFor === "c2") {
    c2Base = 0;
  } else {
    const c2Aligned = concentrationToUnit(input.c2, c2Unit, c1Unit, context);
    if (!c2Aligned.ok) return c2Aligned;
    c2Base = c2Aligned.value;
  }

  let v1L: number;
  let v2L: number;

  if (solveFor === "v1") {
    const v2 = volumeToLiters(input.v2, v2Unit);
    if (!v2.ok) return v2;
    v2L = v2.liters;
    v1L = 0;
  } else if (solveFor === "v2") {
    const v1 = volumeToLiters(input.v1, v1Unit);
    if (!v1.ok) return v1;
    v1L = v1.liters;
    v2L = 0;
  } else {
    const v1 = volumeToLiters(input.v1, v1Unit);
    const v2 = volumeToLiters(input.v2, v2Unit);
    if (!v1.ok) return v1;
    if (!v2.ok) return v2;
    v1L = v1.liters;
    v2L = v2.liters;
  }

  let resultValue: number;
  let resultUnit: string;
  let resultVariable = solveFor;

  switch (solveFor) {
    case "v2": {
      v2L = (c1Base * v1L) / c2Base;
      const v2Out = litersToVolume(v2L, v2Unit);
      if (!v2Out.ok) return v2Out;
      resultValue = roundForDisplay(v2Out.value);
      resultUnit = v2Unit;
      break;
    }
    case "v1": {
      v1L = (c2Base * v2L) / c1Base;
      const v1Out = litersToVolume(v1L, v1Unit);
      if (!v1Out.ok) return v1Out;
      resultValue = roundForDisplay(v1Out.value);
      resultUnit = v1Unit;
      warnings.push(...checkPipetteWarning(resultValue, v1Unit));
      break;
    }
    case "c2": {
      const c2Calc = (c1Base * v1L) / v2L;
      const c2Out = concentrationToUnit(c2Calc, c1Unit, c2Unit, context);
      if (!c2Out.ok) return c2Out;
      resultValue = roundForDisplay(c2Out.value);
      resultUnit = c2Unit;
      c2Base = c2Calc;
      break;
    }
    case "c1": {
      c1Base = (c2Base * v2L) / v1L;
      const c1Out = concentrationToUnit(c1Base, c1Unit, c1Unit, context);
      if (!c1Out.ok) return c1Out;
      resultValue = roundForDisplay(c1Out.value);
      resultUnit = c1Unit;
      break;
    }
  }

  // Resolve all four values for validation and display
  let resolvedC1 = solveFor === "c1" ? resultValue : input.c1;
  let resolvedC2 = solveFor === "c2" ? resultValue : input.c2;
  let resolvedV1 = solveFor === "v1" ? resultValue : input.v1;
  let resolvedV2 = solveFor === "v2" ? resultValue : input.v2;

  const c1ForValidate = concentrationToUnit(resolvedC1, c1Unit, c1Unit, context);
  if (!c1ForValidate.ok) return c1ForValidate;
  const c2ForValidate = concentrationToUnit(resolvedC2, c2Unit, c1Unit, context);
  if (!c2ForValidate.ok) return c2ForValidate;

  const concCheck = validateDilutionConcentrations(c1ForValidate.value, c2ForValidate.value);
  if (!concCheck.ok) return concCheck;

  const v1Final = volumeToLiters(resolvedV1, v1Unit);
  const v2Final = volumeToLiters(resolvedV2, v2Unit);
  if (!v1Final.ok) return v1Final;
  if (!v2Final.ok) return v2Final;

  const volCheck = validateDilutionVolumes(v1Final.liters, v2Final.liters);
  if (!volCheck.ok) return volCheck;

  if (solveFor !== "v1") {
    warnings.push(...checkPipetteWarning(resolvedV1, v1Unit));
  }

  const formula = formatFormula(
    solveFor,
    input.c1,
    c1Unit,
    input.v1,
    v1Unit,
    input.c2,
    c2Unit,
    input.v2,
    v2Unit,
    resultValue,
    resultUnit,
  );

  const procedure =
    solveFor === "v1" || (resolvedV1 > 0 && resolvedV2 > 0)
      ? buildProcedure(resolvedV1, v1Unit, resolvedV2, v2Unit)
      : undefined;

  return {
    ok: true,
    value: resultValue,
    valueUnit: resultUnit,
    variable: resultVariable,
    formula,
    procedure,
    warnings,
    resolved: {
      c1: roundForDisplay(resolvedC1),
      c1Unit,
      v1: roundForDisplay(resolvedV1),
      v1Unit,
      c2: roundForDisplay(resolvedC2),
      c2Unit,
      v2: roundForDisplay(resolvedV2),
      v2Unit,
    },
  };
}
