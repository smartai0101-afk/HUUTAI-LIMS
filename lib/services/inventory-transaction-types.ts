import type { InventoryActionType, InventoryTransactionType } from "@prisma/client";

export const REASON_REQUIRED_TYPES: InventoryTransactionType[] = [
  "DISCARD",
  "REJECT",
  "EXPIRE",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
  "REVERSAL",
];

export const QUANTITY_DECREASING_TYPES: InventoryTransactionType[] = [
  "CONSUME",
  "DISCARD",
  "ADJUSTMENT_OUT",
];

export const QUANTITY_INCREASING_TYPES: InventoryTransactionType[] = [
  "CREATE",
  "ADJUSTMENT_IN",
  "REVERSAL",
];

export function actionTypeToTransactionType(
  actionType: InventoryActionType,
  module: string,
): InventoryTransactionType {
  if (actionType === "Restore" && module === "StockIn") return "CREATE";
  if (actionType === "Deduct") return "CONSUME";
  return "REVERSAL";
}

export function transactionTypeRequiresReason(type: InventoryTransactionType): boolean {
  return REASON_REQUIRED_TYPES.includes(type);
}

export function assertTransactionReason(
  type: InventoryTransactionType,
  reason: string | undefined,
): string | null {
  if (!transactionTypeRequiresReason(type)) return null;
  if (!reason?.trim()) {
    return "Bắt buộc nhập lý do cho giao dịch tồn kho này";
  }
  return null;
}

export const INVENTORY_TRANSACTION_TYPE_LABELS: Record<InventoryTransactionType, string> = {
  CREATE: "Nhập / tạo tồn",
  CONSUME: "Tiêu hao",
  DISCARD: "Loại bỏ",
  ADJUSTMENT_IN: "Điều chỉnh tăng",
  ADJUSTMENT_OUT: "Điều chỉnh giảm",
  EXPIRE: "Hết hạn",
  REJECT: "Từ chối lô pha",
  REVERSAL: "Đảo chiều",
};

export const INVENTORY_LIFECYCLE_LABELS = {
  Active: "Đang dùng",
  Rejected: "Bị từ chối",
  Expired: "Hết hạn",
  Discarded: "Đã loại bỏ",
  Depleted: "Hết tồn",
} as const;

export const OPENING_BALANCE_MODULE = "MigrationOpeningBalance";
export const OPENING_BALANCE_REASON = "Opening balance migration";
