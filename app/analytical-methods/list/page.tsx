import { Suspense } from "react";
import { MethodListClient } from "@/components/analytical-methods/MethodListClient";
import { listAnalyticalMethods, parseMethodListParams } from "@/lib/services/analytical-methods/methods";

export const dynamic = "force-dynamic";

export default async function AnalyticalMethodsListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listResult = await listAnalyticalMethods(parseMethodListParams(params));
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <MethodListClient listResult={listResult} />
    </Suspense>
  );
}
