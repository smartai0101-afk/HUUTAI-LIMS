import { IssuedReportsClient } from "@/components/results-delivery/IssuedReportsClient";
import { listIssuedReports } from "@/lib/services/results-delivery/test-report";

export const dynamic = "force-dynamic";

export default async function IssuedReportsPage() {
  const rows = await listIssuedReports();
  return <IssuedReportsClient rows={rows} />;
}
