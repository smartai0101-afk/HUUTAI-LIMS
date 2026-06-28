"use server";

import {
  listInventoryLedger,
  type InventoryLedgerListParams,
  type InventoryLedgerRow,
} from "@/lib/services/inventory-ledger";
import {
  filterPreparationHistoryReportRows,
  getPreparationHistoryReportRows,
  type PreparationHistoryListParams,
  type PreparationHistoryReportRow,
} from "@/lib/services/preparation-history-report";
import { listUsageLogs, type UsageLogListParams } from "@/lib/services/usage-logs";
import type { UsageLogView } from "@/types";

export async function fetchInventoryLedgerExport(
  params: InventoryLedgerListParams,
): Promise<InventoryLedgerRow[]> {
  const { items } = await listInventoryLedger(params, false);
  return items;
}

export async function fetchUsageLogsExport(params: UsageLogListParams): Promise<UsageLogView[]> {
  const { items } = await listUsageLogs(params, false);
  return items;
}

export async function fetchPreparationHistoryExport(
  params: PreparationHistoryListParams,
): Promise<PreparationHistoryReportRow[]> {
  const rows = await getPreparationHistoryReportRows();
  return filterPreparationHistoryReportRows(rows, params);
}
