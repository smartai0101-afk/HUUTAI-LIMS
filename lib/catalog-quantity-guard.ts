import type { Prisma } from "@prisma/client";
import type { StockInSourceType } from "@prisma/client";

export const CATALOG_QUANTITY_LOCKED_MESSAGE =
  "Vật tư đã có lot trong kho — không thể sửa tồn trực tiếp. Dùng Nhập kho hoặc Nhật ký sử dụng.";

export async function masterHasStockLots(
  tx: Prisma.TransactionClient,
  sourceType: StockInSourceType,
  masterId: string,
): Promise<boolean> {
  const count = await tx.stockLot.count({
    where:
      sourceType === "Chemical"
        ? { chemicalId: masterId }
        : sourceType === "Standard"
          ? { standardId: masterId }
          : { microbialStrainId: masterId },
  });
  return count > 0;
}

export function quantityChangeBlocked(
  hasLots: boolean,
  beforeQty: number,
  afterQty: number,
): string | null {
  if (!hasLots) return null;
  if (Math.abs(beforeQty - afterQty) > 1e-9) {
    return CATALOG_QUANTITY_LOCKED_MESSAGE;
  }
  return null;
}
