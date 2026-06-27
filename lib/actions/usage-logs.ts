"use server";

import { UsageLogType } from "@prisma/client";
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
import { LOT_SELECTION_REQUIRED_MESSAGE } from "@/lib/inventory-lot-policy";
import { parseUsageSourceType } from "@/lib/usage-source";

const REVALIDATE_PATHS = [
  "/usage-logs",
  "/stock-in",
  "/containers",
  "/chemicals",
  "/standards",
  "/microbial-strains",
  "/inventory-ledger",
  "/",
  "/reports",
];

function parseUsageType(value: string): UsageLogType | null {
  if (value === "IN" || value === "OUT" || value === "USE" || value === "DISPOSE") {
    return value;
  }
  return null;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

function stockLine(
  sourceType: NonNullable<ReturnType<typeof parseUsageSourceType>>,
  sourceId: string,
  quantity: number,
  unit: string,
  stockLotId?: string | null,
) {
  const opts = stockLotId ? { stockLotId } : undefined;
  if (sourceType === "Standard") return standardStockLine(sourceId, quantity, unit, opts);
  if (sourceType === "MicrobialStrain") return microbialStrainStockLine(sourceId, quantity, unit, opts);
  return chemicalStockLine(sourceId, quantity, unit, opts);
}

async function resolveItemName(sourceType: NonNullable<ReturnType<typeof parseUsageSourceType>>, sourceId: string) {
  if (sourceType === "Chemical") {
    const row = await db.chemical.findUnique({ where: { id: sourceId }, select: { name: true, code: true } });
    return row ? `${row.code} ${row.name}` : sourceId;
  }
  if (sourceType === "Standard") {
    const row = await db.standard.findUnique({ where: { id: sourceId }, select: { name: true, code: true } });
    return row ? `${row.code} ${row.name}` : sourceId;
  }
  const row = await db.microbialStrain.findUnique({ where: { id: sourceId }, select: { name: true, code: true } });
  return row ? `${row.code} ${row.name}` : sourceId;
}

async function validateLotSelection(
  sourceType: NonNullable<ReturnType<typeof parseUsageSourceType>>,
  sourceId: string,
  stockLotId: string | null,
): Promise<string | null> {
  const lotCount = await db.stockLot.count({
    where:
      sourceType === "Chemical"
        ? { chemicalId: sourceId }
        : sourceType === "Standard"
          ? { standardId: sourceId }
          : { microbialStrainId: sourceId },
  });

  if (lotCount >= 2 && !stockLotId) {
    return LOT_SELECTION_REQUIRED_MESSAGE;
  }
  return null;
}

function revalidateAll() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

export async function createUsageLog(formData: FormData) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };

  const user = auth.user.name || auth.user.email;
  const sourceType = parseUsageSourceType(String(formData.get("sourceType") ?? ""));
  const sourceId = String(formData.get("sourceId") ?? "");
  const type = parseUsageType(String(formData.get("type") ?? ""));
  const quantity = Number(formData.get("quantity") ?? 0);
  const unit = String(formData.get("unit") ?? "").trim();
  const performedBy = String(formData.get("performedBy") ?? user).trim();
  const performedByStaffId = String(formData.get("performedByStaffId") ?? "").trim() || null;
  const purpose = String(formData.get("purpose") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const referenceCode = String(formData.get("referenceCode") ?? "").trim();
  const date = parseDate(String(formData.get("date") ?? "")) ?? new Date();
  const stockLotId = String(formData.get("stockLotId") ?? "").trim() || null;

  if (!sourceType || !sourceId || !type || quantity <= 0 || !unit || !performedBy.trim()) {
    return { error: "Thiếu thông tin bắt buộc hoặc số lượng không hợp lệ" };
  }

  if (type === UsageLogType.DISPOSE && !notes.trim()) {
    return { error: "Ghi chú là bắt buộc khi huỷ/thanh lý" };
  }

  const lotError = await validateLotSelection(sourceType, sourceId, stockLotId);
  if (lotError) return { error: lotError };

  try {
    const log = await db.$transaction(async (tx) => {
      const line = stockLine(sourceType, sourceId, quantity, unit, stockLotId);
      const stockError =
        type === UsageLogType.IN
          ? await applyInventoryStockChange(tx, {
              user,
              module: "UsageLog",
              referenceType: "UsageLog",
              referenceId: "pending",
              restores: [line],
              restoreTransactionType: "CREATE",
              notes: purpose || notes,
            })
          : type === UsageLogType.DISPOSE
            ? await applyInventoryStockChange(tx, {
                user,
                module: "UsageLog",
                referenceType: "UsageLog",
                referenceId: "pending",
                reason: notes,
                deductTransactionType: "DISCARD",
                deducts: [line],
                notes: purpose || notes,
              })
            : await applyInventoryStockChange(tx, {
                user,
                module: "UsageLog",
                referenceType: "UsageLog",
                referenceId: "pending",
                deductTransactionType: "CONSUME",
                deducts: [line],
                notes: purpose || notes,
              });

      if (stockError) throw new Error(stockError);

      return tx.usageLog.create({
        data: {
          sourceType,
          sourceId,
          type,
          quantity,
          unit,
          performedBy,
          performedByStaffId,
          purpose,
          notes,
          referenceCode,
          date,
          stockLotId,
        },
      });
    });

    const itemName = await resolveItemName(sourceType, sourceId);

    await logActivity({
      user,
      action: "Created",
      entityType: "UsageLog",
      entityId: log.id,
      object: log.id,
      after: `${type} ${quantity} ${unit} ${itemName}${stockLotId ? ` lot:${stockLotId}` : ""}`,
    });

    revalidateAll();
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Không thể tạo nhật ký" };
  }
}

export async function deleteUsageLog(formData: FormData) {
  const auth = await requireSessionCanManage();
  if ("error" in auth) return { error: auth.error };

  const user = auth.user.name || auth.user.email;
  const id = String(formData.get("id") ?? "");

  const log = await db.usageLog.findUnique({ where: { id } });
  if (!log) return { error: "Không tìm thấy nhật ký" };

  try {
    await db.$transaction(async (tx) => {
      const line = stockLine(log.sourceType, log.sourceId, log.quantity, log.unit);
      const stockError =
        log.type === UsageLogType.IN
          ? await applyInventoryStockChange(tx, {
              user,
              module: "UsageLog",
              referenceType: "UsageLog",
              referenceId: id,
              deducts: [line],
              notes: `Hoàn tác nhật ký ${id}`,
            })
          : await applyInventoryStockChange(tx, {
              user,
              module: "UsageLog",
              referenceType: "UsageLog",
              referenceId: id,
              restores: [line],
              notes: `Hoàn tác nhật ký ${id}`,
            });

      if (stockError) throw new Error(stockError);
      await tx.usageLog.delete({ where: { id } });
    });

    await logActivity({
      user,
      action: "Deleted",
      entityType: "UsageLog",
      entityId: id,
      object: id,
      before: log,
    });

    revalidateAll();
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Không thể xoá nhật ký" };
  }
}
