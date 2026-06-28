import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/chem-info/json-utils";
import {
  evaluateCompatibility,
  evaluateGroupCompatibility,
  subjectFromCategory,
  subjectFromChemical,
} from "@/lib/services/chem-info/compatibility-engine";
import type {
  CompatibilityCheckResult,
  CompatibilityRuleType,
  CompatibilityRuleView,
  CompatibilitySubject,
} from "@/types/chem-info";

function mapRule(row: {
  id: string;
  code: string;
  ruleType: string;
  operandAKind: string;
  operandAValue: string;
  operandBKind: string;
  operandBValue: string;
  categoryA: string;
  categoryB: string;
  categoryALabel: string;
  categoryBLabel: string;
  severity: string;
  title: string;
  message: string;
  storageGuidance: string;
  examples: string;
}): CompatibilityRuleView {
  return {
    id: row.id,
    code: row.code,
    ruleType: row.ruleType as CompatibilityRuleType,
    operandAKind: row.operandAKind as CompatibilityRuleView["operandAKind"],
    operandAValue: row.operandAValue,
    operandBKind: row.operandBKind as CompatibilityRuleView["operandBKind"],
    operandBValue: row.operandBValue,
    categoryA: row.categoryA,
    categoryB: row.categoryB,
    categoryALabel: row.categoryALabel,
    categoryBLabel: row.categoryBLabel,
    severity: row.severity,
    title: row.title,
    message: row.message,
    storageGuidance: row.storageGuidance,
    examples: parseJsonArray<string>(row.examples),
  };
}

export async function listCompatibilityRules(): Promise<CompatibilityRuleView[]> {
  const rows = await db.compatibilityRule.findMany({
    where: { isActive: true },
    orderBy: [{ severity: "asc" }, { title: "asc" }],
  });
  return rows.map(mapRule);
}

function toCheckResult(
  evaluation: ReturnType<typeof evaluateCompatibility>,
): CompatibilityCheckResult {
  return {
    compatible: evaluation.status !== "conflict",
    rules: evaluation.rules,
    status: evaluation.status,
    tier: evaluation.tier,
  };
}

export async function checkCompatibility(
  categoryA: string,
  categoryB: string,
): Promise<CompatibilityCheckResult> {
  const rules = await listCompatibilityRules();
  const evaluation = evaluateGroupCompatibility(
    subjectFromCategory(categoryA),
    subjectFromCategory(categoryB),
    rules,
  );
  return toCheckResult(evaluation);
}

export async function checkChemicalCompatibility(
  referenceIdA: string,
  referenceIdB: string,
): Promise<CompatibilityCheckResult> {
  const [a, b, allRules] = await Promise.all([
    db.chemicalReference.findUnique({
      where: { id: referenceIdA },
      select: { casNumber: true, hazardCategory: { select: { categories: true } } },
    }),
    db.chemicalReference.findUnique({
      where: { id: referenceIdB },
      select: { casNumber: true, hazardCategory: { select: { categories: true } } },
    }),
    listCompatibilityRules(),
  ]);
  if (!a || !b) {
    return { compatible: true, rules: [], status: "unknown", tier: null };
  }

  const subjectA = subjectFromChemical(
    a.casNumber,
    parseJsonArray<string>(a.hazardCategory?.categories ?? "[]"),
  );
  const subjectB = subjectFromChemical(
    b.casNumber,
    parseJsonArray<string>(b.hazardCategory?.categories ?? "[]"),
  );
  return toCheckResult(evaluateCompatibility(subjectA, subjectB, allRules));
}

export function evaluateCompatibilitySubjects(
  subjectA: CompatibilitySubject,
  subjectB: CompatibilitySubject,
  rules: CompatibilityRuleView[],
): CompatibilityCheckResult {
  return toCheckResult(evaluateCompatibility(subjectA, subjectB, rules));
}

export async function getCategoriesForReference(referenceId: string): Promise<string[]> {
  const row = await db.chemicalHazardCategory.findUnique({
    where: { chemicalReferenceId: referenceId },
  });
  return parseJsonArray<string>(row?.categories ?? "[]");
}
