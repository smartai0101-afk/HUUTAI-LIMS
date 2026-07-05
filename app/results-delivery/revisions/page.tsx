import { RevisionsClient } from "@/components/results-delivery/RevisionsClient";
import { listReportRevisions } from "@/lib/services/results-delivery/test-report";

export const dynamic = "force-dynamic";

export default async function RevisionsPage() {
  const revisions = await listReportRevisions();
  return <RevisionsClient revisions={revisions} />;
}
