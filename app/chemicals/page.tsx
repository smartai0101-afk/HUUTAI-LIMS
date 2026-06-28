import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { ChemicalsClient } from "@/components/chemicals/ChemicalsClient";
import { getChemicalGroups } from "@/lib/services/chemicals";
import { listCatalogLotRows, parseCatalogListParams } from "@/lib/services/catalog-lot-list";

export default async function ChemicalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listQuery = parseCatalogListParams(params);
  const [result, groupOptions] = await Promise.all([
    listCatalogLotRows("chemical", listQuery),
    getChemicalGroups(),
  ]);

  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        </AppShell>
      }
    >
      <ChemicalsClient result={result} groupOptions={groupOptions} listQuery={listQuery} />
    </Suspense>
  );
}
