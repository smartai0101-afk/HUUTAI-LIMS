import { notFound } from "next/navigation";
import { SampleRequestFormClient } from "@/components/samples/SampleRequestFormClient";
import { listMethodOptions } from "@/lib/services/samples/sample-detail";
import { getSampleRequestDetail } from "@/lib/services/samples/sample-requests";

export const dynamic = "force-dynamic";

export default async function SampleRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, methodOptions] = await Promise.all([
    getSampleRequestDetail(id),
    listMethodOptions(),
  ]);
  if (!detail) notFound();
  return <SampleRequestFormClient methodOptions={methodOptions} initial={detail} />;
}
