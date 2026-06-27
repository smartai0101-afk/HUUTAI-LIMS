import { db } from "@/lib/db";
import { toDateString } from "@/lib/mappers";

export type InventoryLedgerRow = {
  id: string;
  time: string;
  user: string;
  module: string;
  sourceType: string;
  sourceCode: string;
  stockLotId: string | null;
  lotNumber: string;
  quantityBefore: number;
  quantityUsed: number;
  quantityAfter: number;
  unit: string;
  actionType: string;
  transactionType: string;
  reason: string;
  referenceType: string;
  referenceId: string;
  notes: string;
};

export async function getInventoryLedgerRows(limit = 200): Promise<InventoryLedgerRow[]> {
  const rows = await db.inventoryTransaction.findMany({
    orderBy: { time: "desc" },
    take: limit,
  });

  const lotIds = [...new Set(rows.map((r) => r.stockLotId).filter(Boolean))] as string[];
  const lots =
    lotIds.length > 0
      ? await db.stockLot.findMany({
          where: { id: { in: lotIds } },
          select: { id: true, lot: true },
        })
      : [];
  const lotMap = new Map(lots.map((l) => [l.id, l.lot]));

  return rows.map((row) => ({
    id: row.id,
    time: toDateString(row.time) + " " + row.time.toISOString().slice(11, 19),
    user: row.user,
    module: row.module,
    sourceType: row.sourceType,
    sourceCode: row.sourceCode,
    stockLotId: row.stockLotId,
    lotNumber: row.stockLotId ? lotMap.get(row.stockLotId) ?? "" : "",
    quantityBefore: row.quantityBefore,
    quantityUsed: row.quantityUsed,
    quantityAfter: row.quantityAfter,
    unit: row.unit,
    actionType: row.actionType,
    transactionType: row.transactionType ?? "",
    reason: row.reason,
    referenceType: row.referenceType,
    referenceId: row.referenceId,
    notes: row.notes,
  }));
}
