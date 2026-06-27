import type { InventoryActionType, InventorySourceType, InventoryTransactionType, Prisma, StockInSourceType } from "@prisma/client";
import {
  convertQuantity,
  formatStockQty,
  roundStockQuantity,
  STOCK_SHORTAGE_MESSAGE,
  sumQuantitiesInUnit,
  UNIT_CONVERSION_ERROR,
} from "@/lib/inventory-units";
import {
  allowFifoWithoutLotSelection,
  FIFO_NOT_ALLOWED_MESSAGE,
} from "@/lib/inventory-lot-policy";
import {
  deductFromSpecificStockLot,
  deductFromStockLotsFifo,
  restoreToStockLot,
  restoreToStockLotById,
  syncMasterQuantityFromLots,
} from "@/lib/stock-lot";
import { actionTypeToTransactionType } from "@/lib/services/inventory-transaction-types";

export {
  formatStockQty,
  roundStockQuantity,
  STOCK_SHORTAGE_MESSAGE,
  STOCK_SHORTAGE_MESSAGE as STOCK_ERROR_PREFIX,
  UNIT_CONVERSION_ERROR,
} from "@/lib/inventory-units";

export type InventoryStockLineOpts = {
  stockLotId?: string | null;
  lotNumber?: string | null;
};

export type InventoryStockLine = {
  sourceType: InventorySourceType;
  sourceId: string;
  quantityUsed: number;
  unit: string;
  stockLotId?: string | null;
  lotNumber?: string | null;
};

type StockRecord = {
  sourceType: InventorySourceType;
  sourceId: string;
  sourceCode: string;
  sourceName: string;
  quantity: number;
  unit: string;
};

type ApplyInventoryOptions = {
  user: string;
  module: string;
  referenceType: string;
  referenceId: string;
  restores?: InventoryStockLine[];
  deducts?: InventoryStockLine[];
  notes?: string;
  reason?: string;
  restoreTransactionType?: import("@prisma/client").InventoryTransactionType;
  deductTransactionType?: import("@prisma/client").InventoryTransactionType;
  relatedPreparationType?: import("@prisma/client").PreparationType | null;
  relatedPreparationId?: string | null;
};

function stockKey(sourceType: InventorySourceType, sourceId: string) {
  return `${sourceType}:${sourceId}`;
}

function groupLines(lines: InventoryStockLine[]) {
  const grouped = new Map<string, InventoryStockLine[]>();
  for (const line of lines) {
    const key = stockKey(line.sourceType, line.sourceId);
    const bucket = grouped.get(key) ?? [];
    bucket.push(line);
    grouped.set(key, bucket);
  }
  return grouped;
}

function isLotManagedSource(
  sourceType: InventorySourceType,
): sourceType is StockInSourceType {
  return (
    sourceType === "Chemical" || sourceType === "Standard" || sourceType === "MicrobialStrain"
  );
}

async function fetchStockRecord(
  tx: Prisma.TransactionClient,
  sourceType: InventorySourceType,
  sourceId: string,
): Promise<StockRecord | null> {
  if (sourceType === "Chemical") {
    const row = await tx.chemical.findUnique({ where: { id: sourceId } });
    if (!row) return null;
    return {
      sourceType,
      sourceId: row.id,
      sourceCode: row.code,
      sourceName: row.name,
      quantity: row.quantity,
      unit: row.unit,
    };
  }
  if (sourceType === "Standard") {
    const row = await tx.standard.findUnique({ where: { id: sourceId } });
    if (!row) return null;
    return {
      sourceType,
      sourceId: row.id,
      sourceCode: row.code,
      sourceName: row.name,
      quantity: row.quantity,
      unit: row.unit,
    };
  }
  if (sourceType === "MicrobialStrain") {
    const row = await tx.microbialStrain.findUnique({ where: { id: sourceId } });
    if (!row) return null;
    return {
      sourceType,
      sourceId: row.id,
      sourceCode: row.code,
      sourceName: row.name,
      quantity: row.quantity,
      unit: row.unit,
    };
  }
  const row = await tx.preparedStandard.findUnique({ where: { id: sourceId } });
  if (!row) return null;
  return {
    sourceType,
    sourceId: row.id,
    sourceCode: row.code,
    sourceName: row.name,
    quantity: row.quantity,
    unit: row.unit || row.solventUnit,
  };
}

async function hasStockLots(
  tx: Prisma.TransactionClient,
  sourceType: StockInSourceType,
  sourceId: string,
) {
  const count = await tx.stockLot.count({
    where:
      sourceType === "Chemical"
        ? { chemicalId: sourceId }
        : sourceType === "Standard"
          ? { standardId: sourceId }
          : { microbialStrainId: sourceId },
  });
  return count > 0;
}

