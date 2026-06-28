import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { PreparedChemicalsClient } from "@/components/prepared-chemicals/PreparedChemicalsClient";
import { getChemicals } from "@/lib/services/chemicals";
import { getRecentEnvironmentalLogs } from "@/lib/services/environmental-logs";
import {
  listPreparedChemicals,
  parsePreparedListParams,
  PREPARED_CHEMICAL_SORT_ALLOWLIST,
} from "@/lib/services/prepared-list";
import { getActiveStaff } from "@/lib/services/staff";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listQuery = parsePreparedListParams(params, PREPARED_CHEMICAL_SORT_ALLOWLIST);
  const [result, chemicals, staff, environmentalLogs] = await Promise.all([
    listPreparedChemicals(listQuery),
    getChemicals(),
    getActiveStaff(),
    getRecentEnvironmentalLogs(),
  ]);

  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        </AppShell>
      }
    >
      <PreparedChemicalsClient
        result={result}
        listQuery={listQuery}
        chemicals={chemicals}
        staff={staff}
        environmentalLogs={environmentalLogs}
      />
    </Suspense>
  );
}
