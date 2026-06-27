import type {
  InventorySourceType,
  InventoryTransactionType,
  PreparationType,
  Prisma,
} from "@prisma/client";
import { db } from "@/lib/db";
import { roundStockQuantity, STOCK_SHORTAGE_MESSAGE } from "@/lib/inventory-units";
import {
  canConsumeFromStatus,
  roundAvailable,
  setInventoryLifecycleStatus,
  syncDepletedStatusIfNeeded,
} from "@/lib/services/inventory-lifecycle";
import { summarizeTransactions } from "@/lib/services/inventory-transaction-summary";
import {
  actionTypeToTransactionType,
  assertTransactionReason,
  OPENING_BALANCE_MODULE,
} from "@/lib/services/inventory-transaction-types";

type Tx = Prisma.TransactionClient;

export type InventoryItemRef = {
  sourceType: InventorySourceType;
  sourceId: string;
  stockLotId?: string | null;
};

export type PostTransactionInput = {
  user: string;
  module: string;
  sourceType: InventorySourceType;
  sourceId: string;
  sourceCode: string;
  stockLotId?: string | null;
  transactionType: InventoryTransactionType;
  quantityUsed: number;
  unit: string;
  quantityBefore: number;
  quantityAfter: number;
  actionType: "Deduct" | "Restore";
  referenceType: string;
  referenceId: string;
  reason?: string;
  notes?: string;
  relatedPreparationType?: PreparationType | null;
  relatedPreparationId?: string | null;
  reversesTransactionId?: string | null;
  performedByStaffId?: string | null;
};

export async function getInventoryTransactionsForItem(
  tx: Tx | typeof db,
  ref: InventoryItemRef,
) {
  return tx.inventoryTransaction.findMany({
    where: {
      sourceType: ref.sourceType,
      sourceId: ref.sourceId,
      ...(ref.stockLotId ? { stockLotId: ref.stockLotId } : {}),
    },
    orderBy: { time: "asc" },
  });
}

export async function getCatalogUnit(tx: Tx | typeof db, ref: InventoryItemRef): Promise<string> {
  if (ref.stockLotId) {
    const lot = await tx.stockLot.findUnique({
      where: { id: ref.stockLotId },
      select: { unit: true },
    });
    if (lot?.unit.trim()) return lot.unit;
  }
  if (ref.sourceType === "Chemical") {
    const row = await tx.chemical.findUnique({ where: { id: ref.sourceId }, select: { unit: true } });
    return row?.unit ?? "";
  }
  if (ref.sourceType === "Standard") {
    const row = await tx.standard.findUnique({ where: { id: ref.sourceId }, select: { unit: true } });
    return row?.unit ?? "";
  }
  if (ref.sourceType === "MicrobialStrain") {
    const row = await tx.microbialStrain.findUnique({
      where: { id: ref.sourceId },
      select: { unit: true },
    });
    return row?.unit ?? "";
  }
  const row = await tx.preparedStandard.findUnique({
    where: { id: ref.sourceId },
    select: { unit: true, solventUnit: true },
  });
  return row?.unit || row?.solventUnit || "";
}

function toTypedRows(
  rows: Awaited<ReturnType<typeof getInventoryTransactionsForItem>>,
) {
  return rows
    .filter((r) => r.transactionType != null)
    .map((r) => ({
      transactionType: r.transactionType!,
      quantityUsed: r.quantityUsed,
      unit: r.unit,
    }));
}