async function persistStockQuantity(
  tx: Prisma.TransactionClient,
  record: StockRecord,
  quantity: number,
) {
  if (record.sourceType === "Chemical") {
    await tx.chemical.update({
      where: { id: record.sourceId },
      data: { quantity },
    });
    return;
  }
  if (record.sourceType === "Standard") {
    await tx.standard.update({
      where: { id: record.sourceId },
      data: { quantity },
    });
    return;
  }
  if (record.sourceType === "MicrobialStrain") {
    await tx.microbialStrain.update({
      where: { id: record.sourceId },
      data: { quantity },
    });
    return;
  }
  await tx.preparedStandard.update({
    where: { id: record.sourceId },
    data: { quantity },
  });
}

async function writeInventoryTransaction(
  tx: Prisma.TransactionClient,
  params: {
    user: string;
    module: string;
    record: StockRecord;
    quantityBefore: number;
    quantityUsed: number;
    quantityAfter: number;
    unit: string;
    actionType: InventoryActionType;
    referenceType: string;
    referenceId: string;
    stockLotId?: string | null;
    notes?: string;
    reason?: string;
    transactionType?: InventoryTransactionType;
    relatedPreparationType?: import("@prisma/client").PreparationType | null;
    relatedPreparationId?: string | null;
  },
) {
  await tx.inventoryTransaction.create({
    data: {
      user: params.user,
      module: params.module,
      sourceType: params.record.sourceType,
      sourceId: params.record.sourceId,
      sourceCode: params.record.sourceCode,
      stockLotId: params.stockLotId ?? null,
      quantityBefore: params.quantityBefore,
      quantityUsed: params.quantityUsed,
      quantityAfter: params.quantityAfter,
      unit: params.unit,
      actionType: params.actionType,
      transactionType:
        params.transactionType ?? actionTypeToTransactionType(params.actionType, params.module),
      reason: params.reason ?? "",
      relatedPreparationType: params.relatedPreparationType ?? null,
      relatedPreparationId: params.relatedPreparationId ?? null,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      notes: params.notes ?? "",
    },
  });
}

function ledgerWriteMeta(
  options: ApplyInventoryOptions,
  actionType: InventoryActionType,
): {
  reason?: string;
  transactionType?: InventoryTransactionType;
  relatedPreparationType?: import("@prisma/client").PreparationType | null;
  relatedPreparationId?: string | null;
} {
  return {
    reason: options.reason,
    transactionType:
      actionType === "Restore" ? options.restoreTransactionType : options.deductTransactionType,
    relatedPreparationType: options.relatedPreparationType ?? null,
    relatedPreparationId: options.relatedPreparationId ?? null,
  };
}

