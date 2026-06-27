"use server";

import type { InventorySourceType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import { requireSessionCanEdit, requireSessionCanManage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  applyInventoryStockChange,
  chemicalStockLine,
  microbialStrainStockLine,
  standardStockLine,
} from "@/lib/inventory-stock";
import { setInventoryLifecycleStatus } from "@/lib/services/inventory-lifecycle";
import {
  getAvailableQuantity,
  getCatalogUnit,
  getInventorySummary,
  getInventoryTransactionsForItem,
  reverseInventoryTransaction,
} from "@/lib/services/inventory-transaction-engine";
import { computeRunningLedgerBalances } from "@/lib/services/inventory-transaction-summary";
import { assertTransactionReason } from "@/lib/services/inventory-transaction-types";

const REVALIDATE = [
  "/chemicals",
  "/standards",
  "/microbial-strains",
  "/prepared-standards",
  "/prepared-chemicals",
  "/inventory-ledger",
  "/containers",
  "/usage-logs",
];

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseSourceType(raw: string): InventorySourceType | null {
  if (
    raw === "Chemical" ||
    raw === "Standard" ||
    raw === "MicrobialStrain" ||
    raw === "PreparedStandard"
  ) {
    return raw;
  }
  return null;
}

function stockLine(
  sourceType: InventorySourceType,
  sourceId: string,
  quantity: number,
  unit: string,
  stockLotId?: string | null,
) {
  const opts = stockLotId ? { stockLotId } : undefined;
  if (sourceType === "Standard") return standardStockLine(sourceId, quantity, unit, opts);
  if (sourceType === "MicrobialStrain") return microbialStrainStockLine(sourceId, quantity, unit, opts);
  if (sourceType === "PreparedStandard") {
    return { sourceType, sourceId, quantityUsed: quantity, unit };
  }
  return chemicalStockLine(sourceId, quantity, unit, opts);
}

function revalidateAll() {
  try {
    REVALIDATE.forEach((p) => revalidatePath(p));
  } catch {
    // ignore
  }
}

export async function fetchInventorySummary(fd: FormData) {
  const sourceType = parseSourceType(str(fd, "sourceType"));
  const sourceId = str(fd, "sourceId");
  const stockLotId = str(fd, "stockLotId") || null;
  if (!sourceType || !sourceId) return { error: "Thiếu thông tin vật tư" };
  const summary = await getInventorySummary(db, { sourceType, sourceId, stockLotId });
  return { success: true, summary };
}

export async function discardInventoryItem(fd: FormData) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };
  const session = auth.user;
  const sourceType = parseSourceType(str(fd, "sourceType"));
  const sourceId = str(fd, "sourceId");
  const stockLotId = str(fd, "stockLotId") || null;
  const quantity = Number(str(fd, "quantity"));
  const unit = str(fd, "unit");
  const reason = str(fd, "reason");
  const user = session.name || session.email;

  if (!sourceType || !sourceId) return { error: "Thiếu thông tin vật tư" };
  const reasonError = assertTransactionReason("DISCARD", reason);
  if (reasonError) return { error: reasonError };
  if (!Number.isFinite(quantity) || quantity <= 0) return { error: "Số lượng không hợp lệ" };

  const available = await getAvailableQuantity(db, { sourceType, sourceId, stockLotId });
  if (quantity > available + 1e-9) return { error: "Số lượng loại bỏ vượt tồn khả dụng" };

  try {
    await db.$transaction(async (tx) => {
      const error = await applyInventoryStockChange(tx, {
        user,
        module: "InventoryDiscard",
        referenceType: "InventoryDiscard",
        referenceId: sourceId,
        reason,
        notes: reason,
        deductTransactionType: "DISCARD",
        deducts: [stockLine(sourceType, sourceId, quantity, unit, stockLotId)],
      });
      if (error) throw new Error(error);

      const remaining = await getAvailableQuantity(tx, { sourceType, sourceId, stockLotId });
      if (remaining <= 1e-9) {
        await setInventoryLifecycleStatus(tx, sourceType, sourceId, "Discarded");
      }
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể loại bỏ tồn kho" };
  }

  await logActivity({
    user,
    action: "Discard",
    entityType: sourceType,
    entityId: sourceId,
    object: `DISCARD ${quantity} ${unit} — ${reason}`,
  });
  revalidateAll();
  return { success: true };
}

export async function adjustInventoryItem(fd: FormData) {
  const auth = await requireSessionCanManage();
  if ("error" in auth) return { error: auth.error };
  const session = auth.user;
  const sourceType = parseSourceType(str(fd, "sourceType"));
  const sourceId = str(fd, "sourceId");
  const stockLotId = str(fd, "stockLotId") || null;
  const quantity = Number(str(fd, "quantity"));
  const unit = str(fd, "unit");
  const direction = str(fd, "direction");
  const reason = str(fd, "reason");
  const user = session.name || session.email;

  if (!sourceType || !sourceId) return { error: "Thiếu thông tin vật tư" };
  const txType = direction === "in" ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";
  const reasonError = assertTransactionReason(txType, reason);
  if (reasonError) return { error: reasonError };
  if (!Number.isFinite(quantity) || quantity <= 0) return { error: "Số lượng không hợp lệ" };

  if (direction === "out") {
    const available = await getAvailableQuantity(db, { sourceType, sourceId, stockLotId });
    if (quantity > available + 1e-9) return { error: "Số lượng điều chỉnh vượt tồn khả dụng" };
  }

  try {
    await db.$transaction(async (tx) => {
      const error = await applyInventoryStockChange(tx, {
        user,
        module: "InventoryAdjustment",
        referenceType: "InventoryAdjustment",
        referenceId: sourceId,
        reason,
        notes: reason,
        ...(direction === "in"
          ? {
              restoreTransactionType: "ADJUSTMENT_IN" as const,
              restores: [stockLine(sourceType, sourceId, quantity, unit, stockLotId)],
            }
          : {
              deductTransactionType: "ADJUSTMENT_OUT" as const,
              deducts: [stockLine(sourceType, sourceId, quantity, unit, stockLotId)],
            }),
      });
      if (error) throw new Error(error);
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể điều chỉnh tồn kho" };
  }

  await logActivity({
    user,
    action: "Adjust",
    entityType: sourceType,
    entityId: sourceId,
    object: `${txType} ${quantity} ${unit} — ${reason}`,
  });
  revalidateAll();
  return { success: true };
}

export async function expireInventoryItem(fd: FormData) {
  const auth = await requireSessionCanManage();
  if ("error" in auth) return { error: auth.error };
  const session = auth.user;
  const sourceType = parseSourceType(str(fd, "sourceType"));
  const sourceId = str(fd, "sourceId");
  const reason = str(fd, "reason");
  const user = session.name || session.email;

  if (!sourceType || !sourceId) return { error: "Thiếu thông tin vật tư" };
  const reasonError = assertTransactionReason("EXPIRE", reason);
  if (reasonError) return { error: reasonError };

  try {
    await db.$transaction(async (tx) => {
      await setInventoryLifecycleStatus(tx, sourceType, sourceId, "Expired");
      await tx.inventoryTransaction.create({
        data: {
          user,
          module: "InventoryExpire",
          sourceType,
          sourceId,
          sourceCode: "",
          quantityBefore: 0,
          quantityUsed: 0,
          quantityAfter: 0,
          unit: "",
          actionType: "Deduct",
          transactionType: "EXPIRE",
          reason,
          referenceType: "InventoryExpire",
          referenceId: sourceId,
          notes: reason,
        },
      });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể ghi nhận hết hạn" };
  }

  revalidateAll();
  return { success: true };
}

export async function reverseInventoryTransactionAction(fd: FormData) {
  const auth = await requireSessionCanManage();
  if ("error" in auth) return { error: auth.error };
  const session = auth.user;
  const transactionId = str(fd, "transactionId");
  const reason = str(fd, "reason");
  const user = session.name || session.email;

  if (!transactionId) return { error: "Thiếu mã giao dịch" };
  const reasonError = assertTransactionReason("REVERSAL", reason);
  if (reasonError) return { error: reasonError };

  try {
    await db.$transaction(async (tx) => {
      const error = await reverseInventoryTransaction(tx, transactionId, user, reason);
      if (error) throw new Error(error);
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể đảo chiều giao dịch" };
  }

  revalidateAll();
  return { success: true };
}

export async function fetchInventoryTransactions(fd: FormData) {
  const sourceType = parseSourceType(str(fd, "sourceType"));
  const sourceId = str(fd, "sourceId");
  const limit = Number(str(fd, "limit") || "50");
  if (!sourceType || !sourceId) return { error: "Thiếu thông tin vật tư" };

  const allRows = await getInventoryTransactionsForItem(db, { sourceType, sourceId });
  const catalogUnit = await getCatalogUnit(db, { sourceType, sourceId });

  const runningBalances = computeRunningLedgerBalances(
    allRows.map((r) => ({
      id: r.id,
      transactionType: r.transactionType,
      quantityUsed: r.quantityUsed,
      unit: r.unit,
    })),
    catalogUnit,
  );

  const rows = [...allRows].reverse().slice(0, Math.min(limit, 200));

  return {
    success: true,
    rows: rows.map((r) => ({
      id: r.id,
      time: r.time.toISOString(),
      transactionType: r.transactionType,
      quantityUsed: r.quantityUsed,
      unit: r.unit,
      quantityBefore: r.quantityBefore,
      quantityAfter: r.quantityAfter,
      ledgerAfter: runningBalances.get(r.id) ?? null,
      reason: r.reason,
      user: r.user,
      module: r.module,
    })),
  };
}
