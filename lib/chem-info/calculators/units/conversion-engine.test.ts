import assert from "node:assert/strict";
import {
  convertUnits,
  getUnitLabelsByCategory,
  validateConversion,
} from "./conversion-engine";

function assertOk(result: ReturnType<typeof convertUnits>, label: string) {
  assert.equal(result.ok, true, `${label}: expected ok, got error: ${!result.ok ? result.error : ""}`);
  return result.ok ? result.result : 0;
}

function assertFail(result: ReturnType<typeof convertUnits>, label: string) {
  assert.equal(result.ok, false, `${label}: expected failure`);
  return !result.ok ? result.error : "";
}

async function main() {
  // 1. 1 mL → L = 0.001 L
  assert.equal(assertOk(convertUnits({ value: 1, from: "mL", to: "L" }), "1 mL → L"), 0.001);

  // 2. 1000 µL → mL = 1 mL
  assert.equal(assertOk(convertUnits({ value: 1000, from: "µL", to: "mL" }), "1000 µL → mL"), 1);

  // 3. 1 g → mg = 1000 mg
  assert.equal(assertOk(convertUnits({ value: 1, from: "g", to: "mg" }), "1 g → mg"), 1000);

  // 4. 1 mg/L → ppm ≈ 1 ppm (aqueous)
  const ppm = assertOk(convertUnits({ value: 1, from: "mg/L", to: "ppm" }), "1 mg/L → ppm");
  assert.ok(Math.abs(ppm - 1) < 1e-6, `1 mg/L → ppm: expected 1, got ${ppm}`);

  // 5. 1 M NaCl, MW=58.44 → mg/L = 58440 mg/L
  const mgL = assertOk(
    convertUnits({ value: 1, from: "M", to: "mg/L", molecularWeight: 58.44 }),
    "1 M → mg/L",
  );
  assert.ok(Math.abs(mgL - 58440) < 0.1, `1 M NaCl → mg/L: expected 58440, got ${mgL}`);

  // 6. 25 °C → K = 298.15
  const kelvin = assertOk(convertUnits({ value: 25, from: "°C", to: "K" }), "25 °C → K");
  assert.ok(Math.abs(kelvin - 298.15) < 0.01, `25 °C → K: expected 298.15, got ${kelvin}`);

  // 7. 1 atm → kPa = 101.325
  const kpa = assertOk(convertUnits({ value: 1, from: "atm", to: "kPa" }), "1 atm → kPa");
  assert.ok(Math.abs(kpa - 101.325) < 0.01, `1 atm → kPa: expected 101.325, got ${kpa}`);

  // 8. rpm → RCF without radius → error
  const rcfErr = assertFail(convertUnits({ value: 10000, from: "rpm", to: "RCF" }), "rpm → RCF no radius");
  assert.ok(rcfErr.includes("bán kính"), `rpm → RCF error should mention bán kính: ${rcfErr}`);

  // 9. 10000 rpm, r=10 cm → RCF ≈ 11180
  const rcf = assertOk(
    convertUnits({
      value: 10000,
      from: "rpm",
      to: "RCF",
      context: { rotorRadiusCm: 10 },
    }),
    "10000 rpm → RCF",
  );
  assert.ok(Math.abs(rcf - 11180) < 50, `10000 rpm r=10 → RCF: expected ~11180, got ${rcf}`);

  // 10. 1 % w/v → mg/mL = 10 mg/mL
  assert.equal(
    assertOk(convertUnits({ value: 1, from: "% w/v", to: "mg/mL" }), "1 % w/v → mg/mL"),
    10,
  );

  // 11. mg → mL without density → error
  const mvErr = assertFail(convertUnits({ value: 100, from: "mg", to: "mL" }), "mg → mL no density");
  assert.ok(mvErr.includes("mật độ"), `mg → mL error should mention mật độ: ${mvErr}`);

  // 12. Category lock — MASS units only in MASS category
  const massUnits = getUnitLabelsByCategory("MASS");
  assert.ok(massUnits.includes("g") && massUnits.includes("mg"));
  assert.ok(!massUnits.includes("mL"));
  const volUnits = getUnitLabelsByCategory("VOLUME");
  assert.ok(volUnits.includes("mL") && !volUnits.includes("g"));

  // Regression: legacy API 500 mL → 0.5 L
  assert.equal(assertOk(convertUnits({ value: 500, from: "mL", to: "L" }), "500 mL → L"), 0.5);

  // CONCENTRATION_BRIDGE symmetric
  const bridge = validateConversion("M", "mg/L");
  assert.ok(bridge.requiresContext.includes("molecularWeight"));

  console.log("conversion-engine.test.ts: all passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
