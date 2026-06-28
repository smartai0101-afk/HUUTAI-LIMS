import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { StandardsClient } from "@/components/standards/StandardsClient";
import { getStandardGroups } from "@/lib/services/standards";
import { listCatalogLotRows, parseCatalogListParams } from "@/lib/services/catalog-lot-list";

export default async function StandardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listQuery = parseCatalogListParams(params);
  const [result, groupOptions] = await Promise.all([
    listCatalogLotRows("standard", listQuery),
    getStandardGroups(),
  ]);

  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        </AppShell>
      }
    >
      <StandardsClient result={result} groupOptions={groupOptions} listQuery={listQuery} />
    </Suspense>
  );
}
