import { notFound } from "next/navigation";
import { SampleEditClient } from "@/components/samples/SampleEditClient";
import { getSampleDetail } from "@/lib/services/samples/sample-detail";

export const dynamic = "force-dynamic";

export default async function SampleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sample = await getSampleDetail(id);
  if (!sample) notFound();
  return <SampleEditClient sample={sample} />;
}
