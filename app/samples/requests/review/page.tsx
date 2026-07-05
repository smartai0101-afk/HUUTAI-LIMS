import { SampleRequestReviewClient } from "@/components/samples/SampleRequestReviewClient";
import { listSubmittedRequestsForReview } from "@/lib/services/samples/sample-requests";

export const dynamic = "force-dynamic";

export default async function SampleRequestReviewPage() {
  const requests = await listSubmittedRequestsForReview();
  return <SampleRequestReviewClient requests={requests} />;
}
