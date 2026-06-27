import type {
  InventorySourceType,
  Prisma,
  StockInSourceType,
  StandardExpiryStatus,
} from "@prisma/client";
import {
  convertQuantity,
  describeUnitMismatch,
  formatStockQty,
  roundStockQuantity,
  sumQuantitiesInUnit,
  unitsAreConvertible,
  UNIT_CONVERSION_ERROR,
} from "@/lib/inventory-units";
import { computeStandardStatus } from "@/lib/standard-status";
import {
  chemicalIdentityMatches,
  lotsMatch,
  standardIdentityMatches,
  strainIdentityMatches,
  toInventorySourceType,
} from "@/lib/services/stock-in-match";

export type StockLotParentRef = {
  sourceType: StockInSourceType;
  masterId: string;
  sourceCode: string;
  sourceName: string;
};

export type StockLotInput = {
  lot: string;
  quantityIn: number;
  unit: string;
  purity?: string;
  uncertainty?: string;
  expiryDate: Date | null;
  afterOpenExpiry?: Date | null;
  coaPath?: string | null;
  storageLocation: string;
  notes: string;
};

export type ApplyStockInOptions = {
  user: string;
  sourceType: StockInSourceType;
  masterId: string;
  sourceCode: string;
  sourceName: string;
  lotInput: StockLotInput;
  notes?: string;
};

type MasterSnapshot = {
  sourceType: InventorySourceType;
  masterId: string;
  sourceCode: string;
  sourceName: string;
  quantity: number;
  unit: string;
};

async function fetchMaster(
  tx: Prisma.TransactionClient,
  sourceType: StockInSourceType,
  masterId: string,
): Promise<MasterSnapshot | null> {
  if (sourceType === "Chemical") {
    const row = await tx.chemical.findUnique({ where: { id: masterId } });
    if (!row) return null;
    return {
      sourceType: "Chemical",
      masterId: row.id,
      sourceCode: row.code,
      sourceName: row.name,
      quantity: row.quantity,
      unit: row.unit,
    };
  }
  if (sourceType === "Standard") {
    const row = await tx.standard.findUnique({ where: { id: masterId } });
    if (!row) return null;
    return {
      sourceType: "Standard",
      masterId: row.id,
      sourceCode: row.code,
      sourceName: row.name,
      quantity: row.quantity,
      unit: row.unit,
    };
  }
  const row = await tx.microbialStrain.findUnique({ where: { id: masterId } });
  if (!row) return null;
  return {
    sourceType: "MicrobialStrain",
    masterId: row.id,
    sourceCode: row.code,
    sourceName: row.name,
    quantity: row.quantity,
    unit: row.unit,
  };
}

function lotCreateData(
  sourceType: StockInSourceType,
  masterId: string,
  input: StockLotInput,
  status: StandardExpiryStatus,
): Prisma.StockLotCreateInput {
  const base = {
    lot: input.lot.trim(),
    quantity: 0,
    unit: input.unit.trim(),
    purity: input.purity?.trim() ?? "",
    uncertainty: input.uncertainty?.trim() ?? "",
    expiryDate: input.expiryDate,
    coaPath: input.coaPath ?? null,
    storageLocation: input.storageLocation,
    notes: input.notes,
    status,
  };
  if (sourceType === "Chemical") {
    return { ...base, chemical: { connect: { id: masterId } } };
  }
  if (sourceType === "Standard") {
    return {
      ...base,
      afterOpenExpiry: input.afterOpenExpiry ?? null,
      standard: { connect: { id: masterId } },
    };
  }
  return { ...base, microbialStrain: { connect: { id: masterId } } };
}

async function findStockLotByLot(
  tx: Prisma.TransactionClient,
  sourceType: StockInSourceType,
  masterId: string,
  lot: string,
) {
  const lots = await tx.stockLot.findMany({
    where:
      sourceType === "Chemical"
        ? { chemicalId: masterId }
        : sourceType === "Standard"
          ? { standardId: masterId }
          : { microbialStrainId: masterId },
  });
  return lots.find((row) => lotsMatch(row.lot, lot)) ?? null;
}

