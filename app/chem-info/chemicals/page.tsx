import { Suspense } from "react";
import { ChemicalLookupClient } from "@/components/chem-info/ChemicalLookupClient";
import {
  listChemicalReferences,
  parseChemicalReferenceListParams,
} from "@/lib/services/chem-info/chemical-references";

export const dynamic = "force-dynamic";

export default async function ChemicalLookupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listQuery = parseChemicalReferenceListParams(params);
  const result = await listChemicalReferences(listQuery);
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <ChemicalLookupClient result={result} listQuery={listQuery} />
    </Suspense>
  );
}
