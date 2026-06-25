import { ContainerStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { DashboardStats } from "@/types";

import { getModuleCounts } from "@/lib/services/modules";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const soon = new Date(now.getTime() + THIRTY_DAYS_MS);

  const [chemicalCount, standardCount, containerCount, moduleCounts, expiringSoon, lowStock, pendingDisposal] =
    await Promise.all([
      db.chemical.count(),
      db.standard.count(),
      db.container.count(),
      getModuleCounts(),
      db.container.count({
        where: {
          expiryDate: { gte: now, lte: soon },
          status: { not: ContainerStatus.Expired },
        },
      }),
      db.container.count({ where: { status: ContainerStatus.LowStock } }),
      db.container.count({ where: { status: ContainerStatus.PendingDisposal } }),
    ]);

  return {
    chemicalCount,
    standardCount,
    containerCount,
    ...moduleCounts,
    expiringSoon,
    lowStock,
    pendingDisposal,
  };
}

export async function getCriticalContainers(limit = 8) {
  const containers = await db.container.findMany({
    where: {
      OR: [
        { status: ContainerStatus.Expired },
        { status: ContainerStatus.LowStock },
        { status: ContainerStatus.PendingDisposal },
      ],
    },
    include: {
      chemical: true,
      standard: true,
    },
    orderBy: { expiryDate: "asc" },
    take: limit,
  });

  return containers;
}

import { getUsageLogs } from "@/lib/services/usage-logs";

export async function getRecentUsageLogs(limit = 5) {
  const logs = await getUsageLogs();
  return logs.slice(0, limit);
}

export async function getInventoryMix() {
  const [chemicalContainers, standardContainers] = await Promise.all([
    db.container.count({ where: { chemicalId: { not: null } } }),
    db.container.count({ where: { standardId: { not: null } } }),
  ]);

  const total = chemicalContainers + standardContainers || 1;

  return [
    { label: "Hoá chất", value: Math.round((chemicalContainers / total) * 100), color: "bg-cyan-500" },
    { label: "Chất chuẩn", value: Math.round((standardContainers / total) * 100), color: "bg-emerald-500" },
  ];
}
