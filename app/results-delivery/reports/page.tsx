import { ReportsListClient } from "@/components/results-delivery/ReportsListClient";
import { listReports } from "@/lib/services/results-delivery/test-report";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const partialOnly = params.partial === "1" || params.partial === "true";
  const reports = await listReports({ partialOnly });
  return <ReportsListClient reports={reports} partialOnly={partialOnly} />;
}