async function resolveAvailableFromRows(
  tx: Tx | typeof db,
  ref: InventoryItemRef,
  rows: Awaited<ReturnType<typeof getInventoryTransactionsForItem>>,
  catalogUnit: string,
): Promise<number> {
  const typed = toTypedRows(rows);
  if (typed.length === 0) {
    return getCachedQuantity(tx, ref);
  }

  const summary = summarizeTransactions(typed, catalogUnit);
  const hasDecreases =
    summary.consumed + summary.discarded + summary.adjustmentOut > EPSILON;
  const hasIncreases =
    summary.created + summary.adjustmentIn + summary.reversed > EPSILON;

  if (hasDecreases && !hasIncreases) {
    const hasMigration = rows.some((r) => r.module === OPENING_BALANCE_MODULE);
    if (!hasMigration) {
      const lastTyped = [...rows].reverse().find((r) => r.transactionType != null);
      const fallback = lastTyped?.quantityAfter ?? (await getCachedQuantity(tx, ref));
      return roundAvailable(fallback);
    }
  }

  return summary.available;
}

const EPSILON = 0.0001;

export async function getAvailableQuantity(
  tx: Tx | typeof db,
  ref: InventoryItemRef,
): Promise<number> {
  const rows = await getInventoryTransactionsForItem(tx, ref);
  const catalogUnit = await getCatalogUnit(tx, ref);
  return resolveAvailableFromRows(tx, ref, rows, catalogUnit);
}

async function getCachedQuantity(tx: Tx | typeof db, ref: InventoryItemRef): Promise<number> {
  if (ref.stockLotId) {
    const lot = await tx.stockLot.findUnique({ where: { id: ref.stockLotId } });
    return roundAvailable(lot?.quantity ?? 0);
  }
  if (ref.sourceType === "Chemical") {
    const row = await tx.chemical.findUnique({ where: { id: ref.sourceId } });
    return roundAvailable(row?.quantity ?? 0);
  }
  if (ref.sourceType === "Standard") {
    const row = await tx.standard.findUnique({ where: { id: ref.sourceId } });
    return roundAvailable(row?.quantity ?? 0);
  }
  if (ref.sourceType === "MicrobialStrain") {
    const row = await tx.microbialStrain.findUnique({ where: { id: ref.sourceId } });
    return roundAvailable(row?.quantity ?? 0);
  }
  const row = await tx.preparedStandard.findUnique({ where: { id: ref.sourceId } });
  return roundAvailable(row?.quantity ?? 0);
}

export async function getInventorySummary(
  tx: Tx | typeof db,
  ref: InventoryItemRef,
) {
  const rows = await getInventoryTransactionsForItem(tx, ref);
  const catalogUnit = await getCatalogUnit(tx, ref);
  const typed = toTypedRows(rows);

  if (typed.length === 0) {
    const available = await getCachedQuantity(tx, ref);
    return {
      created: available,
      consumed: 0,
      discarded: 0,
      adjustmentIn: 0,
      adjustmentOut: 0,
      reversed: 0,
      available,
    };
  }

  const summary = summarizeTransactions(typed, catalogUnit);
  const available = await resolveAvailableFromRows(tx, ref, rows, catalogUnit);
  return { ...summary, available };
}

export async function postInventoryTransaction(
  tx: Tx,
  input: PostTransactionInput,
): Promise<{ id: string }> {
  const reasonError = assertTransactionReason(input.transactionType, input.reason);
  if (reasonError) throw new Error(reasonError);

  const row = await tx.inventoryTransaction.create({
    data: {
      user: input.user,
      module: input.module,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      sourceCode: input.sourceCode,
      stockLotId: input.stockLotId ?? null,
      quantityBefore: input.quantityBefore,
      quantityUsed: input.quantityUsed,
      quantityAfter: input.quantityAfter,
      unit: input.unit,
      actionType: input.actionType,
      transactionType: input.transactionType,
      reason: input.reason ?? "",
      relatedPreparationType: input.relatedPreparationType ?? null,
      relatedPreparationId: input.relatedPreparationId ?? null,
      reversesTransactionId: input.reversesTransactionId ?? null,
      performedByStaffId: input.performedByStaffId ?? null,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      notes: input.notes ?? "",
    },
  });

  if (
    input.transactionType === "CONSUME" ||
    input.transactionType === "DISCARD" ||
    input.transactionType === "ADJUSTMENT_OUT"
  ) {
    const status = await getLifecycleStatus(tx, input.sourceType, input.sourceId);
    await syncDepletedStatusIfNeeded(
      tx,
      input.sourceType,
      input.sourceId,
      input.quantityAfter,
      status,
    );
  }

  return { id: row.id };
}

