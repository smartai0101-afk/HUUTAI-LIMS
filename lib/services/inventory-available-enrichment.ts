import type { InventorySourceType } from "@prisma/client";
import { db } from "@/lib/db";
import { getAvailableQuantity } from "@/lib/services/inventory-transaction-engine";
import type { StockLotView } from "@/types";

export async function enrichStockLotsWithAvailable(
  sourceType: InventorySourceType,
  sourceId: string,
  stockLots: StockLotView[],
): Promise<StockLotView[]> {
  return Promise.all(
    stockLots.map(async (lot) => ({
      ...lot,
      availableQuantity: await getAvailableQuantity(db, {
        sourceType,
        sourceId,
        stockLotId: lot.id,
      }),
    })),
  );
}

export async function enrichItemWithAvailable(
  sourceType: InventorySourceType,
  sourceId: string,
  stockLots: StockLotView[],
): Promise<{ quantity: number; stockLots: StockLotView[] }> {
  const [quantity, enrichedLots] = await Promise.all([
    getAvailableQuantity(db, { sourceType, sourceId }),
    enrichStockLotsWithAvailable(sourceType, sourceId, stockLots),
  ]);
  return { quantity, stockLots: enrichedLots };
}
