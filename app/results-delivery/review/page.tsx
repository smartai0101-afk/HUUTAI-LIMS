import { DeliveryReviewClient } from "@/components/results-delivery/DeliveryReviewClient";
import { listReportsForReview } from "@/lib/services/results-delivery/test-report";

export const dynamic = "force-dynamic";

export default async function DeliveryReviewPage() {
  const reports = await listReportsForReview();
  return <DeliveryReviewClient reports={reports} />;
}
