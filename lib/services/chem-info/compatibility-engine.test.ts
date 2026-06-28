import assert from "node:assert/strict";
import { HAZARD_CATEGORIES_BY_CAS } from "../../../prisma/seed-data/chem-info/hazard-categories";
import { COMPATIBILITY_RULE_SEED } from "../../../prisma/seed-data/chem-info/compatibility-rules";
import {
  evaluateCompatibility,
  evaluateGroupCompatibility,
  subjectFromCategory,
  subjectFromChemical,
} from "./compatibility-engine";
import type { CompatibilityRuleView } from "@/types/chem-info";

const RULES: CompatibilityRuleView[] = COMPATIBILITY_RULE_SEED.map((rule, index) => ({
  id: `test-${index}`,
  code: rule.code,
  ruleType: rule.ruleType,
  operandAKind: rule.operandAKind,
  operandAValue: rule.operandAValue,
  operandBKind: rule.operandBKind,
  operandBValue: rule.operandBValue,
  categoryA: rule.categoryA,
  categoryB: rule.categoryB,
  categoryALabel: rule.categoryALabel,
  categoryBLabel: rule.categoryBLabel,
  severity: rule.severity,
  title: rule.title,
  message: rule.message,
  storageGuidance: rule.storageGuidance,
  examples: rule.examples,
}));

function evaluateCasPair(casA: string, casB: string) {
  return evaluateCompatibility(
    subjectFromChemical(casA, HAZARD_CATEGORIES_BY_CAS[casA] ?? []),
    subjectFromChemical(casB, HAZARD_CATEGORIES_BY_CAS[casB] ?? []),
    RULES,
  );
}

function evaluateGroupPair(idA: string, idB: string) {
  return evaluateGroupCompatibility(
    subjectFromCategory(idA),
    subjectFromCategory(idB),
    RULES,
  );
}

function codes(casA: string, casB: string): string[] {
  return evaluateCasPair(casA, casB).rules.map((r) => r.code);
}

function assertIncludes(actual: string[], expected: string, label: string) {
  assert.ok(actual.includes(expected), `${label}: expected ${expected}, got ${actual.join(", ") || "(none)"}`);
}

async function main() {
  console.log(`Rules loaded: ${RULES.length}`);

  const groupRuleCount = RULES.filter((r) => r.ruleType === "GROUP").length;
  assert.equal(groupRuleCount, 8, `expected 8 GROUP rules, got ${groupRuleCount}`);

  const formicBenzoic = evaluateCasPair("64-18-6", "65-85-0");
  assert.equal(formicBenzoic.rules.length, 0, "Formic + Benzoic should have no conflict");
  assert.equal(formicBenzoic.status, "unknown");

  assertIncludes(codes("7647-01-0", "1310-73-2"), "ACID_BASE_HAZARD", "HCl + NaOH");
  const hclNaoh = evaluateCasPair("7647-01-0", "1310-73-2");
  assert.equal(hclNaoh.rules[0]?.severity, "critical");

  assertIncludes(codes("7697-37-2", "67-64-1"), "NITRIC_ORGANIC", "HNO3 + acetone");
  const hno3Ace = evaluateCasPair("7697-37-2", "67-64-1");
  assert.equal(hno3Ace.tier, "CHEMICAL");

  assertIncludes(codes("7601-90-3", "67-56-1"), "PERCHLORIC_ORGANIC", "Perchloric + methanol");

  const h2o2Ethanol = evaluateCasPair("7722-84-1", "64-17-5");
  assertIncludes(h2o2Ethanol.rules.map((r) => r.code), "H2O2_ORGANIC", "H2O2 + ethanol");
  assert.equal(h2o2Ethanol.tier, "CHEMICAL");
  assert.ok(
    !h2o2Ethanol.rules.some((r) => r.code === "OXIDIZER_ORGANIC"),
    "CHEMICAL tier should exclude generic OXIDIZER_ORGANIC",
  );

  const kmno4Meoh = evaluateCasPair("7722-64-7", "67-56-1");
  assertIncludes(kmno4Meoh.rules.map((r) => r.code), "KMnO4_ORGANIC", "KMnO4 + methanol");
  assert.equal(kmno4Meoh.tier, "CHEMICAL");

  assertIncludes(codes("7440-23-5", "7732-18-5"), "REACTIVE_METAL_WATER", "Na + water");

  const oxidizerReducer = evaluateGroupPair("OXIDIZER", "REDUCING_AGENT");
  assertIncludes(
    oxidizerReducer.rules.map((r) => r.code),
    "OXIDIZER_REDUCING_AGENT_GROUP",
    "OXIDIZER + REDUCING_AGENT",
  );
  assert.equal(oxidizerReducer.tier, "GROUP");
  assert.equal(oxidizerReducer.rules[0]?.severity, "critical");

  const reducerOxidizer = evaluateGroupPair("REDUCING_AGENT", "OXIDIZER");
  assertIncludes(
    reducerOxidizer.rules.map((r) => r.code),
    "OXIDIZER_REDUCING_AGENT_GROUP",
    "REDUCING_AGENT + OXIDIZER (reversed)",
  );
  assert.equal(reducerOxidizer.rules[0]?.severity, "critical");

  const strongAcidBase = evaluateGroupPair("STRONG_ACID", "STRONG_BASE");
  assertIncludes(
    strongAcidBase.rules.map((r) => r.code),
    "ACID_BASE_GROUP",
    "STRONG_ACID + STRONG_BASE",
  );
  assert.equal(strongAcidBase.tier, "GROUP");
  assert.equal(strongAcidBase.rules[0]?.severity, "critical");

  const oxidizerFlammable = evaluateGroupPair("OXIDIZER", "FLAMMABLE_LIQUID");
  assertIncludes(
    oxidizerFlammable.rules.map((r) => r.code),
    "OXIDIZER_FLAMMABLE_GROUP",
    "OXIDIZER + FLAMMABLE_LIQUID",
  );
  assert.equal(oxidizerFlammable.rules[0]?.severity, "high");

  const acidCyanide = evaluateGroupPair("ACID", "CYANIDE");
  assertIncludes(acidCyanide.rules.map((r) => r.code), "ACID_CYANIDE_GROUP", "ACID + CYANIDE");
  assert.equal(acidCyanide.rules[0]?.severity, "critical");

  const strongAcidCyanide = evaluateGroupPair("STRONG_ACID", "CYANIDE");
  assertIncludes(
    strongAcidCyanide.rules.map((r) => r.code),
    "ACID_CYANIDE_GROUP",
    "STRONG_ACID + CYANIDE (alias)",
  );
  assert.equal(strongAcidCyanide.rules[0]?.severity, "critical");

  const organicAcidPair = evaluateGroupPair("ORGANIC_ACID", "ORGANIC_ACID");
  assert.equal(organicAcidPair.rules.length, 0, "ORGANIC_ACID + ORGANIC_ACID should have no rule");
  assert.equal(organicAcidPair.status, "unknown");

  const unknownGroup = evaluateGroupPair("INERT_GAS", "HALOGEN");
  assert.equal(unknownGroup.rules.length, 0, "INERT_GAS + HALOGEN");

  console.log("compatibility-engine.test.ts: all passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
