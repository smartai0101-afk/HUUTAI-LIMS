import { Suspense } from "react";
import { SampleAssignClient } from "@/components/samples/SampleAssignClient";
import {
  getSampleAssignmentContext,
  listLabDepartments,
} from "@/lib/services/samples/analysis-assignment";
import { listSamplesForAssign } from "@/lib/services/samples/sample-list";

export const dynamic = "force-dynamic";

export default async function SampleAssignPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sampleId = typeof params.sampleId === "string" ? params.sampleId : undefined;

  const [samples, departments] = await Promise.all([
    listSamplesForAssign(),
    listLabDepartments(),
  ]);

  const resolvedSampleId = sampleId ?? samples[0]?.id;
  const initialContext = resolvedSampleId
    ? await getSampleAssignmentContext(resolvedSampleId)
    : null;

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <SampleAssignClient
        samples={samples}
        departments={departments}
        initialContext={initialContext}
        initialSampleId={sampleId}
      />
    </Suspense>
  );
}
