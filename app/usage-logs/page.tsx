import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { UsageLogsClient } from "@/components/usage-logs/UsageLogsClient";
import { getActiveStaff } from "@/lib/services/staff";
import { getUsageLogItemOptions } from "@/lib/services/usage-log-options";
import {
  getUsageStatsByEmployee,
  getUsageStatsByItem,
  getUsageStatsByPeriod,
  getUsageStatsByPurpose,
  getUsageStatsEmployeeNames,
} from "@/lib/services/usage-log-stats";
import { getUsageLogs } from "@/lib/services/usage-logs";
import { usageStatsDateRange, type UsageStatsPeriodPreset } from "@/lib/usage-log-fields";

function parseStatsPeriod(value: string | undefined): UsageStatsPeriodPreset {
  if (value === "7d" || value === "30d" || value === "90d" || value === "all") return value;
  return "30d";
}

export default async function UsageLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; tab?: string; sourceType?: string; code?: string; openForm?: string }>;
}) {
  const params = await searchParams;
  const statsPeriod = parseStatsPeriod(params.period);
  const dateRange = usageStatsDateRange(statsPeriod);

  const periodStatsDay = await getUsageStatsByPeriod(dateRange, "day");
  const periodStatsWeek = await getUsageStatsByPeriod(dateRange, "week");
  const periodStatsMonth = await getUsageStatsByPeriod(dateRange, "month");

  const [items, itemOptions, staff, employeeStats, itemStats, purposeStats, employeeNames] = await Promise.all([
    getUsageLogs(),
    getUsageLogItemOptions(),
    getActiveStaff(),
    getUsageStatsByEmployee(dateRange),
    getUsageStatsByItem(dateRange),
    getUsageStatsByPurpose(dateRange),
    getUsageStatsEmployeeNames(dateRange),
  ]);

  return (
    <Suspense fallback={<AppShell><div className="h-40 animate-pulse rounded-2xl bg-slate-100" /></AppShell>}>
      <UsageLogsClient
        items={items}
        itemOptions={itemOptions}
        staff={staff}
        employeeStats={employeeStats}
        itemStats={itemStats}
        periodStatsByDay={periodStatsDay}
        periodStatsByWeek={periodStatsWeek}
        periodStatsByMonth={periodStatsMonth}
        purposeStats={purposeStats}
        employeeNames={employeeNames}
        statsPeriod={statsPeriod}
      />
    </Suspense>
  );
}
