import assert from "node:assert/strict";
import { pickPubChemDisplayName } from "./display-name";

const acetamipridSynonyms = [
  "DTXSID7086028",
  "Acetamiprid",
  "acetamiprid",
  "N-[Cyano(methyl)amino]methyl]-N-methylpyridin-4-amine",
  "135410-20-7",
];

const name = pickPubChemDisplayName(acetamipridSynonyms, { query: "acetamiprid", cid: 12345 });
assert.equal(name.toLowerCase(), "acetamiprid", "should prefer readable name over DTXSID");

const ethanolSynonyms = ["DTXSID8020064", "Ethanol", "64-17-5", "ethyl alcohol"];
assert.equal(
  pickPubChemDisplayName(ethanolSynonyms, { query: "ethanol" }).toLowerCase(),
  "ethanol",
);

assert.equal(
  pickPubChemDisplayName(["DTXSID123", "CID 999"], { cid: 999 }),
  "CID 999",
);

console.log("display-name tests passed");
