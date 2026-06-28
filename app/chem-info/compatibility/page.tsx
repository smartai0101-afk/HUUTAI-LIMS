import { CompatibilityCheckerClient } from "@/components/chem-info/CompatibilityCheckerClient";
import { listCompatibilityRules } from "@/lib/services/chem-info/compatibility";
import { listChemicalReferenceOptions } from "@/lib/services/chem-info/chemical-references";
import { HAZARD_CATEGORIES } from "@/lib/chem-info-labels";

export const dynamic = "force-dynamic";

export default async function CompatibilityPage() {
  const [rules, chemicalOptions] = await Promise.all([
    listCompatibilityRules(),
    listChemicalReferenceOptions(),
  ]);
  return (
    <CompatibilityCheckerClient
      rules={rules}
      categoryOptions={HAZARD_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))}
      chemicalOptions={chemicalOptions}
    />
  );
}
