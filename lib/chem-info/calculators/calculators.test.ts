import assert from "node:assert/strict";
import { calculateMolecularWeight, parseMolecularFormula } from "./molecular-weight";
import { calculateDilution } from "./dilution";
import { calculateSolutionPrep } from "./solution-prep";
import { convertUnits } from "./unit-convert";

const h2o = parseMolecularFormula("H2O");
assert.deepEqual(h2o, [
  { symbol: "H", count: 2 },
  { symbol: "O", count: 1 },
]);

const hydrated = parseMolecularFormula("(H2O)5");
assert.equal(hydrated.find((p) => p.symbol === "H")?.count, 10);
assert.equal(hydrated.find((p) => p.symbol === "O")?.count, 5);

const mw = calculateMolecularWeight("H2O");
assert.equal(mw.ok, true);
if (mw.ok) assert.ok(Math.abs(mw.weight - 18.015) < 0.1);

const dilution = calculateDilution({ c1: 1, v1: 10, c2: 0.1, v2: 0, solveFor: "v2" });
assert.equal(dilution.ok, true);
if (dilution.ok) assert.equal(dilution.value, 100);

const prep = calculateSolutionPrep({
  concentration: 0.1,
  concentrationUnit: "M",
  volume: 1,
  volumeUnit: "L",
  molecularWeight: 58.44,
});
assert.equal(prep.ok, true);
if (prep.ok) assert.ok(Math.abs(prep.mass - 5.844) < 0.01);

const vol = convertUnits({ value: 500, from: "mL", to: "L" });
assert.equal(vol.ok, true);
if (vol.ok) assert.equal(vol.result, 0.5);

console.log("chem-info calculator tests passed");
