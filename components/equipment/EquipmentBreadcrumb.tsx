"use client";

import { usePathname } from "next/navigation";
import { EQUIPMENT_NAV } from "@/lib/equipment-labels";

const titles: Record<string, string> = {
  "/equipment": EQUIPMENT_NAV.dashboard,
  "/equipment/catalog": EQUIPMENT_NAV.catalog,
  "/equipment/history": EQUIPMENT_NAV.history,
  "/equipment/calibration-plans": EQUIPMENT_NAV.calibrationPlans,
  "/equipment/calibration-records": EQUIPMENT_NAV.calibrationRecords,
  "/equipment/maintenance-plans": EQUIPMENT_NAV.maintenancePlans,
  "/equipment/maintenance-logs": EQUIPMENT_NAV.maintenanceLogs,
  "/equipment/spare-parts": EQUIPMENT_NAV.spareParts,
  "/equipment/disposal": EQUIPMENT_NAV.disposal,
};

function resolveTitle(pathname: string) {
  const match = Object.entries(titles)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return match?.[1] ?? "Thiết bị";
}

export function EquipmentBreadcrumb() {
  const pathname = usePathname();
  const title = resolveTitle(pathname);
  return (
    <p className="px-1 pt-2 text-sm text-slate-500 lg:px-0">
      Thiết bị / <span className="font-medium text-slate-700">{title}</span>
    </p>
  );
}
