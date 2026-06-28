import {
  expandCategorySlugs,
  normalizeGroupId,
  resolveCategorySlug,
} from "@/lib/chem-info/hazard-category-map";
import type {
  CompatibilityEvaluation,
  CompatibilityOperandKind,
  CompatibilityRuleType,
  CompatibilityRuleView,
  CompatibilitySubject,
} from "@/types/chem-info";

const RULE_TYPE_PRECEDENCE: Record<CompatibilityRuleType, number> = {
  CHEMICAL: 3,
  GROUP: 2,
  HAZARD: 1,
};

export function deriveRuleType(
  operandAKind: CompatibilityOperandKind,
  operandBKind: CompatibilityOperandKind,
): CompatibilityRuleType {
  if (operandAKind === "cas" || operandBKind === "cas") return "CHEMICAL";
  if (operandAKind === "group" || operandBKind === "group") return "GROUP";
  return "HAZARD";
}

function buildGroupMatchSet(subject: CompatibilitySubject): Set<string> {
  const set = new Set<string>();
  for (const group of subject.groups) {
    const id = normalizeGroupId(group);
    if (id) set.add(id);
    for (const canonical of resolveCategorySlug(group)) {
      set.add(canonical);
    }
  }
  return set;
}

function groupOperandMatches(subject: CompatibilitySubject, value: string): boolean {
  const target = normalizeGroupId(value);
  if (!target) return false;

  const matchSet = buildGroupMatchSet(subject);
  if (matchSet.has(target)) return true;

  for (const canonical of resolveCategorySlug(target)) {
    if (matchSet.has(canonical)) return true;
  }
  return false;
}

function hazardOperandMatches(subject: CompatibilitySubject, value: string): boolean {
  const target = normalizeGroupId(value);
  if (!target) return false;
  return subject.hazards.some((hazard) => normalizeGroupId(hazard) === target);
}

function operandMatchesSubject(
  kind: CompatibilityOperandKind,
  value: string,
  subject: CompatibilitySubject,
): boolean {
  const normalized = value.trim();
  if (!normalized) return false;

  if (kind === "cas") {
    return Boolean(subject.casNumber && subject.casNumber === normalized);
  }
  if (kind === "group") {
    return groupOperandMatches(subject, normalized);
  }
  return hazardOperandMatches(subject, normalized);
}

export function ruleMatchesSubjects(
  rule: CompatibilityRuleView,
  subjectA: CompatibilitySubject,
  subjectB: CompatibilitySubject,
): boolean {
  const forward =
    operandMatchesSubject(rule.operandAKind, rule.operandAValue, subjectA) &&
    operandMatchesSubject(rule.operandBKind, rule.operandBValue, subjectB);
  const reverse =
    operandMatchesSubject(rule.operandAKind, rule.operandAValue, subjectB) &&
    operandMatchesSubject(rule.operandBKind, rule.operandBValue, subjectA);
  const matched = forward || reverse;
  if (!matched) return false;

  if (
    rule.code === "FLAMMABLE_ACID" &&
    subjectA.hazards.some((h) => normalizeGroupId(h) === "ACID") &&
    subjectB.hazards.some((h) => normalizeGroupId(h) === "ACID")
  ) {
    return false;
  }

  return true;
}

function pickHighestTierRules(matched: CompatibilityRuleView[]): CompatibilityRuleView[] {
  if (!matched.length) return [];

  let maxPrecedence = 0;
  for (const rule of matched) {
    maxPrecedence = Math.max(maxPrecedence, RULE_TYPE_PRECEDENCE[rule.ruleType] ?? 0);
  }

  const tierRules = matched.filter(
    (rule) => (RULE_TYPE_PRECEDENCE[rule.ruleType] ?? 0) === maxPrecedence,
  );
  return Array.from(new Map(tierRules.map((r) => [r.code, r])).values());
}

export function evaluateCompatibility(
  subjectA: CompatibilitySubject,
  subjectB: CompatibilitySubject,
  rules: CompatibilityRuleView[],
): CompatibilityEvaluation {
  const matched = rules.filter((rule) => ruleMatchesSubjects(rule, subjectA, subjectB));
  if (!matched.length) {
    return { status: "unknown", rules: [], tier: null };
  }

  const tierRules = pickHighestTierRules(matched);
  return {
    status: "conflict",
    rules: tierRules,
    tier: tierRules[0]?.ruleType ?? null,
  };
}

export function evaluateGroupCompatibility(
  subjectA: CompatibilitySubject,
  subjectB: CompatibilitySubject,
  rules: CompatibilityRuleView[],
): CompatibilityEvaluation {
  const groupRules = rules.filter((rule) => rule.ruleType === "GROUP");
  return evaluateCompatibility(subjectA, subjectB, groupRules);
}

export function subjectFromCategory(groupId: string): CompatibilitySubject {
  const id = normalizeGroupId(groupId);
  if (!id) {
    return { groups: [], hazards: [] };
  }
  const expanded = expandCategorySlugs([id]);
  const groups = [...new Set([id, ...expanded])];
  return { groups, hazards: [] };
}

export function subjectFromChemical(
  casNumber: string,
  hazardCategories: string[],
): CompatibilitySubject {
  return {
    casNumber,
    groups: [],
    hazards: hazardCategories.map((category) => normalizeGroupId(category)).filter(Boolean),
  };
}
