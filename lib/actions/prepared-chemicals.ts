"use server";

import type { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { formatCasProductSnapshot } from "@/lib/chemicals-fields";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import { db } from "@/lib/db";
import {
  applyInventoryStockChange,
  chemicalStockLine,
  STOCK_SHORTAGE_MESSAGE,
} from "@/lib/inventory-stock";
import { isValidFormDate, parseFormDate } from "@/lib/modules/shared";
import {
  archivePreparedCode,
  findActivePreparedChemicalByCode,
  releaseSoftDeletedPreparedChemicalCode,
} from "@/lib/prepared-code-guard";
import {
  assertValidParentCode,
  previewPreparedBatchFromSequence,
  resolvePreparedBatchFromSequence,
  resolvePreparedBatchIdentity,
} from "@/lib/prepared-batch-code";
import { computePreparedChemicalStatus } from "@/lib/prepared-chemical-status";

import { resolveStockLotSelection } from "@/lib/resolve-stock-lot-selection";
import { savePreparationAttachment } from "@/lib/preparation-upload";
import { preparationIsoFormData } from "@/lib/map-preparation-iso";
import {
  recordPreparationCreated,
  recordPreparationDeleted,
  recordPreparationUpdated,
  assertAmendmentAllowed,
} from "@/lib/services/preparation-workflow";
import { preparationHasStockDeducted } from "@/lib/services/preparation-transition-stock";

const REVALIDATE_PATHS = ["/prepared-chemicals", "/chemicals", "/", "/reports"];
const MODULE_NAME = "PreparedChemical";

type IngredientInput = {
  chemicalId: string;
  quantityUsed: number;
  unit: string;
  stockLotId?: string | null;
  lotNumber?: string;
};

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseQuantity(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function parseIngredients(fd: FormData): IngredientInput[] | { error: string } {
  const raw = str(fd, "ingredients");
  if (!raw) return { error: "Cần ít nhất một hóa chất gốc" };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { error: "Cần ít nhất một hóa chất gốc" };
    }
    const items: IngredientInput[] = [];
    for (const item of parsed) {
      const chemicalId = String((item as { chemicalId?: string })?.chemicalId ?? "").trim();
      const quantityUsed = Number((item as { quantityUsed?: number })?.quantityUsed);
      const unit = String((item as { unit?: string })?.unit ?? "").trim();
      const stockLotId = String((item as { stockLotId?: string })?.stockLotId ?? "").trim();
      const lotNumber = String((item as { lotNumber?: string })?.lotNumber ?? "").trim();
      if (!chemicalId || !Number.isFinite(quantityUsed) || quantityUsed <= 0) {
        return { error: "Thông tin nguyên liệu không hợp lệ" };
      }
      items.push({
        chemicalId,
        quantityUsed,
        unit,
        stockLotId: stockLotId || null,
        lotNumber,
      });
    }
    return items;
  } catch {
    return { error: "Thông tin nguyên liệu không hợp lệ" };
  }
}

function ingredientStockLines(items: IngredientInput[]) {
  return items.map((item) =>
    chemicalStockLine(item.chemicalId, item.quantityUsed, item.unit, {
      stockLotId: item.stockLotId,
      lotNumber: item.lotNumber,
    }),
  );
}

async function resolveIngredientLots(
  tx: Prisma.TransactionClient,
  items: IngredientInput[],
): Promise<IngredientInput[] | { error: string }> {
  const resolved: IngredientInput[] = [];
  for (const item of items) {
    const lotResolved = await resolveStockLotSelection(
      tx,
      "Chemical",
      item.chemicalId,
      item.stockLotId,
      item.lotNumber,
    );
    if ("error" in lotResolved) return lotResolved;
    resolved.push({
      ...item,
      stockLotId: lotResolved.stockLotId,
      lotNumber: lotResolved.lotNumber,
    });
  }
  return resolved;
}

async function resolveIngredientUnits(
  tx: Prisma.TransactionClient,
  items: IngredientInput[],
): Promise<IngredientInput[] | { error: string }> {
  const resolved: IngredientInput[] = [];
  for (const item of items) {
    const chemical = await tx.chemical.findUnique({ where: { id: item.chemicalId } });
    if (!chemical) return { error: "Không tìm thấy hóa chất gốc" };
    resolved.push({
      ...item,
      unit: item.unit || chemical.unit,
    });
  }
  return resolved;
}

