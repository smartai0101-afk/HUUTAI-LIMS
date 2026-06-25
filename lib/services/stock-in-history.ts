import type { StockInSourceType } from "@prisma/client";
import { db } from "@/lib/db";
import { stockInSourceLabel } from "@/lib/services/stock-in-match";
import type { StockInLogView } from "@/types";

function formatDateTime(value: Date): string {
  return value.toISOString();
}

export async function getStockInHistory(sourceType?: StockInSourceType): Promise<StockInLogView[]> {
  const rows = await db.stockInLog.findMany({
    where: sourceType ? { sourceType } : undefined,
    orderBy: { time: "desc" },
    take: 500,
  });

  return rows.map((row) => ({
    id: row.id,
    time: formatDateTime(row.time),
    user: row.user,
    sourceType: row.sourceType,
    sourceLabel: stockInSourceLabel(row.sourceType),
    sourceCode: row.sourceCode,
    sourceName: row.sourceName,
    lot: row.lot,
    quantityIn: row.quantityIn,
    unit: row.unit,
    notes: row.notes,
    referenceId: row.referenceId,
  }));
}