export async function syncMasterQuantityFromLots(
  tx: Prisma.TransactionClient,
  sourceType: StockInSourceType,
  masterId: string,
): Promise<string | null> {
  const master = await fetchMaster(tx, sourceType, masterId);
  if (!master) return "Không tìm thấy vật tư gốc";

  const lots = await tx.stockLot.findMany({
    where:
      sourceType === "Chemical"
        ? { chemicalId: masterId }
        : sourceType === "Standard"
          ? { standardId: masterId }
          : { microbialStrainId: masterId },
    orderBy: { expiryDate: "asc" },
  });

  if (lots.length === 0) {
    if (sourceType === "Chemical") {
      await tx.chemical.update({
        where: { id: masterId },
        data: { quantity: 0, lot: "" },
      });
    } else if (sourceType === "Standard") {
      await tx.standard.update({
        where: { id: masterId },
        data: { quantity: 0, lot: "" },
      });
    } else {
      await tx.microbialStrain.update({
        where: { id: masterId },
        data: { quantity: 0, lot: "" },
      });
    }
    return null;
  }

  let targetUnit = master.unit.trim();
  if (!targetUnit) {
    targetUnit = lots.find((lot) => lot.unit.trim())?.unit.trim() ?? "";
  }
  if (!targetUnit) {
    return "Vật tư gốc chưa có đơn vị tồn kho.";
  }

  for (const lot of lots) {
    const lotUnit = lot.unit.trim();
    if (lotUnit && !unitsAreConvertible(lotUnit, targetUnit)) {
      return `Lot "${lot.lot}" ghi đơn vị ${lotUnit}, không cùng nhóm với đơn vị tổng ${targetUnit}. ${describeUnitMismatch(lotUnit, targetUnit)}`;
    }
  }

  const sum = sumQuantitiesInUnit(
    lots.map((lot) => ({
      quantityUsed: lot.quantity,
      unit: lot.unit.trim() || targetUnit,
    })),
    targetUnit,
  );
  if (typeof sum === "object") return sum.error;

  const lotLabel = lots.length === 1 ? lots[0]!.lot : "Nhiều lot";
  const updateData = {
    quantity: roundStockQuantity(sum),
    unit: targetUnit,
    lot: lotLabel,
  };

  if (sourceType === "Chemical") {
    await tx.chemical.update({ where: { id: masterId }, data: updateData });
  } else if (sourceType === "Standard") {
    await tx.standard.update({ where: { id: masterId }, data: updateData });
  } else {
    await tx.microbialStrain.update({ where: { id: masterId }, data: updateData });
  }

  return null;
}

async function writeInventoryTransaction(
  tx: Prisma.TransactionClient,
  params: {
    user: string;
    module: string;
    master: MasterSnapshot;
    stockLotId: string;
    quantityBefore: number;
    quantityUsed: number;
    quantityAfter: number;
    unit: string;
    referenceType: string;
    referenceId: string;
    notes?: string;
  },
) {
  await tx.inventoryTransaction.create({
    data: {
      user: params.user,
      module: params.module,
      sourceType: params.master.sourceType,
      sourceId: params.master.masterId,
      sourceCode: params.master.sourceCode,
      stockLotId: params.stockLotId,
      quantityBefore: params.quantityBefore,
      quantityUsed: params.quantityUsed,
      quantityAfter: params.quantityAfter,
      unit: params.unit,
      actionType: "Restore",
      transactionType: "CREATE",
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      notes: params.notes ?? "",
    },
  });
}

