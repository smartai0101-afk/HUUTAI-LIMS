import { SampleTrackingClient } from "@/components/samples/SampleTrackingClient";
import { listSamplesForTracking } from "@/lib/services/samples/sample-list";

export const dynamic = "force-dynamic";

export default async function SampleTrackingPage() {
  const samples = await listSamplesForTracking();
  return <SampleTrackingClient samples={samples} />;
}
