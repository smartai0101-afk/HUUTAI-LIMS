import { Suspense } from "react";
import { SampleAssignClient } from "@/components/samples/SampleAssignClient";
import { AssignmentHubClient } from "@/components/samples/AssignmentHubClient";
import {
  getSampleAssignmentContext,
  listLabDepartments,
} from "@/lib/services/samples/analysis-assignment";
import { listSamplesForAssign } from "@/lib/services/samples/sample-list";
import { listSampleTestsForAssignment } from "@/lib/services/samples/sample-test-assignment";

export const dynamic = "force-dynamic";

export default async function SampleAssignPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sampleId = typeof params.sampleId === "string" ? params.sampleId : undefined;

  const [samples, departments, sampleTests] = await Promise.all([
    listSamplesForAssign(),
    listLabDepartments(),
    listSampleTestsForAssignment(),
  ]);

  const resolvedSampleId = sampleId ?? samples[0]?.id;
  const initialContext = resolvedSampleId
    ? await getSampleAssignmentContext(resolvedSampleId)
    : null;

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Phân công theo sample_test</h2>
          <AssignmentHubClient items={sampleTests} departments={departments} />
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Phân công theo nhóm (legacy)</h2>
          <SampleAssignClient
            samples={samples}
            departments={departments}
            initialContext={initialContext}
            initialSampleId={sampleId}
          />
        </section>
      </div>
    </Suspense>
  );
}