async function buildIngredientCreates(
  tx: Prisma.TransactionClient,
  items: IngredientInput[],
) {
  const creates: Prisma.PreparedChemicalIngredientCreateWithoutPreparedChemicalInput[] = [];
  for (const item of items) {
    const chemical = await tx.chemical.findUnique({ where: { id: item.chemicalId } });
    if (!chemical) return { error: "Không tìm thấy hóa chất gốc" as const };
    const unit = item.unit || chemical.unit;
    creates.push({
      chemical: { connect: { id: chemical.id } },
      stockLotId: item.stockLotId,
      chemicalNameSnapshot: chemical.name,
      casProductCodeSnapshot: formatCasProductSnapshot(chemical.casNumber, chemical.productCode),
      lotNumberSnapshot: item.lotNumber || chemical.lot,
      quantityUsed: item.quantityUsed,
      unit,
    });
  }
  return { creates };
}

function revalidateAll() {
  try {
    REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
  } catch {
    // revalidatePath chỉ hoạt động trong Next.js request context
  }
}

function buildBaseData(fd: FormData) {
  const preparedDate = parseFormDate(str(fd, "preparedDate"));
  const expiryDate = parseFormDate(str(fd, "expiryDate"));
  const preparedQuantity = parseQuantity(str(fd, "preparedQuantity"));
  return {
    parentCode: str(fd, "parentCode"),
    sequenceNumber: str(fd, "sequenceNumber"),
    code: str(fd, "code"),
    name: str(fd, "name"),
    concentration: str(fd, "concentration"),
    concentrationUnit: str(fd, "concentrationUnit"),
    preparedQuantity,
    unit: str(fd, "unit"),
    preparedDate,
    expiryDate,
    preparedBy: str(fd, "preparedBy"),
    storageLocation: str(fd, "storageLocation"),
    storageCondition: str(fd, "storageCondition"),
    notes: str(fd, "notes"),
    ...preparationIsoFormData(fd, str),
  };
}

async function resolveAttachmentUrl(
  fd: FormData,
  existing = "",
): Promise<{ url: string; error?: string }> {
  const file = fd.get("attachment");
  if (file instanceof File && file.size > 0) {
    const saved = await savePreparationAttachment(file);
    if (saved.error) return { url: existing, error: saved.error };
    return { url: saved.path ?? existing };
  }
  const keep = str(fd, "attachmentUrl");
  return { url: keep || existing };
}

function isStockError(message: string) {
  return (
    message === STOCK_SHORTAGE_MESSAGE ||
    message.includes(STOCK_SHORTAGE_MESSAGE) ||
    message.startsWith("Lot ") ||
    message.includes("vượt quá tồn kho")
  );
}

export async function previewNextPreparedChemicalBatchCode(fd: FormData) {
  const fixedParent = str(fd, "parentCode");
  if (fixedParent) {
    const parentError = assertValidParentCode(fixedParent);
    if (parentError) return { error: parentError };
    const resolved = await resolvePreparedBatchIdentity(db, "PreparedChemical", fixedParent);
    if ("error" in resolved) return { error: resolved.error };
    return { success: true, ...resolved, codePrefix: "PCHEM", sequenceNumber: 0 };
  }

  const sequenceNumber = str(fd, "sequenceNumber");
  if (!sequenceNumber) return { error: "Nhập số thứ tự để xem mã lô" };
  const resolved = await previewPreparedBatchFromSequence(db, "PreparedChemical", "PCHEM", sequenceNumber);
  if ("error" in resolved) return { error: resolved.error };
  return { success: true, ...resolved };
}

