import type { Prisma, StockInSourceType } from "@prisma/client";
import { LOT_SELECTION_REQUIRED_MESSAGE } from "@/lib/inventory-lot-policy";

type ResolvedLot = {
  stockLotId: string | null;
  lotNumber: string;
};

function masterWhere(sourceType: StockInSourceType, masterId: string) {
  if (sourceType === "Chemical") return { chemicalId: masterId };
  if (sourceType === "Standard") return { standardId: masterId };
  return { microbialStrainId: masterId };
}

export async function resolveStockLotSelection(
  tx: Prisma.TransactionClient,
  sourceType: StockInSourceType,
  masterId: string,
  stockLotId?: string | null,
  lotNumber?: string | null,
): Promise<ResolvedLot | { error: string }> {
  const lots = await tx.stockLot.findMany({
    where: masterWhere(sourceType, masterId),
    orderBy: [{ expiryDate: "asc" }, { lot: "asc" }],
  });

  if (lots.length === 0) {
    return { stockLotId: null, lotNumber: lotNumber?.trim() ?? "" };
  }

  if (lots.length === 1) {
    const lot = lots[0]!;
    return { stockLotId: lot.id, lotNumber: lot.lot };
  }

  const pickedId = stockLotId?.trim();
  if (!pickedId) {
    return { error: LOT_SELECTION_REQUIRED_MESSAGE };
  }

  const picked = lots.find((lot) => lot.id === pickedId);
  if (!picked) {
    return { error: "Lot được chọn không thuộc vật tư gốc này" };
  }

  return { stockLotId: picked.id, lotNumber: picked.lot };
}