async function getLifecycleStatus(
  tx: Tx,
  sourceType: InventorySourceType,
  sourceId: string,
) {
  if (sourceType === "Chemical") {
    const row = await tx.chemical.findUnique({ where: { id: sourceId } });
    return row?.inventoryStatus ?? "Active";
  }
  if (sourceType === "Standard") {
    const row = await tx.standard.findUnique({ where: { id: sourceId } });
    return row?.inventoryStatus ?? "Active";
  }
  if (sourceType === "MicrobialStrain") {
    const row = await tx.microbialStrain.findUnique({ where: { id: sourceId } });
    return row?.inventoryStatus ?? "Active";
  }
  const row = await tx.preparedStandard.findUnique({ where: { id: sourceId } });
  return row?.inventoryStatus ?? "Active";
}

export async function assertCanDecreaseQuantity(
  tx: Tx,
  ref: InventoryItemRef,
  amount: number,
): Promise<string | null> {
  const available = await getAvailableQuantity(tx, ref);
  if (amount > available + 1e-9) {
    return STOCK_SHORTAGE_MESSAGE;
  }
  const status = await getLifecycleStatus(tx, ref.sourceType, ref.sourceId);
  if (!canConsumeFromStatus(status)) {
    return "Vật tư không ở trạng thái có thể sử dụng";
  }
  return null;
}

export async function recordRejectPreparationTransaction(
  tx: Tx,
  params: {
    user: string;
    preparationType: PreparationType;
    preparationId: string;
    sourceCode: string;
    reason: string;
    referenceType: string;
    referenceId: string;
  },
) {
  await postInventoryTransaction(tx, {
    user: params.user,
    module: "PreparationWorkflow",
    sourceType: "PreparedStandard",
    sourceId: params.preparationId,
    sourceCode: params.sourceCode,
    transactionType: "REJECT",
    quantityUsed: 0,
    unit: "",
    quantityBefore: 0,
    quantityAfter: 0,
    actionType: "Deduct",
    referenceType: params.referenceType,
    referenceId: params.referenceId,
    reason: params.reason,
    relatedPreparationType: params.preparationType,
    relatedPreparationId: params.preparationId,
    notes: `Reject preparation ${params.sourceCode}`,
  });
}

export async function reverseInventoryTransaction(
  tx: Tx,
  transactionId: string,
  user: string,
  reason: string,
): Promise<string | null> {
  const original = await tx.inventoryTransaction.findUnique({ where: { id: transactionId } });
  if (!original) return "Không tìm thấy giao dịch tồn kho";
  if (!original.transactionType) return "Giao dịch chưa có loại — không thể đảo chiều";

  const isIncrease =
    original.transactionType === "CONSUME" ||
    original.transactionType === "DISCARD" ||
    original.transactionType === "ADJUSTMENT_OUT";

  const line = {
    sourceType: original.sourceType,
    sourceId: original.sourceId,
    quantityUsed: original.quantityUsed,
    unit: original.unit,
    stockLotId: original.stockLotId,
  };

  const { applyInventoryStockChange } = await import("@/lib/inventory-stock");

  const error = await applyInventoryStockChange(tx, {
    user,
    module: "InventoryReversal",
    referenceType: "InventoryTransaction",
    referenceId: original.id,
    reason,
    notes: `Reversal of ${original.transactionType}: ${reason}`,
    ...(isIncrease
      ? { restores: [line], restoreTransactionType: "REVERSAL" }
      : { deducts: [line], deductTransactionType: "REVERSAL" }),
  });

  return error;
}

export { actionTypeToTransactionType, assertTransactionReason };
