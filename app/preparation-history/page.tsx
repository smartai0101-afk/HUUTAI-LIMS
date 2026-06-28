import { Suspense } from "react";
import { PreparationHistoryReportClient } from "@/components/preparation/PreparationHistoryReportClient";
import {
  listPreparationHistoryReportRows,
  parsePreparationHistoryListParams,
} from "@/lib/services/preparation-history-report";

export default async function PreparationHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const listQuery = parsePreparationHistoryListParams(params);
  const result = await listPreparationHistoryReportRows(listQuery);

  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-slate-100" />}>
      <PreparationHistoryReportClient result={result} listQuery={listQuery} />
    </Suspense>
  );
}
