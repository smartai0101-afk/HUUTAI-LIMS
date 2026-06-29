import { ReportHistoryClient } from "@/components/results-delivery/ReportHistoryClient";
import { listReportHistory } from "@/lib/services/results-delivery/test-report";

export const dynamic = "force-dynamic";

export default async function ReportHistoryPage() {
  const rows = await listReportHistory();
  return <ReportHistoryClient rows={rows} />;
}
