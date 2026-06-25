import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { MicrobialStrainsClient } from "@/components/microbial-strains/MicrobialStrainsClient";
import { getMicrobialStrains, getStrainGroups } from "@/lib/services/microbial-strains";

export default async function MicrobialStrainsPage() {
  const [items, groupOptions] = await Promise.all([getMicrobialStrains(), getStrainGroups()]);

  return (
    <Suspense fallback={<AppShell><div className="h-40 animate-pulse rounded-2xl bg-slate-100" /></AppShell>}>
      <MicrobialStrainsClient items={items} groupOptions={groupOptions} />
    </Suspense>
  );
}
