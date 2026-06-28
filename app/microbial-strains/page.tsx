import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { MicrobialStrainsClient } from "@/components/microbial-strains/MicrobialStrainsClient";
import { getStrainGroups } from "@/lib/services/microbial-strains";
import { listCatalogLotRows, parseCatalogListParams } from "@/lib/services/catalog-lot-list";

export default async function MicrobialStrainsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listQuery = parseCatalogListParams(params);
  const [result, groupOptions] = await Promise.all([
    listCatalogLotRows("strain", listQuery),
    getStrainGroups(),
  ]);

  return (
    <Suspense fallback={<AppShell><div className="h-40 animate-pulse rounded-2xl bg-slate-100" /></AppShell>}>
      <MicrobialStrainsClient result={result} groupOptions={groupOptions} listQuery={listQuery} />
    </Suspense>
  );
}
