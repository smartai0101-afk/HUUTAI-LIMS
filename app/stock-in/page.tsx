import { Suspense } from "react";
import { StockInClient } from "@/components/stock-in/StockInClient";
import { getChemicalGroups } from "@/lib/services/chemicals";
import { getStrainGroups } from "@/lib/services/microbial-strains";
import { getActiveStaff } from "@/lib/services/staff";
import { getStandardGroups } from "@/lib/services/standards";
import { listStockInHistory, parseStockInHistoryListParams } from "@/lib/services/stock-in-history";
import { getStockInMasterOptions } from "@/lib/services/stock-in-options";

export default async function StockInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const historyListQuery = parseStockInHistoryListParams(params);

  const [masterOptions, historyResult, staff, chemicalGroups, standardGroups, strainGroups] =
    await Promise.all([
      getStockInMasterOptions(),
      listStockInHistory(historyListQuery),
      getActiveStaff(),
      getChemicalGroups(),
      getStandardGroups(),
      getStrainGroups(),
    ]);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <StockInClient
        masterOptions={masterOptions}
        historyResult={historyResult}
        historyListQuery={historyListQuery}
        staff={staff}
        chemicalGroups={chemicalGroups}
        standardGroups={standardGroups}
        strainGroups={strainGroups}
      />
    </Suspense>
  );
}