export async function applyStockIn(
  tx: Prisma.TransactionClient,
  options: ApplyStockInOptions,
): Promise<{ stockLotId: string; stockInLogId: string } | { error: string }> {
  const { sourceType, masterId, lotInput } = options;
  const master = await fetchMaster(tx, sourceType, masterId);
  if (!master) return { error: "Không tìm thấy vật tư gốc" };

  if (lotInput.quantityIn <= 0) {
    return { error: "Số lượng nhập phải lớn hơn 0" };
  }
  if (!lotInput.unit.trim()) {
    return { error: "Thiếu đơn vị" };
  }
  if (!lotInput.lot.trim()) {
    return { error: "Thiếu Lot Number" };
  }

  const status = computeStandardStatus(lotInput.expiryDate);
  let stockLot = await findStockLotByLot(tx, sourceType, masterId, lotInput.lot);

  if (!stockLot) {
    stockLot = await tx.stockLot.create({
      data: lotCreateData(sourceType, masterId, lotInput, status),
    });
  } else if (!stockLot.unit.trim()) {
    stockLot = await tx.stockLot.update({
      where: { id: stockLot.id },
      data: { unit: lotInput.unit.trim() },
    });
  }

  const existingLotUnit = stockLot.unit.trim();
  const inputUnit = lotInput.unit.trim();
  if (existingLotUnit && !unitsAreConvertible(inputUnit, existingLotUnit)) {
    return {
      error: `Lot "${stockLot.lot}" đang ghi đơn vị ${existingLotUnit}; không thể nhập ${inputUnit}. ${describeUnitMismatch(inputUnit, existingLotUnit)}`,
    };
  }

  const targetUnit = existingLotUnit || inputUnit;
  const converted = convertQuantity(lotInput.quantityIn, inputUnit, targetUnit);
  if (typeof converted === "object") return { error: converted.error };

  const before = roundStockQuantity(stockLot.quantity);
  const after = roundStockQuantity(before + converted);

  stockLot = await tx.stockLot.update({
    where: { id: stockLot.id },
    data: {
      quantity: after,
      unit: targetUnit,
      expiryDate: lotInput.expiryDate,
      afterOpenExpiry: lotInput.afterOpenExpiry ?? stockLot.afterOpenExpiry,
      coaPath: lotInput.coaPath ?? stockLot.coaPath,
      storageLocation: lotInput.storageLocation || stockLot.storageLocation,
      notes: lotInput.notes || stockLot.notes,
      purity: lotInput.purity?.trim() || stockLot.purity,
      uncertainty: lotInput.uncertainty?.trim() || stockLot.uncertainty,
      status,
    },
  });

  const stockInLog = await tx.stockInLog.create({
    data: {
      user: options.user,
      sourceType,
      stockLotId: stockLot.id,
      sourceCode: options.sourceCode,
      sourceName: options.sourceName,
      lot: stockLot.lot,
      quantityBefore: before,
      quantityIn: roundStockQuantity(converted),
      quantityAfter: after,
      unit: targetUnit,
      notes: options.notes ?? lotInput.notes,
      referenceId: "",
    },
  });

  await tx.stockInLog.update({
    where: { id: stockInLog.id },
    data: { referenceId: stockInLog.id },
  });

  await writeInventoryTransaction(tx, {
    user: options.user,
    module: "StockIn",
    master,
    stockLotId: stockLot.id,
    quantityBefore: before,
    quantityUsed: roundStockQuantity(converted),
    quantityAfter: after,
    unit: targetUnit,
    referenceType: "StockInLog",
    referenceId: stockInLog.id,
    notes: options.notes ?? lotInput.notes,
  });

  const syncError = await syncMasterQuantityFromLots(tx, sourceType, masterId);
  if (syncError) return { error: syncError };

  return { stockLotId: stockLot.id, stockInLogId: stockInLog.id };
}

