import { PendingReleaseClient } from "@/components/results-delivery/PendingReleaseClient";
import { listPendingRelease } from "@/lib/services/results-delivery/test-report";

export const dynamic = "force-dynamic";

export default async function PendingReleasePage() {
  const rows = await listPendingRelease();
  return <PendingReleaseClient rows={rows} />;
}
