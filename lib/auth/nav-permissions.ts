import { ANALYSIS_NAV } from "@/lib/analysis-labels";
import { RESULTS_DELIVERY_NAV } from "@/lib/result-delivery-nav";
import { EQUIPMENT_NAV } from "@/lib/equipment-labels";
import { CHEM_INFO_NAV } from "@/lib/chem-info-labels";
import { METHODS_NAV } from "@/lib/analytical-methods-labels";
import { SAMPLES_NAV } from "@/lib/sample-labels";

export const NAV_PERMISSION_GROUPS = [
  {
    id: "samples" as const,
    label: SAMPLES_NAV.group,
    items: [
      { key: "samples_requests" as const, label: SAMPLES_NAV.requests, href: "/samples/requests" },
      {
        key: "samples_requests_new" as const,
        label: SAMPLES_NAV.requestsNew,
        href: "/samples/requests/new",
      },
      {
        key: "samples_request_review" as const,
        label: SAMPLES_NAV.requestReview,
        href: "/samples/requests/review",
      },
      { key: "samples_list" as const, label: SAMPLES_NAV.list, href: "/samples" },
      {
        key: "samples_request_matrix" as const,
        label: SAMPLES_NAV.requestMatrix,
        href: "/samples/requests/matrix",
      },
      { key: "samples_receive" as const, label: SAMPLES_NAV.receive, href: "/samples/receive" },
      { key: "samples_assign" as const, label: SAMPLES_NAV.assign, href: "/samples/assign" },
      { key: "samples_tracking" as const, label: SAMPLES_NAV.tracking, href: "/samples/tracking" },
      { key: "samples_storage" as const, label: SAMPLES_NAV.storage, href: "/samples/storage" },
      {
        key: "samples_reception_log" as const,
        label: SAMPLES_NAV.receptionLog,
        href: "/samples/reception-log",
      },
    ],
  },
  {
    id: "analysis" as const,
    label: ANALYSIS_NAV.group,
    items: [
      { key: "analysis_inbox" as const, label: ANALYSIS_NAV.inbox, href: "/analysis/inbox" },
      {
        key: "analysis_assign_analyst" as const,
        label: ANALYSIS_NAV.assignAnalyst,
        href: "/analysis/assign-analyst",
      },
      { key: "analysis_worklist" as const, label: ANALYSIS_NAV.worklist, href: "/analysis/worklists" },
      {
        key: "analysis_worksheet" as const,
        label: ANALYSIS_NAV.worksheet,
        href: "/analysis/worksheets",
      },
      {
        key: "analysis_sample_prep" as const,
        label: ANALYSIS_NAV.samplePrep,
        href: "/analysis/sample-prep",
      },
      { key: "analysis_results" as const, label: ANALYSIS_NAV.results, href: "/analysis/results" },
      {
        key: "analysis_results_by_sample" as const,
        label: ANALYSIS_NAV.resultsBySample,
        href: "/analysis/results/by-sample",
      },
      { key: "analysis_qc" as const, label: ANALYSIS_NAV.qc, href: "/analysis/qc" },
      {
        key: "analysis_deviation" as const,
        label: ANALYSIS_NAV.deviation,
        href: "/analysis/deviations",
      },
      { key: "analysis_review" as const, label: ANALYSIS_NAV.review, href: "/analysis/review" },
    ],
  },
  {
    id: "results_delivery" as const,
    label: RESULTS_DELIVERY_NAV.group,
    items: [
      {
        key: "delivery_pending" as const,
        label: RESULTS_DELIVERY_NAV.pending,
        href: "/results-delivery/pending",
      },
      {
        key: "delivery_review" as const,
        label: RESULTS_DELIVERY_NAV.review,
        href: "/results-delivery/review",
      },
      {
        key: "delivery_reports" as const,
        label: RESULTS_DELIVERY_NAV.reports,
        href: "/results-delivery/reports",
      },
      {
        key: "delivery_partial" as const,
        label: RESULTS_DELIVERY_NAV.partial,
        href: "/results-delivery/reports?partial=1",
      },
      {
        key: "delivery_history" as const,
        label: RESULTS_DELIVERY_NAV.history,
        href: "/results-delivery/history",
      },
      {
        key: "delivery_issued" as const,
        label: RESULTS_DELIVERY_NAV.issued,
        href: "/results-delivery/issued",
      },
      {
        key: "delivery_revision" as const,
        label: RESULTS_DELIVERY_NAV.revisions,
        href: "/results-delivery/revisions",
      },
    ],
  },
  {
    id: "chem_info" as const,
    label: "Thông tin hóa học",
    items: [
      { key: "chem_info_periodic" as const, label: CHEM_INFO_NAV.periodicTable, href: "/chem-info/periodic-table" },
      { key: "chem_info_lookup" as const, label: CHEM_INFO_NAV.chemicalLookup, href: "/chem-info/chemicals" },
      { key: "chem_info_calculators" as const, label: CHEM_INFO_NAV.calculators, href: "/chem-info/calculators" },
      { key: "chem_info_compatibility" as const, label: CHEM_INFO_NAV.compatibility, href: "/chem-info/compatibility" },
    ],
  },
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
      { key: "preparation_history" as const, label: "Lịch sử pha chế", href: "/preparation-history" },
      { key: "environment_logs" as const, label: "Nhật ký môi trường", href: "/environment-logs" },
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
    id: "analytical_methods" as const,
    label: "Phương pháp phân tích",
    items: [
      { key: "methods_dashboard" as const, label: METHODS_NAV.dashboard, href: "/analytical-methods" },
      { key: "methods_list" as const, label: METHODS_NAV.list, href: "/analytical-methods/list" },
    ],
  },
  {
    id: "admin" as const,
    label: "Quản trị",
    items: [
      { key: "admin_people" as const, label: "Nhân sự", href: "/admin/people" },
      { key: "admin_permissions" as const, label: "Phân quyền", href: "/admin/permissions" },
      { key: "admin_tasks" as const, label: "Giao việc", href: "/admin/tasks" },
      { key: "catalog_matrices" as const, label: "Nhóm nền mẫu", href: "/admin/catalog/matrix-groups" },
      { key: "catalog_matrices" as const, label: "Nền mẫu", href: "/admin/catalog/matrices" },
      {
        key: "catalog_test_methods" as const,
        label: "Danh mục chỉ tiêu",
        href: "/admin/catalog/test-methods",
      },
      {
        key: "catalog_mappings" as const,
        label: "Mapping nền–chỉ tiêu",
        href: "/admin/catalog/mappings",
      },
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
  if (pathname.startsWith("/customer/")) return "delivery_issued";
  if (pathname === "/admin/users" || pathname === "/admin/staff") return "admin_people";
  if (pathname.startsWith("/admin/catalog/matrix-groups")) return "catalog_matrices";
  if (pathname.startsWith("/admin/catalog/matrices")) return "catalog_matrices";
  if (pathname.startsWith("/admin/catalog/test-methods")) return "catalog_test_methods";
  if (pathname.startsWith("/admin/catalog/mappings")) return "catalog_mappings";

  for (const item of ROUTE_ENTRIES) {
    if (item.href === "/") {
      if (pathname === "/") return item.key;
      continue;
    }
    if (item.href === "/equipment") {
      if (pathname === "/equipment") return item.key;
      continue;
    }
    if (item.href === "/analytical-methods") {
      if (pathname === "/analytical-methods") return item.key;
      continue;
    }
    if (pathname.startsWith("/analytical-methods/")) {
      return "methods_list";
    }
    if (pathname.startsWith("/method-executions/")) {
      return "methods_list";
    }
    if (item.href === "/samples") {
      if (pathname === "/samples") return "samples_list";
      if (pathname.startsWith("/samples/reports")) return "samples_list";
      if (pathname.startsWith("/samples/") && !pathname.startsWith("/samples/requests") &&
        !pathname.startsWith("/samples/receive") && !pathname.startsWith("/samples/assign") &&
        !pathname.startsWith("/samples/tracking") && !pathname.startsWith("/samples/storage") &&
        !pathname.startsWith("/samples/reports") && !pathname.startsWith("/samples/reception-log")) {
        return "samples_list";
      }
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

export function getSamplesNavItems() {
  return NAV_PERMISSION_GROUPS.find((g) => g.id === "samples")!.items;
}

export function getAnalysisNavItems() {
  return NAV_PERMISSION_GROUPS.find((g) => g.id === "analysis")!.items;
}

export function getResultsDeliveryNavItems() {
  return NAV_PERMISSION_GROUPS.find((g) => g.id === "results_delivery")!.items;
}

export function getChemInfoNavItems() {
  return NAV_PERMISSION_GROUPS.find((g) => g.id === "chem_info")!.items;
}

export function getMaterialsNavItems() {
  return NAV_PERMISSION_GROUPS.find((g) => g.id === "materials")!.items;
}

export function getEquipmentNavItems() {
  return NAV_PERMISSION_GROUPS.find((g) => g.id === "equipment")!.items;
}

export function getAnalyticalMethodsNavItems() {
  return NAV_PERMISSION_GROUPS.find((g) => g.id === "analytical_methods")!.items;
}

export function getAdminNavItems() {
  return NAV_PERMISSION_GROUPS.find((g) => g.id === "admin")!.items;
}

/** Admin routes require write; all others require read for middleware. */
export function isAdminPermissionKey(key: PermissionKey): boolean {
  return key.startsWith("admin_");
}