export async function findMasterByIdentity(
  tx: Prisma.TransactionClient,
  sourceType: StockInSourceType,
  identity: {
    name: string;
    casNumber?: string;
    manufacturer: string;
    productCode?: string;
    atccProductCode?: string;
  },
) {
  if (sourceType === "Chemical") {
    const rows = await tx.chemical.findMany();
    return (
      rows.find((row) =>
        chemicalIdentityMatches(row, {
          name: identity.name,
          casNumber: identity.casNumber ?? "",
          manufacturer: identity.manufacturer,
          productCode: identity.productCode ?? "",
        }),
      ) ?? null
    );
  }
  if (sourceType === "Standard") {
    const rows = await tx.standard.findMany();
    return (
      rows.find((row) =>
        standardIdentityMatches(row, {
          name: identity.name,
          manufacturer: identity.manufacturer,
          productCode: identity.productCode ?? "",
        }),
      ) ?? null
    );
  }
  const rows = await tx.microbialStrain.findMany();
  return (
    rows.find((row) =>
      strainIdentityMatches(row, {
        name: identity.name,
        atccProductCode: identity.atccProductCode ?? "",
        manufacturer: identity.manufacturer,
      }),
    ) ?? null
  );
}

export async function deductFromStockLotsFifo(
  tx: Prisma.TransactionClient,
  sourceType: StockInSourceType,
  masterId: string,
  quantity: number,
  unit: string,
): Promise<
  | {
      allocations: Array<{ stockLotId: string; quantityBefore: number; quantityUsed: number; quantityAfter: number; unit: string }>;
    }
  | { error: string }
> {
  const lots = await tx.stockLot.findMany({
    where:
      sourceType === "Chemical"
        ? { chemicalId: masterId, quantity: { gt: 0 } }
        : sourceType === "Standard"
          ? { standardId: masterId, quantity: { gt: 0 } }
          : { microbialStrainId: masterId, quantity: { gt: 0 } },
    orderBy: [{ expiryDate: "asc" }, { createdAt: "asc" }],
  });

  if (lots.length === 0) {
    return { error: UNIT_CONVERSION_ERROR };
  }

  let remaining = quantity;
  let remainingUnit = unit.trim();
  const allocations: Array<{
    stockLotId: string;
    quantityBefore: number;
    quantityUsed: number;
    quantityAfter: number;
    unit: string;
  }> = [];

  for (const lot of lots) {
    if (remaining <= 1e-9) break;
    const lotUnit = lot.unit.trim();
    if (!lotUnit) continue;

    const convertedNeed = convertQuantity(remaining, remainingUnit, lotUnit);
    if (typeof convertedNeed === "object") return { error: convertedNeed.error };

    const take = Math.min(lot.quantity, convertedNeed);
    if (take <= 1e-9) continue;

    const before = roundStockQuantity(lot.quantity);
    const after = roundStockQuantity(before - take);
    await tx.stockLot.update({ where: { id: lot.id }, data: { quantity: after } });

    allocations.push({
      stockLotId: lot.id,
      quantityBefore: before,
      quantityUsed: take,
      quantityAfter: after,
      unit: lotUnit,
    });

    const usedInRequestUnit = convertQuantity(take, lotUnit, remainingUnit);
    if (typeof usedInRequestUnit === "object") return { error: usedInRequestUnit.error };
    remaining = roundStockQuantity(remaining - usedInRequestUnit);
  }

  if (remaining > 1e-9) {
    return { error: "Số lượng sử dụng vượt quá tồn kho hiện tại." };
  }

  return { allocations };
}

export async function deductFromSpecificStockLot(
  tx: Prisma.TransactionClient,
  stockLotId: string,
  quantity: number,
  unit: string,
): Promise<
  | {
      stockLotId: string;
      quantityBefore: number;
      quantityUsed: number;
      quantityAfter: number;
      unit: string;
      sourceType: StockInSourceType;
      masterId: string;
    }
  | { error: string }
