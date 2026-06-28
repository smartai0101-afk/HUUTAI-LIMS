import assert from "node:assert/strict";
import {
  buildPlaceholderCas,
  isPlaceholderCas,
  isValidCasNumber,
  normalizeChemicalName,
  parseCasFromSynonyms,
} from "./cas-parser";

assert.equal(isValidCasNumber("64-17-5"), true);
assert.equal(isValidCasNumber("7647-14-5"), true);
assert.equal(isValidCasNumber("invalid"), false);

assert.equal(parseCasFromSynonyms(["Ethanol", "64-17-5", "EtOH"]), "64-17-5");
assert.equal(parseCasFromSynonyms(["CAS 67-64-1"]), "67-64-1");
assert.equal(parseCasFromSynonyms(["Acetone", "propanone"]), "");

assert.equal(isPlaceholderCas("PUBCHEM-180"), true);
assert.equal(isPlaceholderCas("NO-CAS-ABCDEF"), true);
assert.equal(isPlaceholderCas("64-17-5"), false);

assert.equal(buildPlaceholderCas(180, "InChIKey-TEST"), "NO-CAS-INCHIKEYTEST");
assert.equal(buildPlaceholderCas(180), "PUBCHEM-180");

assert.equal(normalizeChemicalName("  Ethanol  "), "ethanol");

console.log("cas-parser.test.ts: all passed");
