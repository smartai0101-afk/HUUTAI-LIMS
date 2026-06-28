import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { PreparedStandardsClient } from "@/components/prepared-standards/PreparedStandardsClient";
import { getEquipmentOptions } from "@/lib/services/equipment-options";
import { getRecentEnvironmentalLogs } from "@/lib/services/environmental-logs";
import { getPreparedStandardCatalog } from "@/lib/services/prepared-standards";
import {
  listPreparedStandards,
  parsePreparedListParams,
  PREPARED_STANDARD_SORT_ALLOWLIST,
} from "@/lib/services/prepared-list";
import { getActiveStaff } from "@/lib/services/staff";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listQuery = parsePreparedListParams(params, PREPARED_STANDARD_SORT_ALLOWLIST);
  const [result, catalog, staff, equipmentOptions, environmentalLogs] = await Promise.all([
    listPreparedStandards(listQuery),
    getPreparedStandardCatalog(),
    getActiveStaff(),
    getEquipmentOptions(),
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
      <PreparedStandardsClient
        result={result}
        listQuery={listQuery}
        standards={catalog.standards}
        preparedStandards={catalog.preparedStandards}
        levelCounts={catalog.levelCounts}
        chemicals={catalog.chemicals}
        staff={staff}
        equipmentOptions={equipmentOptions}
        environmentalLogs={environmentalLogs}
      />
    </Suspense>
  );
}
