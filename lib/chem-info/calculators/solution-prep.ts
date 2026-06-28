export type SolutionPrepInput = {
  concentration: number;
  concentrationUnit: "M" | "mM" | "mg/mL" | "g/L" | "%w/v";
  volume: number;
  volumeUnit: "L" | "mL" | "µL";
  molecularWeight?: number;
};

export type SolutionPrepResult =
  | { ok: true; mass: number; massUnit: string; formula: string }
  | { ok: false; error: string };

function volumeToLiters(volume: number, unit: SolutionPrepInput["volumeUnit"]) {
  if (volume <= 0) return null;
  if (unit === "L") return volume;
  if (unit === "mL") return volume / 1000;
  return volume / 1_000_000;
}

function concentrationToMolPerL(
  concentration: number,
  unit: SolutionPrepInput["concentrationUnit"],
  molecularWeight?: number,
) {
  if (concentration <= 0) return null;
  if (unit === "M") return concentration;
  if (unit === "mM") return concentration / 1000;
  if (!molecularWeight || molecularWeight <= 0) return null;
  if (unit === "g/L") return concentration / molecularWeight;
  if (unit === "mg/mL") return concentration / molecularWeight;
  if (unit === "%w/v") return (concentration * 10) / molecularWeight;
  return null;
}

export function calculateSolutionPrep(input: SolutionPrepInput): SolutionPrepResult {
  const volL = volumeToLiters(input.volume, input.volumeUnit);
  if (volL == null) return { ok: false, error: "Thể tích phải > 0" };

  const molPerL = concentrationToMolPerL(
    input.concentration,
    input.concentrationUnit,
    input.molecularWeight,
  );
  if (molPerL == null) {
    return {
      ok: false,
      error: "Nồng độ không hợp lệ hoặc thiếu khối lượng mol cho đơn vị đã chọn",
    };
  }

  const moles = molPerL * volL;
  if (input.concentrationUnit === "M" || input.concentrationUnit === "mM") {
    if (!input.molecularWeight || input.molecularWeight <= 0) {
      return { ok: false, error: "Cần khối lượng mol (g/mol) cho pha dung dịch theo M/mM" };
    }
    const mass = moles * input.molecularWeight;
    return {
      ok: true,
      mass: Math.round(mass * 10000) / 10000,
      massUnit: "g",
      formula: `m = C × V × MW = ${molPerL} mol/L × ${volL} L × ${input.molecularWeight} g/mol`,
    };
  }

  if (input.concentrationUnit === "mg/mL") {
    const massG = input.concentration * (volL * 1000) / 1000;
    return {
      ok: true,
      mass: Math.round(massG * 10000) / 10000,
      massUnit: "g",
      formula: `m = C(mg/mL) × V(mL) / 1000`,
    };
  }

  if (input.concentrationUnit === "g/L") {
    const mass = input.concentration * volL;
    return {
      ok: true,
      mass: Math.round(mass * 10000) / 10000,
      massUnit: "g",
      formula: `m = C(g/L) × V(L)`,
    };
  }

  const mass = (input.concentration / 100) * volL * 1000;
  return {
    ok: true,
    mass: Math.round(mass * 10000) / 10000,
    massUnit: "g",
    formula: `m = (%w/v / 100) × V(mL)`,
  };
}
