import { IssuedReportsClient } from "@/components/results-delivery/IssuedReportsClient";
import { listIssuedReports } from "@/lib/services/results-delivery/test-report";

export const dynamic = "force-dynamic";

export default async function CustomerReportsPage() {
  const rows = await listIssuedReports();
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm text-cyan-900">
        Cổng tra cứu kết quả — chỉ xem các báo cáo đã phát hành.
      </div>
      <IssuedReportsClient rows={rows} />
    </div>
  );
}
