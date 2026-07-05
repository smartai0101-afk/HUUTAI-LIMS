import { SampleRequestFormClient } from "@/components/samples/SampleRequestFormClient";
import { listMethodOptions } from "@/lib/services/samples/sample-detail";
import { listSampleMatrixGroups } from "@/lib/services/catalog/sample-matrix-groups";
import { listSampleMatrices } from "@/lib/services/catalog/sample-matrices";

export const dynamic = "force-dynamic";

export default async function NewSampleRequestPage() {
  const [methodOptions, matrices, matrixGroups] = await Promise.all([
    listMethodOptions(),
    listSampleMatrices(),
    listSampleMatrixGroups(),
  ]);
  return (
    <SampleRequestFormClient
      methodOptions={methodOptions}
      matrices={matrices}
      matrixGroups={matrixGroups}
    />
  );
}
