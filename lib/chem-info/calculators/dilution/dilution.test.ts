import assert from "node:assert/strict";
import {
  calculateCalibrationStandards,
  calculateSerialDilution,
  calculateSingleDilution,
  validateDilutionVolumes,
  type CalibrationStandardsInput,
  type TableVolumeUnit,
} from "./index";

function assertOk<T extends { ok: boolean }>(
  result: T,
  label: string,
): asserts result is T & { ok: true } {
  assert.equal(result.ok, true, `${label}: ${!result.ok ? (result as { error?: string }).error : ""}`);
}

function assertFail(result: { ok: boolean; error?: string }, label: string) {
  assert.equal(result.ok, false, `${label}: expected failure`);
  return result.error ?? "";
}

function assertCalibrationVstock(
  overrides: Partial<CalibrationStandardsInput> & {
    targetConcentrations: number[];
    volumeDisplayUnit: TableVolumeUnit;
  },
  expectedVstock: number,
  label: string,
  expectWarning = false,
) {
  const result = calculateCalibrationStandards({
    stockConcentration: 1000,
    stockUnit: "mg/L",
    targetUnit: "mg/L",
    finalVolume: 100,
    finalVolumeUnit: "mL",
    ...overrides,
  });
  assertOk(result, label);
  assert.equal(result.rows[0]!.vStock, expectedVstock);
  assert.equal(result.rows[0]!.vStockUnit, overrides.volumeDisplayUnit);
  if (expectWarning) {
    assert.ok(
      result.rows[0]!.warnings.some((w) => w.includes("pha loãng trung gian")),
      `${label}: expected pipette warning`,
    );
  }
}

async function main() {
  // Legacy cases
  const t1 = calculateSingleDilution({
    c1: 1,
    v1: 10,
    c2: 0.1,
    v2: 0,
    c1Unit: "M",
    c2Unit: "M",
    v1Unit: "mL",
    v2Unit: "mL",
    solveFor: "v2",
  });
  assertOk(t1, "case 1");
  assert.equal(t1.value, 100);

  const t2 = calculateSingleDilution({
    c1: 1000,
    v1: 0,
    c2: 10,
    v2: 100,
    c1Unit: "ppm",
    c2Unit: "ppm",
    v1Unit: "mL",
    v2Unit: "mL",
    solveFor: "v1",
  });
  assertOk(t2, "case 2");
  assert.equal(t2.value, 1);

  const t3 = calculateSerialDilution({
    cInitial: 1000,
    cInitialUnit: "mg/L",
    dilutionFactor: 10,
    steps: 5,
    finalVolumePerTube: 10,
    finalVolumeUnit: "mL",
  });
  assertOk(t3, "case 3");
  assert.equal(t3.rows[0]!.vStock, 1);

  const t5err = assertFail(
    calculateSingleDilution({
      c1: 0.1,
      v1: 10,
      c2: 1,
      v2: 0,
      c1Unit: "M",
      c2Unit: "M",
      v1Unit: "mL",
      v2Unit: "mL",
      solveFor: "v2",
    }),
    "case 5",
  );
  assert.ok(t5err.includes("C₂"));

  const t6 = validateDilutionVolumes(0.2, 0.1);
  assert.equal(t6.ok, false);

  const t7err = assertFail(
    calculateSingleDilution({
      c1: 1,
      v1: 10,
      c2: 100,
      v2: 100,
      c1Unit: "M",
      c2Unit: "mg/L",
      v1Unit: "mL",
      v2Unit: "mL",
      solveFor: "v2",
    }),
    "case 7",
  );
  assert.ok(t7err.includes("mol") || t7err.includes("khối lượng mol"));

  const t8 = calculateSingleDilution({
    c1: 1000,
    v1: 0,
    c2: 10,
    v2: 0.05,
    c1Unit: "mg/L",
    c2Unit: "mg/L",
    v1Unit: "µL",
    v2Unit: "mL",
    solveFor: "v1",
  });
  assertOk(t8, "case 8");
  assert.equal(t8.value, 0.5);
  assert.ok(t8.warnings.some((w) => w.includes("pha loãng trung gian")));

  // v2.1 calibration display unit tests
  assertCalibrationVstock(
    { targetConcentrations: [10], targetUnit: "mg/L", volumeDisplayUnit: "mL" },
    1,
    "T1",
  );
  assertCalibrationVstock(
    { targetConcentrations: [10], targetUnit: "mg/L", volumeDisplayUnit: "µL" },
    1000,
    "T2",
  );
  assertCalibrationVstock(
    { targetConcentrations: [1], targetUnit: "mg/L", volumeDisplayUnit: "mL" },
    0.1,
    "T3",
  );
  assertCalibrationVstock(
    { targetConcentrations: [1], targetUnit: "mg/L", volumeDisplayUnit: "µL" },
    100,
    "T4",
  );
  assertCalibrationVstock(
    { targetConcentrations: [10], targetUnit: "µg/L", volumeDisplayUnit: "µL" },
    1,
    "T5",
  );
  assertCalibrationVstock(
    { targetConcentrations: [1], targetUnit: "µg/L", volumeDisplayUnit: "µL" },
    0.1,
    "T6",
    true,
  );

  // v2.1 serial display unit tests
  const t7 = calculateSerialDilution({
    cInitial: 1000,
    cInitialUnit: "mg/L",
    dilutionFactor: 10,
    steps: 1,
    finalVolumePerTube: 10,
    finalVolumeUnit: "mL",
    volumeDisplayUnit: "mL",
  });
  assertOk(t7, "T7");
  assert.equal(t7.rows[0]!.vStock, 1);
  assert.equal(t7.rows[0]!.vDiluent, 9);

  const t8serial = calculateSerialDilution({
    cInitial: 1000,
    cInitialUnit: "mg/L",
    dilutionFactor: 10,
    steps: 1,
    finalVolumePerTube: 10,
    finalVolumeUnit: "mL",
    volumeDisplayUnit: "µL",
  });
  assertOk(t8serial, "T8");
  assert.equal(t8serial.rows[0]!.vStock, 1000);
  assert.equal(t8serial.rows[0]!.vDiluent, 9000);

  // ppb cross-unit: 1000 mg/L → 10 ppb (= 10 µg/L), V₂=100 mL → V₁=0.001 mL
  const ppb = calculateSingleDilution({
    c1: 1000,
    v1: 0,
    c2: 10,
    v2: 100,
    c1Unit: "mg/L",
    c2Unit: "ppb",
    v1Unit: "mL",
    v2Unit: "mL",
    solveFor: "v1",
  });
  assertOk(ppb, "ppb bridge");
  assert.equal(ppb.value, 0.001);

  console.log("dilution tests passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
