import { AnalysisInboxClient } from "@/components/analysis/AnalysisInboxClient";
import { listInboxAssignments } from "@/lib/services/analysis/analysis-inbox";

export const dynamic = "force-dynamic";

export default async function AnalysisInboxPage() {
  const rows = await listInboxAssignments();
  return <AnalysisInboxClient rows={rows} />;
}
