import { SampleRequestFormClient } from "@/components/samples/SampleRequestFormClient";
import { listMethodOptions } from "@/lib/services/samples/sample-detail";

export const dynamic = "force-dynamic";

export default async function NewSampleRequestPage() {
  const methodOptions = await listMethodOptions();
  return <SampleRequestFormClient methodOptions={methodOptions} />;
}
