import { db } from "@/lib/db";
import {
  mapCalibrationPlan,
  mapMaintenancePlan,
  mapSparePart,
} from "@/lib/mappers/equipment";
import type {
  CalibrationPlanView,
  EquipmentDashboardStats,
  MaintenancePlanView,
  SparePartView,
} from "@/types";

const equipmentInclude = { equipment: { select: { id: true, code: true, name: true } } };
const linkInclude = {
  equipmentLinks: {
    include: { equipment: { select: { id: true, code: true, name: true } } },
  },
};

export async function getEquipmentDashboardStats(): Promise<EquipmentDashboardStats> {
  const [
    totalCount,
    inUseCount,
    maintenanceCount,
    brokenCount,
    disposedCount,
    overdueCalibrationCount,
    upcomingCalibrationCount,
    overdueMaintenanceCount,
    upcomingMaintenanceCount,
    spareParts,
  ] = await Promise.all([
    db.equipment.count(),
    db.equipment.count({ where: { status: "InUse" } }),
    db.equipment.count({ where: { status: "Maintenance" } }),
    db.equipment.count({ where: { status: "Broken" } }),
    db.equipment.count({ where: { status: "Disposed" } }),
    db.calibrationPlan.count({ where: { status: "Red" } }),
    db.calibrationPlan.count({ where: { status: "Yellow" } }),
    db.maintenancePlan.count({ where: { status: "Red" } }),
    db.maintenancePlan.count({ where: { status: "Yellow" } }),
    db.sparePart.findMany({ select: { stockQty: true, minQty: true } }),
  ]);

  const lowSparePartCount = spareParts.filter((p) => p.stockQty <= p.minQty).length;

  return {
    totalCount,
    inUseCount,
    maintenanceCount,
    brokenCount,
    disposedCount,
    overdueCalibrationCount,
    upcomingCalibrationCount,
    overdueMaintenanceCount,
    upcomingMaintenanceCount,
    lowSparePartCount,
  };
}

export type EquipmentDashboardData = {
  stats: EquipmentDashboardStats;
  overdueCalibrations: CalibrationPlanView[];
  upcomingCalibrations: CalibrationPlanView[];
  overdueMaintenances: MaintenancePlanView[];
  upcomingMaintenances: MaintenancePlanView[];
  lowSpareParts: SparePartView[];
};

export async function getEquipmentDashboardData(): Promise<EquipmentDashboardData> {
  const [stats, overdueCalibrations, upcomingCalibrations, overdueMaintenances, upcomingMaintenances, spareParts] =
    await Promise.all([
      getEquipmentDashboardStats(),
      db.calibrationPlan.findMany({
        where: { status: "Red" },
        orderBy: [{ nextDate: "asc" }],
        take: 10,
        include: equipmentInclude,
      }),
      db.calibrationPlan.findMany({
        where: { status: "Yellow" },
        orderBy: [{ nextDate: "asc" }],
        take: 10,
        include: equipmentInclude,
      }),
      db.maintenancePlan.findMany({
        where: { status: "Red" },
        orderBy: [{ nextDate: "asc" }],
        take: 10,
        include: equipmentInclude,
      }),
      db.maintenancePlan.findMany({
        where: { status: "Yellow" },
        orderBy: [{ nextDate: "asc" }],
        take: 10,
        include: equipmentInclude,
      }),
      db.sparePart.findMany({
        orderBy: { code: "asc" },
        include: linkInclude,
      }),
    ]);

  const lowSpareParts = spareParts
    .filter((p) => p.stockQty <= p.minQty)
    .slice(0, 10)
    .map(mapSparePart);

  return {
    stats,
    overdueCalibrations: overdueCalibrations.map(mapCalibrationPlan),
    upcomingCalibrations: upcomingCalibrations.map(mapCalibrationPlan),
    overdueMaintenances: overdueMaintenances.map(mapMaintenancePlan),
    upcomingMaintenances: upcomingMaintenances.map(mapMaintenancePlan),
    lowSpareParts,
  };
}
