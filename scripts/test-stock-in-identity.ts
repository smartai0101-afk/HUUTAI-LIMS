import {
  chemicalIdentityMatches,
  codesMatch,
  findChemicalByIdentity,
  identityCodeMismatchMessage,
} from "../lib/services/stock-in-match";

function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`OK ${label}`);
}

function assertTrue(label: string, value: boolean) {
  if (!value) throw new Error(`${label}: expected true`);
  console.log(`OK ${label}`);
}

function testIdentityMatch() {
  const existing = {
    name: "Methanol",
    casNumber: "67-56-1",
    manufacturer: "Merck",
    productCode: "106009",
    code: "CHEM-0001",
  };

  assertTrue(
    "full identity match",
    chemicalIdentityMatches(existing, {
      name: "Methanol",
      casNumber: "67-56-1",
      manufacturer: "Merck",
      productCode: "106009",
    }),
  );

  assertTrue(
    "product code required when existing has code",
    !chemicalIdentityMatches(existing, {
      name: "Methanol",
      casNumber: "67-56-1",
      manufacturer: "Merck",
      productCode: "",
    }),
  );

  assertTrue(
    "different code same identity found",
    findChemicalByIdentity([existing], {
      name: "Methanol",
      casNumber: "67-56-1",
      manufacturer: "Merck",
      productCode: "106009",
    })?.code === "CHEM-0001",
  );

  assertTrue("codes match case insensitive", codesMatch("CHEM-0001", "chem-0001"));
  assertEqual(
    "mismatch message",
    identityCodeMismatchMessage("Chemical", "CHEM-0001").includes("CHEM-0001"),
    true,
  );
}

testIdentityMatch();
console.log("ALL STOCK-IN IDENTITY TESTS PASS");
