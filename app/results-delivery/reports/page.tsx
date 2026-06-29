import { ReportsListClient } from "@/components/results-delivery/ReportsListClient";
import { listReports } from "@/lib/services/results-delivery/test-report";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = await listReports();
  return <ReportsListClient reports={reports} />;
}
