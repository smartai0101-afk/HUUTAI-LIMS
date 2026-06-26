import { PreparationHistoryReportClient } from "@/components/preparation/PreparationHistoryReportClient";
import { getPreparationHistoryReportRows } from "@/lib/services/preparation-history-report";

export default async function PreparationHistoryPage() {
  const rows = await getPreparationHistoryReportRows();
  return <PreparationHistoryReportClient rows={rows} />;
}
