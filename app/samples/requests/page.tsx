import { Suspense } from "react";
import { SampleRequestsClient } from "@/components/samples/SampleRequestsClient";
import { listSampleRequests, parseSampleRequestListParams } from "@/lib/services/samples/sample-requests";

export const dynamic = "force-dynamic";

export default async function SampleRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listQuery = parseSampleRequestListParams(params);
  const result = await listSampleRequests(listQuery);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <SampleRequestsClient result={result} listQuery={listQuery} />
    </Suspense>
  );
}
