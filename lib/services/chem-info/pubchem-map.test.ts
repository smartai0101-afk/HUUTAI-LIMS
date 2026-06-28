import assert from "node:assert/strict";
import { mapPubChemToReference, type PubChemCompound } from "./pubchem";

const compound: PubChemCompound = {
  cid: 180,
  name: "Acetone",
  iupacName: "propan-2-one",
  casNumber: "67-64-1",
  molecularFormula: "C3H6O",
  molecularWeight: 58.08,
  smiles: "CC(=O)C",
  isomericSmiles: "CC(=O)C",
  inchi: "InChI=1S/C3H6O/c1-3(2)4/h1-2H3",
  inchiKey: "CSCPPACGZOOCGX-UHFFFAOYSA-N",
  synonyms: ["Propanone", "67-64-1"],
  physicalProperties: { xlogp: -0.1 },
  structure2dUrl: "https://example.com/180.png",
};

const draft = mapPubChemToReference(compound);
assert.equal(draft.casNumber, "67-64-1");
assert.equal(draft.pubchemCid, 180);
assert.equal(draft.needsReview, false);
assert.equal(draft.extendedData.externalHazardRef, true);

const noCas = mapPubChemToReference({ ...compound, casNumber: "" });
assert.equal(noCas.needsReview, true);
assert.ok(noCas.casNumber.startsWith("NO-CAS-") || noCas.casNumber.startsWith("PUBCHEM-"));

console.log("pubchem-map.test.ts: all passed");
