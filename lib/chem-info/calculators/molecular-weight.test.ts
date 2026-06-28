import assert from "node:assert/strict";
import { parseMolecularFormula, parseMolecularFormulaParts } from "./molecular-formula-parser";
import { calculateMolecularWeight } from "./molecular-weight";

function assertWeight(formula: string, expected: number, tolerance = 0.02, label = formula) {
  const result = calculateMolecularWeight(formula);
  assert.equal(result.ok, true, `${label}: ${!result.ok ? result.error : ""}`);
  if (result.ok) {
    assert.ok(
      Math.abs(result.weight - expected) <= tolerance,
      `${label}: expected ~${expected}, got ${result.weight}`,
    );
  }
}

function assertFail(formula: string) {
  const result = calculateMolecularWeight(formula);
  assert.equal(result.ok, false, `${formula}: expected failure`);
}

async function main() {
  // Case-insensitive
  assertWeight("h2so4", 98.072);
  assertWeight("nacl", 58.44, 0.05);
  assertWeight("cuso4", 159.606, 0.05);

  // Hydrates / solvates
  assertWeight("H2SO4.H2O", 116.087);
  assertWeight("CuSO4.5H2O", 249.68);
  assertWeight("Na2CO3.10H2O", 286.14);
  assertWeight("CaCl2.2H2O", 147.01);
  assertWeight("FeCl3.6CH3OH", 354.45, 0.05);
  assertWeight("CaCl2.8NH3", 247.23, 0.05);
  assertWeight("CH3COOH", 60.05, 0.05);
  assertWeight("CH4.5.75H2O", 119.63, 0.05);

  // Alternate separators
  assertWeight("H2SO4·H2O", 116.087);
  assertWeight("CuSO4•5H2O", 249.68);

  // Multi-adduct
  const multi = calculateMolecularWeight("NaCl.2H2O.CH3OH");
  assert.equal(multi.ok, true);
  if (multi.ok) {
    assert.equal(multi.parts.length, 3);
  }

  // Parentheses
  const hydrated = parseMolecularFormula("(H2O)5");
  assert.equal(hydrated.find((p) => p.symbol === "H")?.count, 10);
  assert.equal(hydrated.find((p) => p.symbol === "O")?.count, 5);

  // Parts breakdown
  const parts = parseMolecularFormulaParts("H2SO4.H2O");
  assert.equal(parts.ok, true);
  if (parts.ok) {
    assert.equal(parts.parts.length, 2);
    assert.equal(parts.parts[0]!.label, "H2SO4");
    assert.equal(parts.parts[1]!.label, "H2O");
  }

  assertFail("");
  assertFail("   ");

  console.log("molecular-weight tests passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
