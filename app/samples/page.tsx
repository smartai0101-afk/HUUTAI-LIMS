import { Suspense } from "react";
import { SamplesListClient } from "@/components/samples/SamplesListClient";
import {
  getSampleTypeOptions,
  listSamples,
  parseSampleListParams,
} from "@/lib/services/samples/sample-list";
import { listMethodOptions } from "@/lib/services/samples/sample-detail";

export const dynamic = "force-dynamic";

export default async function SamplesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listQuery = parseSampleListParams(params);
  const [result, sampleTypeOptions, methodOptions] = await Promise.all([
    listSamples(listQuery),
    getSampleTypeOptions(),
    listMethodOptions(),
  ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <SamplesListClient
        result={result}
        listQuery={listQuery}
        sampleTypeOptions={sampleTypeOptions}
        methodOptions={methodOptions.map((m) => ({
          id: m.id,
          methodCode: m.methodCode,
          methodName: m.methodName,
        }))}
      />
    </Suspense>
  );
}
