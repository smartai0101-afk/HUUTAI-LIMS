import type {
  InventoryLifecycleStatus,
  InventorySourceType,
  Prisma,
} from "@prisma/client";
import { roundStockQuantity } from "@/lib/inventory-units";

type Tx = Prisma.TransactionClient;

export async function setInventoryLifecycleStatus(
  tx: Tx,
  sourceType: InventorySourceType,
  sourceId: string,
  status: InventoryLifecycleStatus,
) {
  if (sourceType === "Chemical") {
    await tx.chemical.update({ where: { id: sourceId }, data: { inventoryStatus: status } });
    return;
  }
  if (sourceType === "Standard") {
    await tx.standard.update({ where: { id: sourceId }, data: { inventoryStatus: status } });
    return;
  }
  if (sourceType === "MicrobialStrain") {
    await tx.microbialStrain.update({
      where: { id: sourceId },
      data: { inventoryStatus: status },
    });
    return;
  }
  if (sourceType === "PreparedStandard") {
    await tx.preparedStandard.update({
      where: { id: sourceId },
      data: { inventoryStatus: status },
    });
    return;
  }
}

export async function syncDepletedStatusIfNeeded(
  tx: Tx,
  sourceType: InventorySourceType,
  sourceId: string,
  available: number,
  currentStatus: InventoryLifecycleStatus,
) {
  if (available > 1e-9) return;
  if (currentStatus === "Rejected" || currentStatus === "Expired" || currentStatus === "Discarded") {
    return;
  }
  await setInventoryLifecycleStatus(tx, sourceType, sourceId, "Depleted");
}

export function canConsumeFromStatus(status: InventoryLifecycleStatus): boolean {
  return status === "Active";
}

export function roundAvailable(value: number): number {
  return roundStockQuantity(Math.max(0, value));
}
