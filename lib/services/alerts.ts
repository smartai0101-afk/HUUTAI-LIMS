import { StandardExpiryStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { toDateString } from "@/lib/mappers";
import type { AlertItem } from "@/types";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function getAlerts(): Promise<AlertItem[]> {
  const now = new Date();
  const soon = new Date(now.getTime() + THIRTY_DAYS_MS);
  const alerts: AlertItem[] = [];

  const [lots, chemicals, standards, strains] = await Promise.all([
    db.stockLot.findMany({
      where: { quantity: { gt: 0 } },
      include: {
        chemical: { select: { code: true, name: true } },
        standard: { select: { code: true, name: true } },
        microbialStrain: { select: { code: true, name: true } },
      },
      orderBy: { expiryDate: "asc" },
    }),
    db.chemical.findMany({ select: { code: true, name: true, quantity: true, unit: true, reorderLevel: true } }),
    db.standard.findMany({ select: { code: true, name: true, quantity: true, unit: true } }),
    db.microbialStrain.findMany({ select: { code: true, name: true, quantity: true, unit: true } }),
  ]);

  for (const lot of lots) {
    const master = lot.chemical ?? lot.standard ?? lot.microbialStrain;
    if (!master) continue;

    const itemRoute = lot.chemicalId ? "/chemicals" : lot.standardId ? "/standards" : "/containers";
    const expiry = lot.expiryDate;

    if (lot.status === StandardExpiryStatus.Expired || (expiry && expiry < now)) {
      alerts.push({
        id: `exp-${lot.id}`,
        title: "Hết hạn",
        description: `${master.name} (lot ${lot.lot}) đã hết hạn`,
        severity: "Critical",
        type: "Expiry",
        date: expiry ? toDateString(expiry) : toDateString(now),
        itemCode: master.code,
        itemRoute,
      });
    } else if (expiry && expiry >= now && expiry <= soon) {
      alerts.push({
        id: `soon-${lot.id}`,
        title: "Hết hạn trong 30 ngày",
        description: `${master.name} lot ${lot.lot} — ${toDateString(expiry)}`,
        severity: "Warning",
        type: "Expiry",
        date: toDateString(expiry),
        itemCode: master.code,
        itemRoute,
      });
    }
  }

  for (const master of [...chemicals, ...standards, ...strains]) {
    const threshold =
      "reorderLevel" in master && typeof master.reorderLevel === "number" ? master.reorderLevel : 5;
    if (master.quantity > threshold) continue;
    alerts.push({
      id: `low-${master.code}`,
      title: "Tồn kho thấp",
      description: `${master.name} còn ${master.quantity} ${master.unit}`,
      severity: "Warning",
      type: "Low Stock",
      date: toDateString(now),
      itemCode: master.code,
      itemRoute: "/containers",
    });
  }

  const [calPlans, maintPlans] = await Promise.all([
    db.calibrationPlan.findMany({
      where: { status: { in: ["Red", "Yellow"] } },
      include: { equipment: { select: { code: true, name: true } } },
      take: 10,
    }),
    db.maintenancePlan.findMany({
      where: { status: { in: ["Red", "Yellow"] } },
      include: { equipment: { select: { code: true, name: true } } },
      take: 10,
    }),
  ]);

  for (const plan of calPlans) {
    alerts.push({
      id: `cal-${plan.id}`,
      title: plan.status === "Red" ? "HC quá hạn" : "HC sắp đến hạn",
      description: `${plan.equipment.code} — ${plan.name}`,
      severity: plan.status === "Red" ? "Critical" : "Warning",
      type: "Calibration",
      date: plan.nextDate ? toDateString(plan.nextDate) : toDateString(now),
      itemCode: plan.equipment.code,
      itemRoute: "/equipment/calibration-plans",
    });
  }

  for (const plan of maintPlans) {
    alerts.push({
      id: `maint-${plan.id}`,
      title: plan.status === "Red" ? "BT quá hạn" : "BT sắp đến hạn",
      description: `${plan.equipment.code} — ${plan.name}`,
      severity: plan.status === "Red" ? "Critical" : "Warning",
      type: "Maintenance",
      date: plan.nextDate ? toDateString(plan.nextDate) : toDateString(now),
      itemCode: plan.equipment.code,
      itemRoute: "/equipment/maintenance-plans",
    });
  }

  return alerts.sort((a, b) => b.date.localeCompare(a.date));
}