> {
  const lot = await tx.stockLot.findUnique({ where: { id: stockLotId } });
  if (!lot) return { error: "Không tìm thấy lot tồn kho" };

  const lotUnit = lot.unit.trim();
  if (!lotUnit) return { error: "Lot tồn kho chưa có đơn vị" };

  const converted = convertQuantity(quantity, unit.trim(), lotUnit);
  if (typeof converted === "object") return { error: converted.error };

  if (lot.quantity < converted - 1e-9) {
    return {
      error: `Lot ${lot.lot}: cần ${formatStockQty(converted)} ${lotUnit}, còn ${formatStockQty(lot.quantity)} ${lotUnit}`,
    };
  }

  const before = roundStockQuantity(lot.quantity);
  const take = roundStockQuantity(converted);
  const after = roundStockQuantity(before - take);
  await tx.stockLot.update({ where: { id: lot.id }, data: { quantity: after } });

  const sourceType: StockInSourceType = lot.chemicalId
    ? "Chemical"
    : lot.standardId
      ? "Standard"
      : "MicrobialStrain";
  const masterId = lot.chemicalId ?? lot.standardId ?? lot.microbialStrainId ?? "";
  if (!masterId) return { error: "Lot tồn kho không gắn vật tư gốc" };

  const syncError = await syncMasterQuantityFromLots(tx, sourceType, masterId);
  if (syncError) return { error: syncError };

  return {
    stockLotId: lot.id,
    quantityBefore: before,
    quantityUsed: take,
    quantityAfter: after,
    unit: lotUnit,
    sourceType,
    masterId,
  };
}

export async function restoreToStockLotById(
  tx: Prisma.TransactionClient,
  stockLotId: string,
  quantity: number,
  unit: string,
): Promise<
  | {
      stockLotId: string;
      quantityBefore: number;
      quantityUsed: number;
      quantityAfter: number;
      lotUnit: string;
      sourceType: StockInSourceType;
      masterId: string;
    }
  | { error: string }
> {
  const lot = await tx.stockLot.findUnique({ where: { id: stockLotId } });
  if (!lot) return { error: "Không tìm thấy lot tồn kho để hoàn" };

  const targetUnit = lot.unit.trim() || unit.trim();
  const converted = convertQuantity(quantity, unit.trim(), targetUnit);
  if (typeof converted === "object") return { error: converted.error };

  const before = roundStockQuantity(lot.quantity);
  const after = roundStockQuantity(before + converted);
  await tx.stockLot.update({
    where: { id: lot.id },
    data: { quantity: after, unit: targetUnit },
  });

  const sourceType: StockInSourceType = lot.chemicalId
    ? "Chemical"
    : lot.standardId
      ? "Standard"
      : "MicrobialStrain";
  const masterId = lot.chemicalId ?? lot.standardId ?? lot.microbialStrainId ?? "";
  if (!masterId) return { error: "Lot tồn kho không gắn vật tư gốc" };

  const syncError = await syncMasterQuantityFromLots(tx, sourceType, masterId);
  if (syncError) return { error: syncError };

  return {
    stockLotId: lot.id,
    quantityBefore: before,
    quantityUsed: roundStockQuantity(converted),
    quantityAfter: after,
    lotUnit: targetUnit,
    sourceType,
    masterId,
  };
}

export async function restoreToStockLot(
  tx: Prisma.TransactionClient,
  sourceType: StockInSourceType,
  masterId: string,
  quantity: number,
  unit: string,
  preferredLot?: string,
): Promise<
  | {
      stockLotId: string;
      quantityBefore: number;
      quantityUsed: number;
      quantityAfter: number;
      lotUnit: string;
    }
  | { error: string }
> {
  let stockLot = preferredLot
    ? await findStockLotByLot(tx, sourceType, masterId, preferredLot)
    : null;

  if (!stockLot) {
    const lots = await tx.stockLot.findMany({
      where:
        sourceType === "Chemical"
          ? { chemicalId: masterId }
          : sourceType === "Standard"
            ? { standardId: masterId }
            : { microbialStrainId: masterId },
      orderBy: { updatedAt: "desc" },
    });
    stockLot = lots[0] ?? null;
  }

  if (!stockLot) {
    stockLot = await tx.stockLot.create({
      data: lotCreateData(
        sourceType,
        masterId,
        {
          lot: preferredLot?.trim() || "RESTORE",
          quantityIn: 0,
          unit: unit.trim(),
          expiryDate: null,
          storageLocation: "",
          notes: "",
        },
        "Ready",
      ),
    });
  }

  const targetUnit = stockLot.unit.trim() || unit.trim();
  const converted = convertQuantity(quantity, unit.trim(), targetUnit);
  if (typeof converted === "object") return { error: converted.error };

  const before = roundStockQuantity(stockLot.quantity);
  const after = roundStockQuantity(before + converted);
  stockLot = await tx.stockLot.update({
    where: { id: stockLot.id },
    data: { quantity: after, unit: targetUnit },
  });

  return {
    stockLotId: stockLot.id,
    quantityBefore: before,
    quantityUsed: roundStockQuantity(converted),
    quantityAfter: after,
    lotUnit: targetUnit,
  };
}

