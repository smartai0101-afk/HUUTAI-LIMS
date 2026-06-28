import assert from "node:assert/strict";
import {
  formatMasterCode,
  isPreparedStandardMasterCode,
  parseLegacyStrainCode,
  parseMasterCode,
  parseSequenceInput,
  prefixForPreparedStandard,
  prefixForPreparedStrain,
  prefixMatchesPreparedStandardLevel,
} from "@/lib/code-prefixes";

assert.equal(formatMasterCode("STD", 5), "STD-0005");
assert.equal(formatMasterCode("CHEM", 1), "CHEM-0001");
assert.equal(parseSequenceInput("5"), 5);
assert.equal(parseSequenceInput("0005"), 5);
assert.equal(parseSequenceInput(""), null);
assert.equal(parseSequenceInput("10000"), null);

assert.deepEqual(parseMasterCode("STD-0005"), { prefix: "STD", sequenceNumber: 5 });
assert.deepEqual(parseMasterCode("STD-5"), { prefix: "STD", sequenceNumber: 5 });
assert.equal(parseMasterCode("STD-10000"), null);

assert.deepEqual(parseLegacyStrainCode("MS-0001"), { prefix: "STR", sequenceNumber: 1 });

assert.equal(prefixForPreparedStandard("WorkingPrepared"), "WSTD");
assert.equal(prefixForPreparedStandard("RootPrepared"), "PSTD");
assert.equal(prefixForPreparedStandard("Intermediate1"), "IST1");
assert.equal(prefixForPreparedStandard("Intermediate2"), "IST2");
assert.equal(prefixForPreparedStandard("Intermediate3"), "IST3");

assert.equal(prefixForPreparedStrain("Intermediate1"), "PST1");
assert.equal(prefixForPreparedStrain("Intermediate2"), "PST2");
assert.equal(prefixForPreparedStrain("Intermediate3"), "PST3");
assert.equal(prefixForPreparedStrain("RootPrepared"), "PSTR");

assert.equal(isPreparedStandardMasterCode("PSTD-0001"), true);
assert.equal(isPreparedStandardMasterCode("IST2-0008"), true);
assert.equal(isPreparedStandardMasterCode("WSTD-0001"), true);
assert.equal(isPreparedStandardMasterCode("PST1-0001"), false);

assert.equal(prefixMatchesPreparedStandardLevel("IST1", "Intermediate1"), true);
assert.equal(prefixMatchesPreparedStandardLevel("PSTD", "Intermediate1"), false);

console.log("test-code-generator: PASS");
