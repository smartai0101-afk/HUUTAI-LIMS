import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { StatisticsClient } from "@/components/statistics/StatisticsClient";
import { getInventoryStatistics } from "@/lib/services/statistics";

export default async function ContainersPage() {
  const items = await getInventoryStatistics();

  return (
    <Suspense fallback={<AppShell><div className="h-40 animate-pulse rounded-2xl bg-slate-100" /></AppShell>}>
      <StatisticsClient items={items} />
    </Suspense>
  );
}
