"use server";

import { InventoryItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import { isValidFormDate, missingFieldsMessage, parseFormDate, statusFromLabel } from "@/lib/modules/shared";
import { computeStandardStatus } from "@/lib/standard-status";
import { db } from "@/lib/db";
import {
  applyInventoryStockChange,
  microbialStrainStockLine,
  STOCK_SHORTAGE_MESSAGE,
} from "@/lib/inventory-stock";
import { resolveStockLotSelection } from "@/lib/resolve-stock-lot-selection";
import {
  recordPreparationCreated,
  recordPreparationDeleted,
  recordPreparationUpdated,
  assertAmendmentAllowed,
} from "@/lib/services/preparation-workflow";
import { preparationHasStockDeducted, restorePreparationStock } from "@/lib/services/preparation-transition-stock";

const PREPARED_STRAIN_USE_QTY = 1;

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function collectMissing(checks: { label: string; ok: boolean }[]): string | null {
  const labels = checks.filter((c) => !c.ok).map((c) => c.label);
  return labels.length ? missingFieldsMessage(labels) : null;
}

function revalidateAll(paths: string[]) {
  paths.forEach((p) => revalidatePath(p));
}

const COMMON_PATHS = ["/", "/reports"];

async function audit(user: string, action: string, entityType: string, entityId: string, object: string, before?: unknown, after?: unknown) {
  await logActivity({ user, action, entityType, entityId, object, before, after });
}

export async function createMicrobialStrain(fd: FormData) {
  const user = str(fd, "user") || "System";
  const code = str(fd, "code");
  const name = str(fd, "name");
  if (!code || !name) return { error: "Mã và tên là bắt buộc" };
  const row = await db.microbialStrain.create({
    data: {
      code,
      name,
      strainGroup: str(fd, "strainGroup") || "Vi khuẩn",
      manufacturer: str(fd, "manufacturer"),
      atccProductCode: str(fd, "atccProductCode") || str(fd, "atccCode"),
      speciesStrain: str(fd, "speciesStrain"),
      storageCondition: str(fd, "storageCondition"),
      passage: Number(fd.get("passage") ?? 0),
      lot: str(fd, "lot"),
      expiryDate: parseFormDate(str(fd, "expiryDate")),
      status: computeStandardStatus(parseFormDate(str(fd, "expiryDate"))),
      responsiblePerson: str(fd, "responsiblePerson"),
      notes: str(fd, "notes"),
    },
  });
  await audit(user, "Created", "MicrobialStrain", row.id, code, undefined, row);
  revalidateAll(["/microbial-strains", ...COMMON_PATHS]);
  return { success: true };
}

export async function updateMicrobialStrain(fd: FormData) {
  const user = str(fd, "user") || "System";
  const id = str(fd, "id");
  const before = await db.microbialStrain.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy" };
  const row = await db.microbialStrain.update({
    where: { id },
    data: {
      code: str(fd, "code"),
      name: str(fd, "name"),
      strainGroup: str(fd, "strainGroup") || "Vi khuẩn",
      manufacturer: str(fd, "manufacturer"),
      atccProductCode: str(fd, "atccProductCode") || str(fd, "atccCode"),
      speciesStrain: str(fd, "speciesStrain"),
      storageCondition: str(fd, "storageCondition"),
      passage: Number(fd.get("passage") ?? 0),
      lot: str(fd, "lot"),
      expiryDate: parseFormDate(str(fd, "expiryDate")),
      status: computeStandardStatus(parseFormDate(str(fd, "expiryDate"))),
      responsiblePerson: str(fd, "responsiblePerson"),
      notes: str(fd, "notes"),
    },
  });
  await audit(user, "Updated", "MicrobialStrain", id, row.code, before, row);
  revalidateAll(["/microbial-strains", ...COMMON_PATHS]);
  return { success: true };
}

export async function deleteMicrobialStrain(fd: FormData) {
  const user = str(fd, "user") || "System";
  const id = str(fd, "id");
  const before = await db.microbialStrain.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy" };
  await db.microbialStrain.delete({ where: { id } });
  await audit(user, "Deleted", "MicrobialStrain", id, before.code, before);
  revalidateAll(["/microbial-strains", "/prepared-strains", ...COMMON_PATHS]);
  return { success: true };
}

export async function createPreparedStrain(fd: FormData) {
  const user = str(fd, "user") || "System";
  const code = str(fd, "code");
  const name = str(fd, "name");
  const sourceStrainId = str(fd, "sourceStrainId");
  const sourceStockLotId = str(fd, "sourceStockLotId");
  const preparedDateStr = str(fd, "preparedDate");
  const expiryDateStr = str(fd, "expiryDate");
  const missing = collectMissing([
    { label: "Mã", ok: !!code },
    { label: "Tên", ok: !!name },
    { label: "Chủng gốc", ok: !!sourceStrainId },
    { label: "Lot chủng gốc", ok: !!sourceStockLotId },
    { label: "Ngày pha", ok: isValidFormDate(preparedDateStr) },
    { label: "Hạn dùng sau pha", ok: isValidFormDate(expiryDateStr) },
  ]);
  if (missing) return { error: missing };
  const preparedDate = parseFormDate(preparedDateStr)!;
  const expiryDate = parseFormDate(expiryDateStr)!;

  try {
    const row = await db.$transaction(async (tx) => {
      const sourceStrain = await tx.microbialStrain.findUnique({ where: { id: sourceStrainId } });
      if (!sourceStrain) throw new Error("Không tìm thấy chủng gốc");

      const lotResolved = await resolveStockLotSelection(
        tx,
        "MicrobialStrain",
        sourceStrainId,
        sourceStockLotId,
        str(fd, "sourceLotNumberSnapshot"),
      );
      if ("error" in lotResolved) throw new Error(lotResolved.error);

      const row = await tx.preparedStrain.create({
        data: {
          code,
          name,
          sourceStrainId,
          sourceStockLotId: lotResolved.stockLotId,
          sourceLotNumberSnapshot: lotResolved.lotNumber,
          formula: str(fd, "formula"),
          concentration: str(fd, "concentration"),
          lot: str(fd, "lot"),
          preparedDate,
          preparedBy: str(fd, "preparedBy"),
          checkedBy: str(fd, "checkedBy"),
          expiryDate,
          passage: Number(fd.get("passage") ?? 0),
          storageCondition: str(fd, "storageCondition"),
          status: statusFromLabel(str(fd, "status") || "Available"),
          responsiblePerson: str(fd, "responsiblePerson"),
          notes: str(fd, "notes"),
          workflowStatus: "Draft",
        },
      });

      await recordPreparationCreated(tx, "STRAIN", row, user);
      return row;
    });
    await audit(user, "Created", "PreparedStrain", row.id, code, undefined, row);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Không thể tạo chủng pha chế";
    if (message.includes(STOCK_SHORTAGE_MESSAGE) || message.startsWith("Lot ")) return { error: message };
    return { error: message };
  }

  revalidateAll(["/prepared-strains", "/microbial-strains", ...COMMON_PATHS]);
  return { success: true };
}

export async function updatePreparedStrain(fd: FormData) {
  const user = str(fd, "user") || "System";
  const id = str(fd, "id");
  const before = await db.preparedStrain.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy" };
  if (before.deletedAt) return { error: "Bản ghi đã bị xóa" };
  if (before.workflowStatus === "Prepared" || before.workflowStatus === "Checked") {
    return { error: "Không thể sửa trực tiếp — hủy hoặc chuyển trạng thái trước" };
  }

  const amendmentReason = str(fd, "amendmentReason");
  if (before.workflowStatus === "Approved") {
    const amendError = assertAmendmentAllowed("Approved", amendmentReason);
    if (amendError) return { error: amendError };
  }

  const expiryDate = parseFormDate(str(fd, "expiryDate"));
  const preparedDate = parseFormDate(str(fd, "preparedDate"));
  if (!expiryDate || !preparedDate) return { error: "Ngày không hợp lệ" };

  const sourceStrainId = str(fd, "sourceStrainId");
  const sourceStockLotId = str(fd, "sourceStockLotId");
  if (!sourceStockLotId) return { error: "Lot chủng gốc là bắt buộc" };

  try {
    const row = await db.$transaction(async (tx) => {
      const sourceStrain = await tx.microbialStrain.findUnique({ where: { id: sourceStrainId } });
      if (!sourceStrain) throw new Error("Không tìm thấy chủng gốc");

      if (preparationHasStockDeducted(before.workflowStatus) && before.sourceStockLotId) {
        const beforeStrain = await tx.microbialStrain.findUnique({
          where: { id: before.sourceStrainId },
        });
        const restoreError = await applyInventoryStockChange(tx, {
          user,
          module: "PreparedStrain",
          referenceType: "PreparedStrain",
          referenceId: before.code,
          restores: [
            microbialStrainStockLine(
              before.sourceStrainId,
              PREPARED_STRAIN_USE_QTY,
              beforeStrain?.unit ?? "vial",
              {
                stockLotId: before.sourceStockLotId,
                lotNumber: before.sourceLotNumberSnapshot,
              },
            ),
          ],
          notes: `Hoàn khi cập nhật ${before.code}`,
        });
        if (restoreError) throw new Error(restoreError);
      }

      const lotResolved = await resolveStockLotSelection(
        tx,
        "MicrobialStrain",
        sourceStrainId,
        sourceStockLotId,
        str(fd, "sourceLotNumberSnapshot"),
      );
      if ("error" in lotResolved) throw new Error(lotResolved.error);

      if (preparationHasStockDeducted(before.workflowStatus)) {
        const deductError = await applyInventoryStockChange(tx, {
          user,
          module: "PreparedStrain",
          referenceType: "PreparedStrain",
          referenceId: before.code,
          deducts: [
            microbialStrainStockLine(sourceStrainId, PREPARED_STRAIN_USE_QTY, sourceStrain.unit, {
              stockLotId: lotResolved.stockLotId,
              lotNumber: lotResolved.lotNumber,
            }),
          ],
          notes: `Cập nhật pha chủng ${before.code}`,
        });
        if (deductError) throw new Error(deductError);
      }

      const row = await tx.preparedStrain.update({
        where: { id },
        data: {
          code: str(fd, "code"),
          name: str(fd, "name"),
          sourceStrainId,
          sourceStockLotId: lotResolved.stockLotId,
          sourceLotNumberSnapshot: lotResolved.lotNumber,
          formula: str(fd, "formula"),
          concentration: str(fd, "concentration"),
          lot: str(fd, "lot"),
          preparedDate,
          preparedBy: str(fd, "preparedBy"),
          checkedBy: str(fd, "checkedBy"),
          expiryDate,
          passage: Number(fd.get("passage") ?? 0),
          storageCondition: str(fd, "storageCondition"),
          status: statusFromLabel(str(fd, "status") || "Available"),
          responsiblePerson: str(fd, "responsiblePerson"),
          notes: str(fd, "notes"),
          version: before.workflowStatus === "Approved" ? before.version + 1 : before.version,
          amendmentReason: before.workflowStatus === "Approved" ? amendmentReason : before.amendmentReason,
        },
      });

      await recordPreparationUpdated(
        tx,
        "STRAIN",
        row,
        before,
        user,
        before.workflowStatus === "Approved" ? amendmentReason : undefined,
      );
      return row;
    });
    await audit(user, "Updated", "PreparedStrain", id, row.code, before, row);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Không thể cập nhật chủng pha chế";
    if (message.includes(STOCK_SHORTAGE_MESSAGE) || message.startsWith("Lot ")) return { error: message };
    return { error: message };
  }

  revalidateAll(["/prepared-strains", "/microbial-strains", ...COMMON_PATHS]);
  return { success: true };
}

export async function deletePreparedStrain(fd: FormData) {
  const user = str(fd, "user") || "System";
  const id = str(fd, "id");
  const before = await db.preparedStrain.findUnique({ where: { id } });
  if (!before) return { error: "Không tìm thấy" };
  if (before.deletedAt) return { error: "Bản ghi đã bị xóa" };

  try {
    await db.$transaction(async (tx) => {
      if (preparationHasStockDeducted(before.workflowStatus)) {
        const stockError = await restorePreparationStock(tx, "STRAIN", id, user);
        if (stockError) throw new Error(stockError);
      }

      await recordPreparationDeleted(tx, "STRAIN", before, user);

      await tx.preparedStrain.update({
        where: { id },
        data: { deletedAt: new Date(), workflowStatus: "Cancelled" },
      });
    });
    await audit(user, "Deleted", "PreparedStrain", id, before.code, before);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Không thể xóa chủng pha chế";
    return { error: message };
  }

  revalidateAll(["/prepared-strains", "/microbial-strains", ...COMMON_PATHS]);
  return { success: true };
}
