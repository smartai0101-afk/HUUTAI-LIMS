import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { ChemicalsClient } from "@/components/chemicals/ChemicalsClient";
import { getChemicalGroups, getChemicals } from "@/lib/services/chemicals";

export default async function ChemicalsPage() {
  const [items, groupOptions] = await Promise.all([getChemicals(), getChemicalGroups()]);

  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        </AppShell>
      }
    >
      <ChemicalsClient items={items} groupOptions={groupOptions} />
    </Suspense>
  );
}
