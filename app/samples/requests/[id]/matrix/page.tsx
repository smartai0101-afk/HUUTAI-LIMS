import { RequestMatrixClient } from "@/components/samples/request/RequestMatrixClient";
import { getSampleTestMatrixView } from "@/lib/services/samples/request-sample-lines";
import { getSampleRequestDetail } from "@/lib/services/samples/sample-requests";

export const dynamic = "force-dynamic";

export default async function RequestMatrixPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, matrix] = await Promise.all([
    getSampleRequestDetail(id),
    getSampleTestMatrixView(id),
  ]);
  if (!detail) return null;
  return (
    <RequestMatrixClient
      requestId={id}
      requestCode={detail.requestCode}
      matrix={matrix}
      readOnly={detail.status !== "Draft"}
    />
  );
}
