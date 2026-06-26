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
import { computePreparedChemicalStatus } from "@/lib/prepared-chemical-status";

import { resolveStockLotSelection } from "@/lib/resolve-stock-lot-selection";

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
  };
}

function isStockError(message: string) {
  return (
    message === STOCK_SHORTAGE_MESSAGE ||
    message.includes(STOCK_SHORTAGE_MESSAGE) ||
    message.startsWith("Lot ") ||
    message.includes("vượt quá tồn kho")
  );
}

export async function createPreparedChemical(fd: FormData) {
  const user = str(fd, "user") || "System";
  const data = buildBaseData(fd);
  const ingredients = parseIngredients(fd);
  if ("error" in ingredients) return { error: ingredients.error };

  if (!data.code || !data.name) return { error: "Mã và tên hóa chất pha là bắt buộc" };
  if (!data.preparedDate || !data.expiryDate) return { error: "Ngày pha chế và ngày hết hạn không hợp lệ" };
  const preparedDate = data.preparedDate;
  const expiryDate = data.expiryDate;
  if (!Number.isFinite(data.preparedQuantity) || data.preparedQuantity <= 0) {
    return { error: "Thể tích/khối lượng pha chế không hợp lệ" };
  }
  if (!data.unit) return { error: "ĐVT là bắt buộc" };
  if (await db.preparedChemical.findUnique({ where: { code: data.code } })) {
    return { error: "Mã hóa chất pha đã tồn tại" };
  }

  const newId = randomUUID();

  try {
    const row = await db.$transaction(async (tx) => {
      const resolved = await resolveIngredientUnits(tx, ingredients);
      if ("error" in resolved) throw new Error(resolved.error);

      const withLots = await resolveIngredientLots(tx, resolved);
      if ("error" in withLots) throw new Error(withLots.error);

      const built = await buildIngredientCreates(tx, withLots);
      if ("error" in built) throw new Error(built.error);

      const stockError = await applyInventoryStockChange(tx, {
        user,
        module: MODULE_NAME,
        referenceType: MODULE_NAME,
        referenceId: newId,
        deducts: ingredientStockLines(withLots),
        notes: `Tạo ${data.code}`,
      });
      if (stockError) throw new Error(stockError);

      return tx.preparedChemical.create({
        data: {
          id: newId,
          code: data.code,
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
          ingredients: { create: built.creates },
        },
        include: { ingredients: true },
      });
    });

    await logActivity({
      user,
      action: "Created",
      entityType: MODULE_NAME,
      entityId: row.id,
      object: data.code,
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

  if (!id || !data.code || !data.name) return { error: "Thiếu thông tin bắt buộc" };
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

  const duplicate = await db.preparedChemical.findFirst({
    where: { code: data.code, NOT: { id } },
  });
  if (duplicate) return { error: "Mã hóa chất pha đã tồn tại" };

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

      const stockError = await applyInventoryStockChange(tx, {
        user,
        module: MODULE_NAME,
        referenceType: MODULE_NAME,
        referenceId: id,
        restores: restoreLines,
        deducts: ingredientStockLines(withLots),
        notes: `Cập nhật ${data.code}`,
      });
      if (stockError) throw new Error(stockError);

      const built = await buildIngredientCreates(tx, withLots);
      if ("error" in built) throw new Error(built.error);

      await tx.preparedChemicalIngredient.deleteMany({ where: { preparedChemicalId: id } });

      return tx.preparedChemical.update({
        where: { id },
        data: {
          code: data.code,
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
          ingredients: { create: built.creates },
        },
        include: { ingredients: true },
      });
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

  const restoreLines = before.ingredients.map((ing) =>
    chemicalStockLine(ing.chemicalId, ing.quantityUsed, ing.unit, {
      stockLotId: ing.stockLotId,
      lotNumber: ing.lotNumberSnapshot,
    }),
  );

  try {
    await db.$transaction(async (tx) => {
      const stockError = await applyInventoryStockChange(tx, {
        user,
        module: MODULE_NAME,
        referenceType: MODULE_NAME,
        referenceId: id,
        restores: restoreLines,
        notes: `Xóa ${before.code}`,
      });
      if (stockError) throw new Error(stockError);

      await tx.preparedChemical.delete({ where: { id } });
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
