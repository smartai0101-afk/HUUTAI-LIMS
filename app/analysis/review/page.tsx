import { ReviewClient } from "@/components/analysis/ReviewClient";
import { listReviewQueue } from "@/lib/services/analysis/review";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const rows = await listReviewQueue();
  return <ReviewClient rows={rows} />;
}