export type StockLotRef = {
  id: string;
  lot: string;
  coaPath: string | null;
  sourceType: StockInSourceType;
  masterId: string;
  sourceCode: string;
  sourceName: string;
};

export async function resolveStockLotRef(
  tx: Prisma.TransactionClient,
  stockLotId: string,
): Promise<StockLotRef | null> {
  const row = await tx.stockLot.findUnique({
    where: { id: stockLotId },
    include: {
      chemical: { select: { id: true, code: true, name: true } },
      standard: { select: { id: true, code: true, name: true } },
      microbialStrain: { select: { id: true, code: true, name: true } },
    },
  });
  if (!row) return null;

  if (row.chemicalId && row.chemical) {
    return {
      id: row.id,
      lot: row.lot,
      coaPath: row.coaPath,
      sourceType: "Chemical",
      masterId: row.chemicalId,
      sourceCode: row.chemical.code,
      sourceName: row.chemical.name,
    };
  }
  if (row.standardId && row.standard) {
    return {
      id: row.id,
      lot: row.lot,
      coaPath: row.coaPath,
      sourceType: "Standard",
      masterId: row.standardId,
      sourceCode: row.standard.code,
      sourceName: row.standard.name,
    };
  }
  if (row.microbialStrainId && row.microbialStrain) {
    return {
      id: row.id,
      lot: row.lot,
      coaPath: row.coaPath,
      sourceType: "MicrobialStrain",
      masterId: row.microbialStrainId,
      sourceCode: row.microbialStrain.code,
      sourceName: row.microbialStrain.name,
    };
  }
  return null;
}

export async function stockLotInUseMessage(
  tx: Prisma.TransactionClient,
  stockLotId: string,
): Promise<string | null> {
  const [ingredients, components, solvents, strains] = await Promise.all([
    tx.preparedChemicalIngredient.count({ where: { stockLotId } }),
    tx.preparedStandardComponent.count({ where: { stockLotId } }),
    tx.preparedStandardSolvent.count({ where: { stockLotId } }),
    tx.preparedStrain.count({ where: { sourceStockLotId: stockLotId } }),
  ]);

  if (ingredients > 0) return "Không thể xóa lot vì đang được dùng trong hóa chất pha chế.";
  if (components > 0) return "Không thể xóa lot vì đang được dùng trong chuẩn pha chế.";
  if (solvents > 0) return "Không thể xóa lot vì đang được dùng làm dung môi pha chuẩn.";
  if (strains > 0) return "Không thể xóa lot vì đang được dùng trong chủng pha.";
  return null;
}

export async function deleteStockLotInTransaction(
  tx: Prisma.TransactionClient,
  stockLotId: string,
): Promise<{ error?: string; ref?: StockLotRef }> {
  const ref = await resolveStockLotRef(tx, stockLotId);
  if (!ref) return { error: "Không tìm thấy lot tồn kho" };

  const inUse = await stockLotInUseMessage(tx, stockLotId);
  if (inUse) return { error: inUse };

  await tx.stockLot.delete({ where: { id: stockLotId } });

  const syncError = await syncMasterQuantityFromLots(tx, ref.sourceType, ref.masterId);
  if (syncError) return { error: syncError };

  return { ref };
}

export { toInventorySourceType, UNIT_CONVERSION_ERROR };
