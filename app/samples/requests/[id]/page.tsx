import { notFound } from "next/navigation";
import { SampleRequestFormClient } from "@/components/samples/SampleRequestFormClient";
import { listMethodOptions } from "@/lib/services/samples/sample-detail";
import { getSampleRequestDetail } from "@/lib/services/samples/sample-requests";
import { listRequestSampleLines } from "@/lib/services/samples/request-sample-lines";
import { listSampleMatrixGroups } from "@/lib/services/catalog/sample-matrix-groups";
import { listSampleMatrices } from "@/lib/services/catalog/sample-matrices";

export const dynamic = "force-dynamic";

export default async function SampleRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, methodOptions, matrices, matrixGroups, lines] = await Promise.all([
    getSampleRequestDetail(id),
    listMethodOptions(),
    listSampleMatrices(),
    listSampleMatrixGroups(),
    listRequestSampleLines(id),
  ]);
  if (!detail) notFound();
  return (
    <SampleRequestFormClient
      methodOptions={methodOptions}
      matrices={matrices}
      matrixGroups={matrixGroups}
      initial={detail}
      initialLines={lines}
    />
  );
}