async function applyLotManagedChange(
  tx: Prisma.TransactionClient,
  options: ApplyInventoryOptions,
  record: StockRecord,
  restoreLines: InventoryStockLine[],
  deductLines: InventoryStockLine[],
): Promise<string | null> {
  const sourceType = record.sourceType as StockInSourceType;

  for (const line of restoreLines) {
    if (line.stockLotId) {
      const restored = await restoreToStockLotById(
        tx,
        line.stockLotId,
        line.quantityUsed,
        line.unit,
      );
      if ("error" in restored) return restored.error;
      await writeInventoryTransaction(tx, {
        user: options.user,
        module: options.module,
        record,
        quantityBefore: restored.quantityBefore,
        quantityUsed: restored.quantityUsed,
        quantityAfter: restored.quantityAfter,
        unit: restored.lotUnit,
        actionType: "Restore",
        referenceType: options.referenceType,
        referenceId: options.referenceId,
        stockLotId: restored.stockLotId,
        notes: options.notes,
        ...ledgerWriteMeta(options, "Restore"),
      });
      continue;
    }

    if (line.lotNumber?.trim()) {
      const restored = await restoreToStockLot(
        tx,
        sourceType,
        record.sourceId,
        line.quantityUsed,
        line.unit,
        line.lotNumber,
      );
      if ("error" in restored) return restored.error;
      await writeInventoryTransaction(tx, {
        user: options.user,
        module: options.module,
        record,
        quantityBefore: restored.quantityBefore,
        quantityUsed: restored.quantityUsed,
        quantityAfter: restored.quantityAfter,
        unit: restored.lotUnit,
        actionType: "Restore",
        referenceType: options.referenceType,
        referenceId: options.referenceId,
        stockLotId: restored.stockLotId,
        notes: options.notes,
        ...ledgerWriteMeta(options, "Restore"),
      });
      continue;
    }

    if (!allowFifoWithoutLotSelection()) {
      return FIFO_NOT_ALLOWED_MESSAGE;
    }

    const restored = await restoreToStockLot(
      tx,
      sourceType,
      record.sourceId,
      line.quantityUsed,
      line.unit,
    );
    if ("error" in restored) return restored.error;
    await writeInventoryTransaction(tx, {
      user: options.user,
      module: options.module,
      record,
      quantityBefore: restored.quantityBefore,
      quantityUsed: restored.quantityUsed,
      quantityAfter: restored.quantityAfter,
      unit: restored.lotUnit,
      actionType: "Restore",
      referenceType: options.referenceType,
      referenceId: options.referenceId,
      stockLotId: restored.stockLotId,
      notes: options.notes,
    });
  }

  const fifoDeductLines: InventoryStockLine[] = [];

  for (const line of deductLines) {
    if (line.stockLotId) {
      const deducted = await deductFromSpecificStockLot(
        tx,
        line.stockLotId,
        line.quantityUsed,
        line.unit,
      );
      if ("error" in deducted) return deducted.error;
      await writeInventoryTransaction(tx, {
        user: options.user,
        module: options.module,
        record,
        quantityBefore: deducted.quantityBefore,
        quantityUsed: deducted.quantityUsed,
        quantityAfter: deducted.quantityAfter,
        unit: deducted.unit,
        actionType: "Deduct",
        referenceType: options.referenceType,
        referenceId: options.referenceId,
        stockLotId: deducted.stockLotId,
        notes: options.notes,
        ...ledgerWriteMeta(options, "Deduct"),
      });
      continue;
    }
    fifoDeductLines.push(line);
  }

  if (fifoDeductLines.length) {
    if (!allowFifoWithoutLotSelection()) {
      return FIFO_NOT_ALLOWED_MESSAGE;
    }

    const deductSum = sumQuantitiesInUnit(fifoDeductLines, record.unit);
    if (typeof deductSum === "object") return deductSum.error;

    const deducted = await deductFromStockLotsFifo(
      tx,
      sourceType,
      record.sourceId,
      deductSum,
      record.unit,
    );
    if ("error" in deducted) return deducted.error;

    for (const allocation of deducted.allocations) {
      await writeInventoryTransaction(tx, {
        user: options.user,
        module: options.module,
        record,
        quantityBefore: allocation.quantityBefore,
        quantityUsed: allocation.quantityUsed,
        quantityAfter: allocation.quantityAfter,
        unit: allocation.unit,
        actionType: "Deduct",
        referenceType: options.referenceType,
        referenceId: options.referenceId,
        stockLotId: allocation.stockLotId,
        notes: options.notes,
        ...ledgerWriteMeta(options, "Deduct"),
      });
    }
  }

  return syncMasterQuantityFromLots(tx, sourceType, record.sourceId);
}

async function applyDirectChange(
  tx: Prisma.TransactionClient,
  options: ApplyInventoryOptions,
  record: StockRecord,
  restoreLines: InventoryStockLine[],
  deductLines: InventoryStockLine[],
): Promise<string | null> {
  if (!record.unit.trim()) {
    return `Vật tư "${record.sourceName}" chưa có đơn vị tồn kho.`;
  }

  const restoreSum = restoreLines.length ? sumQuantitiesInUnit(restoreLines, record.unit) : 0;
  if (typeof restoreSum === "object") return restoreSum.error;

  const deductSum = deductLines.length ? sumQuantitiesInUnit(deductLines, record.unit) : 0;
  if (typeof deductSum === "object") return deductSum.error;

  const before = roundStockQuantity(record.quantity);
  const after = roundStockQuantity(before + restoreSum - deductSum);

  if (after < -1e-9) {
    return STOCK_SHORTAGE_MESSAGE;
  }

  await persistStockQuantity(tx, record, after);

  if (restoreSum > 0) {
    await writeInventoryTransaction(tx, {
      user: options.user,
      module: options.module,
      record,
      quantityBefore: before,
      quantityUsed: restoreSum,
      quantityAfter: roundStockQuantity(before + restoreSum),
      unit: record.unit,
      actionType: "Restore",
      referenceType: options.referenceType,
      referenceId: options.referenceId,
      notes: options.notes,
      ...ledgerWriteMeta(options, "Restore"),
    });
  }

  if (deductSum > 0) {
    const afterRestore = roundStockQuantity(before + restoreSum);
    await writeInventoryTransaction(tx, {
      user: options.user,
      module: options.module,
      record,
      quantityBefore: afterRestore,
      quantityUsed: deductSum,
      quantityAfter: after,
      unit: record.unit,
      actionType: "Deduct",
      referenceType: options.referenceType,
      referenceId: options.referenceId,
      notes: options.notes,
      ...ledgerWriteMeta(options, "Deduct"),
    });
  }

  return null;
}

