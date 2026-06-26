import { EQUIPMENT_NAV } from "@/lib/equipment-labels";

export const NAV_PERMISSION_GROUPS = [
  {
    id: "materials" as const,
    label: "Hoá chất - Chuẩn - Chủng",
    items: [
      { key: "dashboard" as const, label: "Dashboard", href: "/" },
      { key: "stock_in" as const, label: "Nhập kho", href: "/stock-in" },
      { key: "chemicals" as const, label: "Hoá chất gốc", href: "/chemicals" },
      { key: "standards" as const, label: "Chất chuẩn gốc", href: "/standards" },
      { key: "microbial_strains" as const, label: "Chủng gốc vi sinh", href: "/microbial-strains" },
      { key: "prepared_chemicals" as const, label: "Hoá chất pha chế", href: "/prepared-chemicals" },
      { key: "prepared_standards" as const, label: "Chuẩn pha chế", href: "/prepared-standards" },
      { key: "prepared_strains" as const, label: "Chủng pha chế", href: "/prepared-strains" },
      { key: "containers" as const, label: "Thống kê", href: "/containers" },
      { key: "usage_logs" as const, label: "Nhật ký sử dụng", href: "/usage-logs" },
      { key: "inventory_ledger" as const, label: "Sổ cái tồn", href: "/inventory-ledger" },
      { key: "reports" as const, label: "Báo cáo", href: "/reports" },
    ],
  },
  {
    id: "equipment" as const,
    label: "Thiết bị",
    items: [
      { key: "equipment_dashboard" as const, label: EQUIPMENT_NAV.dashboard, href: "/equipment" },
      { key: "equipment_catalog" as const, label: EQUIPMENT_NAV.catalog, href: "/equipment/catalog" },
      { key: "equipment_history" as const, label: EQUIPMENT_NAV.history, href: "/equipment/history" },
      {
        key: "equipment_calibration_plans" as const,
        label: EQUIPMENT_NAV.calibrationPlans,
        href: "/equipment/calibration-plans",
      },
      {
        key: "equipment_calibration_records" as const,
        label: EQUIPMENT_NAV.calibrationRecords,
        href: "/equipment/calibration-records",
      },
      {
        key: "equipment_maintenance_plans" as const,
        label: EQUIPMENT_NAV.maintenancePlans,
        href: "/equipment/maintenance-plans",
      },
      {
        key: "equipment_maintenance_logs" as const,
        label: EQUIPMENT_NAV.maintenanceLogs,
        href: "/equipment/maintenance-logs",
      },
      {
        key: "equipment_spare_parts" as const,
        label: EQUIPMENT_NAV.spareParts,
        href: "/equipment/spare-parts",
      },
      { key: "equipment_disposal" as const, label: EQUIPMENT_NAV.disposal, href: "/equipment/disposal" },
    ],
  },
  {
    id: "admin" as const,
    label: "Quản trị",
    items: [
      { key: "admin_people" as const, label: "Nhân sự", href: "/admin/people" },
      { key: "admin_permissions" as const, label: "Phân quyền", href: "/admin/permissions" },
      { key: "admin_tasks" as const, label: "Giao việc", href: "/admin/tasks" },
    ],
  },
] as const;

export type NavPermissionItem = (typeof NAV_PERMISSION_GROUPS)[number]["items"][number];

export type NavPermissionGroup = (typeof NAV_PERMISSION_GROUPS)[number];

export type PermissionKey = NavPermissionItem["key"];

export const PERMISSION_KEYS: PermissionKey[] = NAV_PERMISSION_GROUPS.flatMap((g) =>
  g.items.map((item) => item.key),
);

export const PERMISSION_LABELS = Object.fromEntries(
  NAV_PERMISSION_GROUPS.flatMap((g) => g.items.map((item) => [item.key, item.label])),
) as Record<PermissionKey, string>;

type RouteEntry = { key: PermissionKey; href: string };

const ROUTE_ENTRIES: RouteEntry[] = NAV_PERMISSION_GROUPS.flatMap((g) =>
  g.items.map(({ key, href }) => ({ key, href })),
).sort((a, b) => b.href.length - a.href.length);

/** Map URL pathname to required permission key (longest href match). */
export function routePermission(pathname: string): PermissionKey | null {
  if (pathname === "/login" || pathname === "/access-denied") return null;
  if (pathname === "/account" || pathname.startsWith("/account/")) return null;
  if (pathname === "/notifications" || pathname.startsWith("/notifications/")) return null;
  if (pathname.startsWith("/api/notifications")) return null;
  if (pathname === "/admin/users" || pathname === "/admin/staff") return "admin_people";

  for (const item of ROUTE_ENTRIES) {
    if (item.href === "/") {
      if (pathname === "/") return item.key;
      continue;
    }
    if (item.href === "/equipment") {
      if (pathname === "/equipment") return item.key;
      continue;
    }
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.key;
    }
  }

  return "dashboard";
}

export function permissionGroupsForAdmin() {
  return NAV_PERMISSION_GROUPS;
}

export function getMaterialsNavItems() {
  return NAV_PERMISSION_GROUPS.find((g) => g.id === "materials")!.items;
}

export function getEquipmentNavItems() {
  return NAV_PERMISSION_GROUPS.find((g) => g.id === "equipment")!.items;
}

export function getAdminNavItems() {
  return NAV_PERMISSION_GROUPS.find((g) => g.id === "admin")!.items;
}

/** Admin routes require write; all others require read for middleware. */
export function isAdminPermissionKey(key: PermissionKey): boolean {
  return key.startsWith("admin_");
}
