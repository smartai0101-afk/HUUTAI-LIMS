"use server";

import type { PreparedStandardLevel, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import { formatCasProductSnapshot } from "@/lib/chemicals-fields";
import { db } from "@/lib/db";
import {
  applyInventoryStockChange,
  chemicalStockLine,
  preparedStandardComponentToStockLines,
  preparedStandardSolventToStockLines,
  preparedStandardStockLine,
  standardStockLine,
  STOCK_SHORTAGE_MESSAGE,
} from "@/lib/inventory-stock";
import { isValidFormDate, parseFormDate } from "@/lib/modules/shared";
import {
  archivePreparedCode,
  findActivePreparedStandardByCode,
  releaseSoftDeletedPreparedStandardCode,
} from "@/lib/prepared-code-guard";
import { computePreparedStandardStatus } from "@/lib/prepared-standard-status";
import {
  PARENT_LEVEL_REQUIRED_MESSAGE,
  PARENT_SOURCE_LEVEL,
  PREPARED_STANDARD_LEVEL_LABELS,
  usesStandardCatalog,
  usesMultiLevelSource,
  WORKING_SOURCE_LEVELS,
} from "@/lib/prepared-standards-fields";
import { resolveStockLotSelection } from "@/lib/resolve-stock-lot-selection";
import {
  recordPreparationCreated,
  recordPreparationDeleted,
  recordPreparationUpdated,
  assertAmendmentAllowed,
} from "@/lib/services/preparation-workflow";
import { preparationHasStockDeducted, restorePreparationStock } from "@/lib/services/preparation-transition-stock";

const REVALIDATE_PATHS = ["/prepared-standards", "/standards", "/chemicals", "/", "/reports"];
const MODULE_NAME = "PreparedStandard";

function isStockError(message: string) {
  return (
    message === STOCK_SHORTAGE_MESSAGE ||
    message.includes(STOCK_SHORTAGE_MESSAGE) ||
    message.startsWith("Lot ") ||
    message.includes("vượt quá tồn kho")
  );
}

function componentInputToStockLines(items: ComponentInput[]) {
  return items.flatMap((item) => {
    if (item.sourceType === "Standard" && item.standardId) {
      return [
        standardStockLine(item.standardId, item.quantityUsed, item.unit, {
          stockLotId: item.stockLotId,
          lotNumber: item.lotNumber,
        }),
      ];
    }
    if (item.sourcePreparedStandardId) {
      return [
        preparedStandardStockLine(item.sourcePreparedStandardId, item.quantityUsed, item.unit),
      ];
    }
    return [];
  });
}

function solventInputToStockLines(items: SolventInput[]) {
  return items.map((item) =>
    chemicalStockLine(item.chemicalId, item.quantityUsed, item.unit, {
      stockLotId: item.stockLotId,
      lotNumber: item.lotNumber,
    }),
  );
}

type ComponentInput = {
  sourceType: "Standard" | "PreparedStandard";
  standardId?: string;
  sourcePreparedStandardId?: string;
  /** Cấp chuẩn nguồn — bắt buộc khi pha Chuẩn làm việc. */
  sourceLevel?: PreparedStandardLevel;
  quantityUsed: number;
  unit: string;
  stockLotId?: string | null;
  lotNumber?: string;
};

type SolventInput = {
  chemicalId: string;
  quantityUsed: number;
  unit: string;
  stockLotId?: string | null;
  lotNumber?: string;
};

const PREPARED_STANDARD_CODE_PATTERN = /^PSTD-/i;

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseQuantity(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function parseLevel(value: string): PreparedStandardLevel | null {
  const allowed: PreparedStandardLevel[] = [
    "RootPrepared",
    "Intermediate1",
    "Intermediate2",
    "Intermediate3",
    "WorkingPrepared",
  ];
  return allowed.includes(value as PreparedStandardLevel) ? (value as PreparedStandardLevel) : null;
}

function parseJsonArray<T>(raw: string, label: string): T[] | { error: string } {
  if (!raw) return { error: `Thiếu ${label}` };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return { error: `${label} không hợp lệ` };
    return parsed as T[];
  } catch {
    return { error: `${label} không hợp lệ` };
  }
}

function normalizeRelationId(value: unknown, label: string): string | { error: string } {
  const id = String(value ?? "").trim();
  if (!id) return { error: `${label} là bắt buộc` };
  if (PREPARED_STANDARD_CODE_PATTERN.test(id)) {
    return {
      error: `${label} không hợp lệ — phải là ID database, không phải mã chuẩn. Vui lòng chọn lại từ dropdown.`,
    };
  }
  return id;
}

function parseComponents(
  fd: FormData,
  level: PreparedStandardLevel,
): ComponentInput[] | { error: string } {
  const parsed = parseJsonArray<{
    sourceType?: string;
    standardId?: string;
    sourcePreparedStandardId?: string;
    sourceLevel?: string;
    quantityUsed?: number;
    unit?: string;
    stockLotId?: string;
    lotNumber?: string;
  }>(str(fd, "components"), "chuẩn gốc sử dụng");
  if ("error" in parsed) return parsed;

  const items: ComponentInput[] = [];
  const fromCatalog = usesStandardCatalog(level);
  const multiLevel = usesMultiLevelSource(level);

  for (const item of parsed) {
    const quantityUsed = Number(item.quantityUsed);
    const unit = String(item.unit ?? "").trim();

    if (!Number.isFinite(quantityUsed) || quantityUsed <= 0) {
      return { error: "Thông tin chuẩn gốc sử dụng không hợp lệ" };
    }

    if (fromCatalog) {
      const standardId = normalizeRelationId(item.standardId, "Chuẩn gốc sử dụng");
      if (typeof standardId === "object") return standardId;
      items.push({
        sourceType: "Standard",
        standardId,
        quantityUsed,
        unit,
        stockLotId: String(item.stockLotId ?? "").trim() || null,
        lotNumber: String(item.lotNumber ?? "").trim(),
      });
    } else if (multiLevel) {
      const sourceLevel = parseLevel(String(item.sourceLevel ?? "").trim());
      if (!sourceLevel || !WORKING_SOURCE_LEVELS.includes(sourceLevel)) {
        return { error: "Cần chọn cấp chuẩn nguồn" };
      }
      const sourcePreparedStandardId = normalizeRelationId(
        item.sourcePreparedStandardId,
        "Chuẩn pha chế nguồn",
      );
      if (typeof sourcePreparedStandardId === "object") return sourcePreparedStandardId;
      items.push({
        sourceType: "PreparedStandard",
        sourcePreparedStandardId,
        sourceLevel,
        quantityUsed,
        unit,
      });
    } else {
      const sourcePreparedStandardId = normalizeRelationId(
        item.sourcePreparedStandardId,
        "Chuẩn pha chế nguồn",
      );
      if (typeof sourcePreparedStandardId === "object") return sourcePreparedStandardId;
      items.push({
        sourceType: "PreparedStandard",
        sourcePreparedStandardId,
        quantityUsed,
        unit,
      });
    }
  }
  return items;
}

function parseSolvents(fd: FormData): SolventInput[] | { error: string } {
  const parsed = parseJsonArray<{
    chemicalId?: string;
    quantityUsed?: number;
    unit?: string;
    stockLotId?: string;
    lotNumber?: string;
  }>(
    str(fd, "solvents"),
    "dung môi sử dụng",
  );
  if ("error" in parsed) return parsed;
  const items: SolventInput[] = [];
  for (const item of parsed) {
    const chemicalId = String(item.chemicalId ?? "").trim();
    const quantityUsed = Number(item.quantityUsed);
    const unit = String(item.unit ?? "").trim();
    if (!chemicalId || !Number.isFinite(quantityUsed) || quantityUsed <= 0) {
      return { error: "Thông tin dung môi sử dụng không hợp lệ" };
    }
    items.push({
      chemicalId,
      quantityUsed,
      unit,
      stockLotId: String(item.stockLotId ?? "").trim() || null,
      lotNumber: String(item.lotNumber ?? "").trim(),
    });
  }
  return items;
}

async function resolveComponentLots(
  tx: Prisma.TransactionClient,
  items: ComponentInput[],
  level: PreparedStandardLevel,
): Promise<ComponentInput[] | { error: string }> {
  if (!usesStandardCatalog(level)) return items;
  const resolved: ComponentInput[] = [];
  for (const item of items) {
    if (!item.standardId) return { error: "Chuẩn gốc sử dụng không hợp lệ" };
    const lotResolved = await resolveStockLotSelection(
      tx,
      "Standard",
      item.standardId,
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

async function resolveSolventLots(
  tx: Prisma.TransactionClient,
  items: SolventInput[],
): Promise<SolventInput[] | { error: string }> {
  const resolved: SolventInput[] = [];
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

function revalidateAll() {
  try {
    REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
  } catch {
    // revalidatePath chỉ hoạt động trong Next.js request context
  }
}

function validateDates(preparedDate: Date, expiryDate: Date) {
  if (expiryDate.getTime() <= preparedDate.getTime()) {
    return "Ngày hết hạn phải sau ngày pha chế";
  }
  return null;
}

async function validateParentLevelExists(level: PreparedStandardLevel) {
  if (usesMultiLevelSource(level)) {
    const count = await db.preparedStandard.count({
      where: { level: { in: WORKING_SOURCE_LEVELS } },
    });
    if (count === 0) {
      return PARENT_LEVEL_REQUIRED_MESSAGE[level] ?? "Chưa có chuẩn pha chế nguồn";
    }
    return null;
  }

  const parentLevel = PARENT_SOURCE_LEVEL[level];
  if (parentLevel === "Standard" || parentLevel === null) return null;

  const count = await db.preparedStandard.count({ where: { level: parentLevel } });
  if (count === 0) {
    return PARENT_LEVEL_REQUIRED_MESSAGE[level] ?? "Chưa có cấp chuẩn liền trước";
  }
  return null;
}

async function buildComponentCreates(
  tx: Prisma.TransactionClient,
  items: ComponentInput[],
  level: PreparedStandardLevel,
  excludePreparedStandardId?: string,
) {
  const creates: Prisma.PreparedStandardComponentCreateWithoutPreparedStandardInput[] = [];

  for (const item of items) {
    if (usesStandardCatalog(level)) {
      const standard = await tx.standard.findUnique({ where: { id: item.standardId } });
      if (!standard) return { error: "Không tìm thấy chất chuẩn gốc" as const };
      creates.push({
        sourceType: "Standard",
        standard: { connect: { id: standard.id } },
        stockLotId: item.stockLotId,
        standardCodeSnapshot: standard.code,
        standardNameSnapshot: standard.name,
        manufacturerSnapshot: standard.manufacturer,
        productCodeSnapshot: standard.productCode,
        lotNumberSnapshot: item.lotNumber || standard.lot,
        puritySnapshot: standard.purity,
        quantityUsed: item.quantityUsed,
        unit: item.unit || standard.unit,
      });
    } else {
      const sourcePreparedStandardId = item.sourcePreparedStandardId!;
      const source = await tx.preparedStandard.findUnique({
        where: { id: sourcePreparedStandardId },
      });
      if (!source) {
        return {
          error:
            "Không tìm thấy chuẩn pha chế nguồn — ID có thể đã hết hạn. Vui lòng tải lại trang và chọn lại nguồn từ dropdown.",
        } as const;
      }

      const expectedLevel = usesMultiLevelSource(level)
        ? item.sourceLevel
        : (PARENT_SOURCE_LEVEL[level] as PreparedStandardLevel);

      if (!expectedLevel || source.level !== expectedLevel) {
        const label = expectedLevel
          ? PREPARED_STANDARD_LEVEL_LABELS[expectedLevel]
          : "đúng cấp";
        return { error: `Chuẩn nguồn phải thuộc cấp ${label}` } as const;
      }
      if (excludePreparedStandardId && source.id === excludePreparedStandardId) {
        return { error: "Không thể chọn chính chuẩn pha chế làm nguồn" as const };
      }
      creates.push({
        sourceType: "PreparedStandard",
        sourcePreparedStandard: { connect: { id: source.id } },
        standardCodeSnapshot: source.code,
        standardNameSnapshot: source.name,
        lotNumberSnapshot: source.code,
        concentrationSnapshot: source.concentration,
        concentrationUnitSnapshot: source.concentrationUnit,
        levelSnapshot: source.level,
        preparedDateSnapshot: source.preparedDate,
        expiryDateSnapshot: source.expiryDate,
        quantityUsed: item.quantityUsed,
        unit: item.unit || source.concentrationUnit || "mL",
      });
    }
  }
  return { creates };
}

async function buildSolventCreates(tx: Prisma.TransactionClient, items: SolventInput[]) {
  const creates: Prisma.PreparedStandardSolventCreateWithoutPreparedStandardInput[] = [];
  for (const item of items) {
    const chemical = await tx.chemical.findUnique({ where: { id: item.chemicalId } });
    if (!chemical) return { error: "Không tìm thấy hóa chất gốc" as const };
    creates.push({
      chemical: { connect: { id: chemical.id } },
      stockLotId: item.stockLotId,
      chemicalCodeSnapshot: chemical.code,
      chemicalNameSnapshot: chemical.name,
      casProductCodeSnapshot: formatCasProductSnapshot(chemical.casNumber, chemical.productCode),
      lotNumberSnapshot: item.lotNumber || chemical.lot,
      quantityUsed: item.quantityUsed,
      unit: item.unit || chemical.unit,
    });
  }
  return { creates };
}

function buildBaseData(fd: FormData) {
  return {
    code: str(fd, "code"),
    name: str(fd, "name"),
    level: parseLevel(str(fd, "level")),
    concentration: str(fd, "concentration"),
    concentrationUnit: str(fd, "concentrationUnit"),
    solventVolume: parseQuantity(str(fd, "solventVolume")),
    solventUnit: str(fd, "solventUnit"),
    preparedDate: parseFormDate(str(fd, "preparedDate")),
    expiryDate: parseFormDate(str(fd, "expiryDate")),
    preparedBy: str(fd, "preparedBy"),
    storageLocation: str(fd, "storageLocation"),
    storageCondition: str(fd, "storageCondition"),
    notes: str(fd, "notes"),
  };
}

function validateBase(
  data: ReturnType<typeof buildBaseData>,
  components: ComponentInput[],
  solvents: SolventInput[],
) {
  if (!data.code || !data.name) return "Mã và tên chuẩn pha chế là bắt buộc";
  if (!data.level) return "Cấp chuẩn là bắt buộc";
  if (!data.concentration) return "Nồng độ là bắt buộc";
  if (!data.preparedDate || !data.expiryDate) return "Ngày pha chế và ngày hết hạn là bắt buộc";
  const dateError = validateDates(data.preparedDate, data.expiryDate);
  if (dateError) return dateError;
  if (!components.length) return "Cần ít nhất một chuẩn gốc sử dụng";
  if (!solvents.length) return "Cần ít nhất một dung môi sử dụng";
  return null;
}

export async function createPreparedStandard(fd: FormData) {
  const user = str(fd, "user") || "System";
  const data = buildBaseData(fd);
  if (!data.level) return { error: "Cấp chuẩn là bắt buộc" };

  const parentError = await validateParentLevelExists(data.level);
  if (parentError) return { error: parentError };

  const components = parseComponents(fd, data.level);
  if ("error" in components) return { error: components.error };
  const solvents = parseSolvents(fd);
  if ("error" in solvents) return { error: solvents.error };

  const validationError = validateBase(data, components, solvents);
  if (validationError) return { error: validationError };

  if (await findActivePreparedStandardByCode(data.code)) {
    return { error: "Mã chuẩn pha chế đã tồn tại" };
  }
  await releaseSoftDeletedPreparedStandardCode(data.code);

  const newId = randomUUID();
  const initialQuantity = Number.isFinite(data.solventVolume) ? data.solventVolume : 0;
  const initialUnit = data.solventUnit || "mL";

  try {
    const row = await db.$transaction(async (tx) => {
      const resolvedComponents = await resolveComponentLots(tx, components, data.level!);
      if ("error" in resolvedComponents) throw new Error(resolvedComponents.error);
      const resolvedSolvents = await resolveSolventLots(tx, solvents);
      if ("error" in resolvedSolvents) throw new Error(resolvedSolvents.error);

      const builtComponents = await buildComponentCreates(tx, resolvedComponents, data.level!);
      if ("error" in builtComponents) throw new Error(builtComponents.error);
      const builtSolvents = await buildSolventCreates(tx, resolvedSolvents);
      if ("error" in builtSolvents) throw new Error(builtSolvents.error);

      const row = await tx.preparedStandard.create({
        data: {
          id: newId,
          code: data.code,
          name: data.name,
          level: data.level!,
          concentration: data.concentration,
          concentrationUnit: data.concentrationUnit,
          solventVolume: Number.isFinite(data.solventVolume) ? data.solventVolume : 0,
          solventUnit: data.solventUnit,
          quantity: initialQuantity,
          unit: initialUnit,
          preparedDate: data.preparedDate!,
          expiryDate: data.expiryDate!,
          preparedBy: data.preparedBy,
          status: computePreparedStandardStatus(data.expiryDate!),
          storageLocation: data.storageLocation,
          storageCondition: data.storageCondition,
          notes: data.notes,
          workflowStatus: "Draft",
          components: { create: builtComponents.creates },
          solvents: { create: builtSolvents.creates },
        },
        include: { components: true, solvents: true },
      });

      await recordPreparationCreated(tx, "STANDARD", row, user);
      return row;
    });

    await logActivity({
      user,
      action: "Created",
      entityType: "PreparedStandard",
      entityId: row.id,
      object: data.code,
      after: row,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Không thể tạo chuẩn pha chế";
    if (isStockError(message)) return { error: message };
    return { error: message };
  }

  revalidateAll();
  return { success: true };
}

export async function updatePreparedStandard(fd: FormData) {
  const user = str(fd, "user") || "System";
  const id = str(fd, "id");
  const data = buildBaseData(fd);
  if (!data.level) return { error: "Cấp chuẩn là bắt buộc" };

  const components = parseComponents(fd, data.level);
  if ("error" in components) return { error: components.error };
  const solvents = parseSolvents(fd);
  if ("error" in solvents) return { error: solvents.error };

  if (!id) return { error: "Không tìm thấy chuẩn pha chế" };
  const validationError = validateBase(data, components, solvents);
  if (validationError) return { error: validationError };
  if (!isValidFormDate(str(fd, "preparedDate")) || !isValidFormDate(str(fd, "expiryDate"))) {
    return { error: "Ngày pha chế và ngày hết hạn không hợp lệ" };
  }

  const before = await db.preparedStandard.findUnique({
    where: { id },
    include: { components: true, solvents: true },
  });
  if (!before) return { error: "Không tìm thấy chuẩn pha chế" };
  if (before.deletedAt) return { error: "Bản ghi đã bị xóa" };
  if (before.workflowStatus === "Prepared" || before.workflowStatus === "Checked") {
    return { error: "Không thể sửa trực tiếp — hủy hoặc chuyển trạng thái trước" };
  }

  const amendmentReason = str(fd, "amendmentReason");
  if (before.workflowStatus === "Approved") {
    const amendError = assertAmendmentAllowed("Approved", amendmentReason);
    if (amendError) return { error: amendError };
  }

  if (await findActivePreparedStandardByCode(data.code, id)) {
    return { error: "Mã chuẩn pha chế đã tồn tại" };
  }
  await releaseSoftDeletedPreparedStandardCode(data.code);

  try {
    const row = await db.$transaction(async (tx) => {
      const resolvedComponents = await resolveComponentLots(tx, components, data.level!);
      if ("error" in resolvedComponents) throw new Error(resolvedComponents.error);
      const resolvedSolvents = await resolveSolventLots(tx, solvents);
      if ("error" in resolvedSolvents) throw new Error(resolvedSolvents.error);

      if (preparationHasStockDeducted(before.workflowStatus)) {
        const stockError = await applyInventoryStockChange(tx, {
          user,
          module: MODULE_NAME,
          referenceType: MODULE_NAME,
          referenceId: id,
          restores: [
            ...preparedStandardComponentToStockLines(before.components),
            ...preparedStandardSolventToStockLines(before.solvents),
          ],
          deducts: [
            ...componentInputToStockLines(resolvedComponents),
            ...solventInputToStockLines(resolvedSolvents),
          ],
          notes: `Cập nhật ${data.code}`,
        });
        if (stockError) throw new Error(stockError);
      }

      const builtComponents = await buildComponentCreates(tx, resolvedComponents, data.level!, id);
      if ("error" in builtComponents) throw new Error(builtComponents.error);
      const builtSolvents = await buildSolventCreates(tx, resolvedSolvents);
      if ("error" in builtSolvents) throw new Error(builtSolvents.error);

      await tx.preparedStandardComponent.deleteMany({ where: { preparedStandardId: id } });
      await tx.preparedStandardSolvent.deleteMany({ where: { preparedStandardId: id } });

      const row = await tx.preparedStandard.update({
        where: { id },
        data: {
          code: data.code,
          name: data.name,
          level: data.level!,
          concentration: data.concentration,
          concentrationUnit: data.concentrationUnit,
          solventVolume: Number.isFinite(data.solventVolume) ? data.solventVolume : 0,
          solventUnit: data.solventUnit,
          preparedDate: data.preparedDate!,
          expiryDate: data.expiryDate!,
          preparedBy: data.preparedBy,
          status: computePreparedStandardStatus(data.expiryDate!),
          storageLocation: data.storageLocation,
          storageCondition: data.storageCondition,
          notes: data.notes,
          version: before.workflowStatus === "Approved" ? before.version + 1 : before.version,
          amendmentReason: before.workflowStatus === "Approved" ? amendmentReason : before.amendmentReason,
          components: { create: builtComponents.creates },
          solvents: { create: builtSolvents.creates },
        },
        include: { components: true, solvents: true },
      });

      await recordPreparationUpdated(
        tx,
        "STANDARD",
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
      entityType: "PreparedStandard",
      entityId: id,
      object: row.code,
      before,
      after: row,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Không thể cập nhật chuẩn pha chế";
    if (isStockError(message)) return { error: message };
    return { error: message };
  }

  revalidateAll();
  return { success: true };
}

export async function deletePreparedStandard(fd: FormData) {
  const user = str(fd, "user") || "System";
  const id = str(fd, "id");
  if (!id) return { error: "Không tìm thấy chuẩn pha chế" };

  const usedAsSource = await db.preparedStandardComponent.count({
    where: { sourcePreparedStandardId: id },
  });
  if (usedAsSource > 0) {
    return {
      error: "Không thể xóa — chuẩn pha chế này đang được dùng làm nguồn cho cấp chuẩn khác",
    };
  }

  const before = await db.preparedStandard.findUnique({
    where: { id },
    include: { components: true, solvents: true },
  });
  if (!before) return { error: "Không tìm thấy chuẩn pha chế" };
  if (before.deletedAt) return { error: "Bản ghi đã bị xóa" };

  try {
    await db.$transaction(async (tx) => {
      if (preparationHasStockDeducted(before.workflowStatus)) {
        const stockError = await restorePreparationStock(tx, "STANDARD", id, user);
        if (stockError) throw new Error(stockError);
      }

      await recordPreparationDeleted(tx, "STANDARD", before, user);

      await tx.preparedStandard.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          workflowStatus: "Cancelled",
          code: archivePreparedCode(before.code, id),
        },
      });
    });

    await logActivity({
      action: "Deleted",
      entityType: "PreparedStandard",
      entityId: id,
      object: before.code,
      before,
      user,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Không thể xóa chuẩn pha chế";
    if (isStockError(message)) return { error: message };
    return { error: message };
  }

  revalidateAll();
  return { success: true };
}
