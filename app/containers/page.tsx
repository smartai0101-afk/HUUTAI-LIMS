import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { StatisticsClient } from "@/components/statistics/StatisticsClient";
import { listInventoryStatistics, parseInventoryStatisticsListParams } from "@/lib/services/statistics";

export default async function ContainersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listQuery = parseInventoryStatisticsListParams(params);
  const listResult = await listInventoryStatistics(listQuery);

  return (
    <Suspense fallback={<AppShell><div className="h-40 animate-pulse rounded-2xl bg-slate-100" /></AppShell>}>
      <StatisticsClient listResult={listResult} listQuery={listQuery} />
    </Suspense>
  );
}