export async function createPreparedChemical(fd: FormData) {
  const user = str(fd, "user") || "System";
  const data = buildBaseData(fd);
  const ingredients = parseIngredients(fd);
  if ("error" in ingredients) return { error: ingredients.error };

  if (!data.name) return { error: "Tên hóa chất pha là bắt buộc" };
  if (!data.preparedDate || !data.expiryDate) return { error: "Ngày pha chế và ngày hết hạn không hợp lệ" };
  const preparedDate = data.preparedDate;
  const expiryDate = data.expiryDate;
  if (!Number.isFinite(data.preparedQuantity) || data.preparedQuantity <= 0) {
    return { error: "Thể tích/khối lượng pha chế không hợp lệ" };
  }
  if (!data.unit) return { error: "ĐVT là bắt buộc" };

  const attachment = await resolveAttachmentUrl(fd);
  if (attachment.error) return { error: attachment.error };

  const newId = randomUUID();

  try {
    const row = await db.$transaction(async (tx) => {
      const batchIdentity = data.parentCode
        ? await resolvePreparedBatchFromSequence(tx, "PreparedChemical", "PCHEM", null, data.parentCode)
        : await resolvePreparedBatchFromSequence(tx, "PreparedChemical", "PCHEM", data.sequenceNumber);
      if ("error" in batchIdentity) throw new Error(batchIdentity.error);

      const resolved = await resolveIngredientUnits(tx, ingredients);
      if ("error" in resolved) throw new Error(resolved.error);

      const withLots = await resolveIngredientLots(tx, resolved);
      if ("error" in withLots) throw new Error(withLots.error);

      const built = await buildIngredientCreates(tx, withLots);
      if ("error" in built) throw new Error(built.error);

      const row = await tx.preparedChemical.create({
        data: {
          id: newId,
          parentCode: batchIdentity.parentCode,
          codePrefix: batchIdentity.codePrefix,
          sequenceNumber: batchIdentity.sequenceNumber,
          batchNumber: batchIdentity.batchNumber,
          code: batchIdentity.code,
          name: data.name,
          concentration: data.concentration,
          concentrationUnit: data.concentrationUnit,
          preparedQuantity: data.preparedQuantity,
          unit: data.unit,
          preparedDate,
          preparedBy: data.preparedBy,
          expiryDate,
          storageLocation: data.storageLocation,
          storageCondition: data.storageCondition,
          status: computePreparedChemicalStatus(expiryDate),
          notes: data.notes,
          formula: data.formula,
          originalConcentration: data.originalConcentration,
          finalConcentration: data.finalConcentration,
          equipmentUsed: data.equipmentUsed,
          preparationCondition: data.preparationCondition,
          attachmentUrl: attachment.url,
          equipmentId: data.equipmentId,
          workflowStatus: "Draft",
          ingredients: { create: built.creates },
        },
        include: { ingredients: true },
      });

      await recordPreparationCreated(tx, "CHEMICAL", row, user);
      return row;
    });

    await logActivity({
      user,
      action: "Created",
      entityType: MODULE_NAME,
      entityId: row.id,
      object: row.code,
      after: row,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Không thể tạo hóa chất pha chế";
    if (isStockError(message)) return { error: message };
    return { error: message };
  }

  revalidateAll();
  return { success: true };
}

export async function updatePreparedChemical(fd: FormData) {
  const user = str(fd, "user") || "System";
  const id = str(fd, "id");
  const data = buildBaseData(fd);
  const ingredients = parseIngredients(fd);
  if ("error" in ingredients) return { error: ingredients.error };

  if (!id || !data.name) return { error: "Thiếu thông tin bắt buộc" };
  if (!isValidFormDate(str(fd, "preparedDate")) || !isValidFormDate(str(fd, "expiryDate"))) {
    return { error: "Ngày pha chế và ngày hết hạn không hợp lệ" };
  }
  if (!data.preparedDate || !data.expiryDate) return { error: "Ngày pha chế và ngày hết hạn không hợp lệ" };
  const preparedDate = data.preparedDate;
  const expiryDate = data.expiryDate;
  if (!Number.isFinite(data.preparedQuantity) || data.preparedQuantity <= 0) {
    return { error: "Thể tích/khối lượng pha chế không hợp lệ" };
  }
  if (!data.unit) return { error: "ĐVT là bắt buộc" };

  const before = await db.preparedChemical.findUnique({
    where: { id },
    include: { ingredients: true },
  });
  if (!before) return { error: "Không tìm thấy hóa chất pha chế" };

  const attachment = await resolveAttachmentUrl(fd, before.attachmentUrl ?? "");
  if (attachment.error) return { error: attachment.error };
  if (before.deletedAt) return { error: "Bản ghi đã bị xóa" };
  if (before.workflowStatus === "Prepared" || before.workflowStatus === "Checked") {
    return { error: "Không thể sửa trực tiếp — hủy hoặc chuyển trạng thái trước" };
  }

  const amendmentReason = str(fd, "amendmentReason");
  if (before.workflowStatus === "Approved") {
    const amendError = assertAmendmentAllowed("Approved", amendmentReason);
    if (amendError) return { error: amendError };
  }

  const restoreLines = before.ingredients.map((ing) =>
    chemicalStockLine(ing.chemicalId, ing.quantityUsed, ing.unit, {
      stockLotId: ing.stockLotId,
      lotNumber: ing.lotNumberSnapshot,
    }),
  );

  try {
    const row = await db.$transaction(async (tx) => {
      const resolved = await resolveIngredientUnits(tx, ingredients);
      if ("error" in resolved) throw new Error(resolved.error);

      const withLots = await resolveIngredientLots(tx, resolved);
      if ("error" in withLots) throw new Error(withLots.error);

      if (preparationHasStockDeducted(before.workflowStatus)) {
        const stockError = await applyInventoryStockChange(tx, {
          user,
          module: MODULE_NAME,
          referenceType: MODULE_NAME,
          referenceId: id,
          restores: restoreLines,
          deducts: ingredientStockLines(withLots),
          notes: `Cập nhật ${before.code}`,
        });
        if (stockError) throw new Error(stockError);
      }

      const built = await buildIngredientCreates(tx, withLots);
      if ("error" in built) throw new Error(built.error);

      await tx.preparedChemicalIngredient.deleteMany({ where: { preparedChemicalId: id } });

      const row = await tx.preparedChemical.update({
        where: { id },
        data: {
          name: data.name,
          concentration: data.concentration,
          concentrationUnit: data.concentrationUnit,
          preparedQuantity: data.preparedQuantity,
          unit: data.unit,
          preparedDate,
          preparedBy: data.preparedBy,
          expiryDate,
          storageLocation: data.storageLocation,
          storageCondition: data.storageCondition,
          status: computePreparedChemicalStatus(expiryDate),
          notes: data.notes,
          formula: data.formula,
          originalConcentration: data.originalConcentration,
          finalConcentration: data.finalConcentration,
          equipmentUsed: data.equipmentUsed,
          preparationCondition: data.preparationCondition,
          attachmentUrl: attachment.url,
          equipmentId: data.equipmentId,
          version: before.workflowStatus === "Approved" ? before.version + 1 : before.version,
          amendmentReason: before.workflowStatus === "Approved" ? amendmentReason : before.amendmentReason,
          ingredients: { create: built.creates },
        },
        include: { ingredients: true },
      });

      await recordPreparationUpdated(
        tx,
        "CHEMICAL",
        row,
        before,
        user,
        before.workflowStatus === "Approved" ? amendmentReason : undefined,
      );
      return row;
    });

    await logActivity({
      user,
      action: "Updated",
      entityType: MODULE_NAME,
      entityId: id,
      object: row.code,
      before,
      after: row,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Không thể cập nhật hóa chất pha chế";
    if (isStockError(message)) return { error: message };
    return { error: message };
  }

  revalidateAll();
  return { success: true };
}

export async function deletePreparedChemical(fd: FormData) {
  const user = str(fd, "user") || "System";
  const id = str(fd, "id");
  if (!id) return { error: "Không tìm thấy hóa chất pha chế" };

  const before = await db.preparedChemical.findUnique({
    where: { id },
    include: { ingredients: true },
  });
  if (!before) return { error: "Không tìm thấy hóa chất pha chế" };
  if (before.deletedAt) return { error: "Bản ghi đã bị xóa" };

  try {
    await db.$transaction(async (tx) => {
      await recordPreparationDeleted(tx, "CHEMICAL", before, user);

      await tx.preparedChemical.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          workflowStatus: "Cancelled",
          code: archivePreparedCode(before.code, id),
        },
      });
    });

    await logActivity({
      user,
      action: "Deleted",
      entityType: MODULE_NAME,
      entityId: id,
      object: before.code,
      before,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Không thể xóa hóa chất pha chế";
    if (isStockError(message)) return { error: message };
    return { error: message };
  }

  revalidateAll();
  return { success: true };
}
