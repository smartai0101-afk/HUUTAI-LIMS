import { Suspense } from "react";
import { EnvironmentalLogsClient } from "@/components/environment/EnvironmentalLogsClient";
import { listEnvironmentalLogs, parseEnvironmentalLogListParams } from "@/lib/services/environmental-logs";
import { getActiveStaff } from "@/lib/services/staff";

export const dynamic = "force-dynamic";

export default async function EnvironmentLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listQuery = parseEnvironmentalLogListParams(params);
  const [listResult, staff] = await Promise.all([listEnvironmentalLogs(listQuery), getActiveStaff()]);
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <EnvironmentalLogsClient listResult={listResult} listQuery={listQuery} staff={staff} />
    </Suspense>
  );
}
