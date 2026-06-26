import { StandardExpiryStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { toDateString } from "@/lib/mappers";
import { getModuleCounts } from "@/lib/services/modules";
import type { DashboardStats } from "@/types";

import { getUsageLogs } from "@/lib/services/usage-logs";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function countLowStock(
  rows: Array<{ quantity: number; reorderLevel?: number }>,
  defaultLevel = 5,
): number {
  return rows.filter((r) => r.quantity <= (r.reorderLevel ?? defaultLevel)).length;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const soon = new Date(now.getTime() + THIRTY_DAYS_MS);

  const [
    chemicalCount,
    standardCount,
    microbialStrainCount,
    moduleCounts,
    stockLotCount,
    expiringSoon,
    chemicals,
    standards,
    strains,
    expiredLots,
    recentDisposals,
  ] = await Promise.all([
    db.chemical.count(),
    db.standard.count(),
    db.microbialStrain.count(),
    getModuleCounts(),
    db.stockLot.count({ where: { quantity: { gt: 0 } } }),
    db.stockLot.count({
      where: {
        expiryDate: { gte: now, lte: soon },
        status: { not: StandardExpiryStatus.Expired },
        quantity: { gt: 0 },
      },
    }),
    db.chemical.findMany({ select: { quantity: true, reorderLevel: true } }),
    db.standard.findMany({ select: { quantity: true } }),
    db.microbialStrain.findMany({ select: { quantity: true } }),
    db.stockLot.count({
      where: {
        OR: [{ status: StandardExpiryStatus.Expired }, { expiryDate: { lt: now } }],
        quantity: { gt: 0 },
      },
    }),
    db.usageLog.count({
      where: { type: "DISPOSE", date: { gte: new Date(now.getTime() - THIRTY_DAYS_MS) } },
    }),
  ]);

  const lowStock =
    countLowStock(chemicals) + countLowStock(standards) + countLowStock(strains);

  return {
    chemicalCount,
    standardCount,
    containerCount: stockLotCount,
    ...moduleCounts,
    expiringSoon,
    lowStock,
    pendingDisposal: expiredLots + recentDisposals,
  };
}

export async function getCriticalStockRows(limit = 8) {
  const now = new Date();
  const soon = new Date(now.getTime() + THIRTY_DAYS_MS);

  const lots = await db.stockLot.findMany({
    where: {
      quantity: { gt: 0 },
      OR: [
        { status: StandardExpiryStatus.Expired },
        { expiryDate: { lt: now } },
        { expiryDate: { gte: now, lte: soon } },
      ],
    },
    include: {
      chemical: { select: { code: true, name: true } },
      standard: { select: { code: true, name: true } },
      microbialStrain: { select: { code: true, name: true } },
    },
    orderBy: { expiryDate: "asc" },
    take: limit,
  });

  return lots.map((lot) => {
    const master = lot.chemical ?? lot.standard ?? lot.microbialStrain!;
    const expired = lot.expiryDate ? lot.expiryDate < now : false;
    const expiringSoon = lot.expiryDate ? lot.expiryDate >= now && lot.expiryDate <= soon : false;
    return {
      code: master.code,
      name: master.name,
      quantity: `${lot.quantity} ${lot.unit}`.trim(),
      expiryDate: lot.expiryDate ? toDateString(lot.expiryDate) : "-",
      status: expired ? "Expired" : expiringSoon ? "Low Stock" : String(lot.status),
    };
  });
}

export async function getRecentUsageLogs(limit = 5) {
  const logs = await getUsageLogs();
  return logs.slice(0, limit);
}

export async function getInventoryMix() {
  const [chemicalQty, standardQty, strainQty] = await Promise.all([
    db.chemical.aggregate({ _sum: { quantity: true } }),
    db.standard.aggregate({ _sum: { quantity: true } }),
    db.microbialStrain.aggregate({ _sum: { quantity: true } }),
  ]);

  const values = [
    chemicalQty._sum.quantity ?? 0,
    standardQty._sum.quantity ?? 0,
    strainQty._sum.quantity ?? 0,
  ];
  const total = values.reduce((a, b) => a + b, 0) || 1;

  return [
    { label: "Hoá chất", value: Math.round((values[0]! / total) * 100), color: "bg-cyan-500" },
    { label: "Chuẩn", value: Math.round((values[1]! / total) * 100), color: "bg-emerald-500" },
    { label: "Chủng VS", value: Math.round((values[2]! / total) * 100), color: "bg-violet-500" },
  ];
}
