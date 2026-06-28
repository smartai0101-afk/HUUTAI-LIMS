-- Compatibility rule engine v2: typed operands

ALTER TABLE "compatibility_rules" ADD COLUMN "ruleType" TEXT NOT NULL DEFAULT 'HAZARD';
ALTER TABLE "compatibility_rules" ADD COLUMN "operandAKind" TEXT NOT NULL DEFAULT 'hazard';
ALTER TABLE "compatibility_rules" ADD COLUMN "operandAValue" TEXT NOT NULL DEFAULT '';
ALTER TABLE "compatibility_rules" ADD COLUMN "operandBKind" TEXT NOT NULL DEFAULT 'hazard';
ALTER TABLE "compatibility_rules" ADD COLUMN "operandBValue" TEXT NOT NULL DEFAULT '';

UPDATE "compatibility_rules" SET
  "operandAKind" = 'hazard',
  "operandAValue" = "categoryA",
  "operandBKind" = 'hazard',
  "operandBValue" = "categoryB",
  "ruleType" = 'HAZARD'
WHERE "operandAValue" = '';

CREATE INDEX "compatibility_rules_ruleType_idx" ON "compatibility_rules"("ruleType");
CREATE INDEX "compatibility_rules_operandAKind_operandAValue_idx" ON "compatibility_rules"("operandAKind", "operandAValue");
CREATE INDEX "compatibility_rules_operandBKind_operandBValue_idx" ON "compatibility_rules"("operandBKind", "operandBValue");