export async function applyInventoryStockChange(
  tx: Prisma.TransactionClient,
  options: ApplyInventoryOptions,
): Promise<string | null> {
  const restores = options.restores ?? [];
  const deducts = options.deducts ?? [];
  const restoreGroups = groupLines(restores);
  const deductGroups = groupLines(deducts);
  const allKeys = new Set([...restoreGroups.keys(), ...deductGroups.keys()]);

  for (const key of allKeys) {
    const restoreLines = restoreGroups.get(key) ?? [];
    const deductLines = deductGroups.get(key) ?? [];
    const sample = restoreLines[0] ?? deductLines[0];
    if (!sample) continue;

    const record = await fetchStockRecord(tx, sample.sourceType, sample.sourceId);
    if (!record) {
      if (sample.sourceType === "Chemical") return "Không tìm thấy hóa chất gốc";
      if (sample.sourceType === "Standard") return "Không tìm thấy chất chuẩn gốc";
      if (sample.sourceType === "MicrobialStrain") return "Không tìm thấy chủng gốc vi sinh";
      return "Không tìm thấy chuẩn pha chế nguồn";
    }

    if (isLotManagedSource(record.sourceType) && (await hasStockLots(tx, record.sourceType, record.sourceId))) {
      const error = await applyLotManagedChange(tx, options, record, restoreLines, deductLines);
      if (error) return error;
      continue;
    }

    const error = await applyDirectChange(tx, options, record, restoreLines, deductLines);
    if (error) return error;
  }

  return null;
}

export function chemicalStockLine(
  chemicalId: string,
  quantityUsed: number,
  unit: string,
  opts?: InventoryStockLineOpts,
): InventoryStockLine {
  return {
    sourceType: "Chemical",
    sourceId: chemicalId,
    quantityUsed,
    unit,
    stockLotId: opts?.stockLotId ?? null,
    lotNumber: opts?.lotNumber ?? null,
  };
}

export function standardStockLine(
  standardId: string,
  quantityUsed: number,
  unit: string,
  opts?: InventoryStockLineOpts,
): InventoryStockLine {
  return {
    sourceType: "Standard",
    sourceId: standardId,
    quantityUsed,
    unit,
    stockLotId: opts?.stockLotId ?? null,
    lotNumber: opts?.lotNumber ?? null,
  };
}

export function microbialStrainStockLine(
  strainId: string,
  quantityUsed: number,
  unit: string,
  opts?: InventoryStockLineOpts,
): InventoryStockLine {
  return {
    sourceType: "MicrobialStrain",
    sourceId: strainId,
    quantityUsed,
    unit,
    stockLotId: opts?.stockLotId ?? null,
    lotNumber: opts?.lotNumber ?? null,
  };
}

export function preparedStandardStockLine(
  preparedStandardId: string,
  quantityUsed: number,
  unit: string,
): InventoryStockLine {
  return {
    sourceType: "PreparedStandard",
    sourceId: preparedStandardId,
    quantityUsed,
    unit,
  };
}

export function preparedStandardComponentToStockLines(
  components: {
    sourceType: string;
    standardId: string | null;
    sourcePreparedStandardId: string | null;
    quantityUsed: number;
    unit: string;
    stockLotId?: string | null;
    lotNumberSnapshot?: string;
  }[],
): InventoryStockLine[] {
  return components.flatMap((component) => {
    if (component.sourceType === "Standard" && component.standardId) {
      return [
        standardStockLine(component.standardId, component.quantityUsed, component.unit, {
          stockLotId: component.stockLotId,
          lotNumber: component.lotNumberSnapshot,
        }),
      ];
    }
    if (component.sourceType === "PreparedStandard" && component.sourcePreparedStandardId) {
      return [
        preparedStandardStockLine(
          component.sourcePreparedStandardId,
          component.quantityUsed,
          component.unit,
        ),
      ];
    }
    return [];
  });
}

export function preparedStandardSolventToStockLines(
  solvents: {
    chemicalId: string;
    quantityUsed: number;
    unit: string;
    stockLotId?: string | null;
    lotNumberSnapshot?: string;
  }[],
): InventoryStockLine[] {
  return solvents.map((solvent) =>
    chemicalStockLine(solvent.chemicalId, solvent.quantityUsed, solvent.unit, {
      stockLotId: solvent.stockLotId,
      lotNumber: solvent.lotNumberSnapshot,
    }),
  );
}

export function formatStockLine(name: string, needed: number, available: number, unit: string): string {
  const unitSuffix = unit.trim() ? ` ${unit.trim()}` : "";
  return `- ${name}: cần ${formatStockQty(needed)}${unitSuffix}, còn ${formatStockQty(available)}${unitSuffix}`;
}

export { convertQuantity };

export { getAvailableQuantity, getInventorySummary } from "@/lib/services/inventory-transaction-engine";
