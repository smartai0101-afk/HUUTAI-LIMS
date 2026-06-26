import { db } from "@/lib/db";
import { mapAuditLog, toDateString } from "@/lib/mappers";
import { getDashboardStats } from "@/lib/services/dashboard";

export async function getAuditLogs(limit = 50) {
  const logs = await db.auditLog.findMany({
    orderBy: { time: "desc" },
    take: limit,
  });

  return logs.map(mapAuditLog);
}

export async function getReportsStats() {
  const [dashboard, usageLogCount, stockInCount, txnCount] = await Promise.all([
    getDashboardStats(),
    db.usageLog.count(),
    db.stockInLog.count(),
    db.inventoryTransaction.count(),
  ]);

  return {
    ...dashboard,
    usageLogCount,
    stockInCount,
    inventoryTransactionCount: txnCount,
    disposeCount: dashboard.pendingDisposal,
  };
}

export async function getStockLotExportRows() {
  const lots = await db.stockLot.findMany({
    include: {
      chemical: { select: { code: true, name: true } },
      standard: { select: { code: true, name: true } },
      microbialStrain: { select: { code: true, name: true } },
    },
    orderBy: [{ chemicalId: "asc" }, { standardId: "asc" }, { lot: "asc" }],
  });

  return lots.map((lot) => {
    const master = lot.chemical ?? lot.standard ?? lot.microbialStrain!;
    const sourceType = lot.chemicalId ? "Chemical" : lot.standardId ? "Standard" : "MicrobialStrain";
    return {
      sourceType,
      itemCode: master.code,
      itemName: master.name,
      lot: lot.lot,
      quantity: lot.quantity,
      unit: lot.unit,
      expiryDate: lot.expiryDate ? toDateString(lot.expiryDate) : "",
      storageLocation: lot.storageLocation,
      status: lot.status,
    };
  });
}

export async function getUsageExportRows() {
  const logs = await db.usageLog.findMany({
    orderBy: { date: "desc" },
  });

  return logs.map((log) => ({
    date: toDateString(log.date),
    type: log.type,
    sourceType: log.sourceType,
    sourceId: log.sourceId,
    quantity: log.quantity,
    unit: log.unit,
    performedBy: log.performedBy,
    purpose: log.purpose,
    referenceCode: log.referenceCode,
  }));
}

export async function getStockInExportRows() {
  const logs = await db.stockInLog.findMany({
    include: { stockLot: true },
    orderBy: { time: "desc" },
  });

  return logs.map((log) => ({
    time: log.time.toISOString(),
    user: log.user,
    sourceType: log.sourceType,
    sourceCode: log.sourceCode,
    sourceName: log.sourceName,
    lot: log.lot,
    quantityBefore: log.quantityBefore,
    quantityIn: log.quantityIn,
    quantityAfter: log.quantityAfter,
    unit: log.unit,
    notes: log.notes,
  }));
}

export async function getInventoryTransactionExportRows(limit = 500) {
  const rows = await db.inventoryTransaction.findMany({
    orderBy: { time: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    time: row.time.toISOString(),
    user: row.user,
    module: row.module,
    sourceType: row.sourceType,
    sourceCode: row.sourceCode,
    stockLotId: row.stockLotId ?? "",
    quantityBefore: row.quantityBefore,
    quantityUsed: row.quantityUsed,
    quantityAfter: row.quantityAfter,
    unit: row.unit,
    actionType: row.actionType,
    referenceType: row.referenceType,
    referenceId: row.referenceId,
    notes: row.notes,
  }));
}
