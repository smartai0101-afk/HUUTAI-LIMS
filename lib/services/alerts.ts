import { ContainerStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { toDateString } from "@/lib/mappers";
import type { AlertItem } from "@/types";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function getAlerts(): Promise<AlertItem[]> {
  const now = new Date();
  const soon = new Date(now.getTime() + THIRTY_DAYS_MS);
  const alerts: AlertItem[] = [];

  const containers = await db.container.findMany({
    include: { chemical: true, standard: true },
    orderBy: { expiryDate: "asc" },
  });

  for (const container of containers) {
    const item = container.chemical ?? container.standard;
    if (!item) continue;

    const itemCode = item.code;
    const itemRoute = container.chemicalId ? "/containers" : "/containers";
    const expiry = container.expiryDate;

    if (container.status === ContainerStatus.Expired) {
      alerts.push({
        id: `exp-${container.id}`,
        title: "Hết hạn",
        description: `${item.name} (lot ${container.lot}) đã hết hạn`,
        severity: "Critical",
        type: "Expiry",
        date: toDateString(expiry),
        itemCode: container.code,
        itemRoute,
      });
    } else if (expiry >= now && expiry <= soon) {
      alerts.push({
        id: `soon-${container.id}`,
        title: "Hết hạn trong 30 ngày",
        description: `${item.name} sẽ hết hạn vào ${toDateString(expiry)}`,
        severity: "Critical",
        type: "Expiry",
        date: toDateString(expiry),
        itemCode: container.code,
        itemRoute,
      });
    }

    if (container.status === ContainerStatus.LowStock) {
      alerts.push({
        id: `low-${container.id}`,
        title: "Tồn kho thấp",
        description: `${item.name} còn ${container.quantity} ${container.unit}`,
        severity: "Warning",
        type: "Low Stock",
        date: toDateString(expiry),
        itemCode: container.code,
        itemRoute,
      });
    }

    if (container.status === ContainerStatus.PendingDisposal) {
      alerts.push({
        id: `disp-${container.id}`,
        title: "Chờ huỷ",
        description: `${item.name} (lot ${container.lot}) đang chờ xử lý huỷ`,
        severity: "Info",
        type: "Pending Disposal",
        date: toDateString(expiry),
        itemCode: container.code,
        itemRoute,
      });
    }
  }

  return alerts.sort((a, b) => b.date.localeCompare(a.date));
}
