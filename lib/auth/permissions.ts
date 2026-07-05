import type { UserRole } from "@prisma/client";
import {
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  routePermission,
  type PermissionKey,
} from "@/lib/auth/nav-permissions";

export { PERMISSION_KEYS, PERMISSION_LABELS, routePermission, type PermissionKey };

type AccessLevel = "none" | "read" | "write";

const CHEM_INFO_KEYS: PermissionKey[] = [
  "chem_info_periodic",
  "chem_info_lookup",
  "chem_info_calculators",
  "chem_info_compatibility",
];

const MATERIALS_KEYS: PermissionKey[] = [
  "dashboard",
  "stock_in",
  "chemicals",
  "standards",
  "microbial_strains",
  "prepared_chemicals",
  "prepared_standards",
  "prepared_strains",
  "preparation_history",
  "environment_logs",
  "containers",
  "usage_logs",
  "reports",
];

const EQUIPMENT_KEYS: PermissionKey[] = [
  "equipment_dashboard",
  "equipment_catalog",
  "equipment_history",
  "equipment_calibration_plans",
  "equipment_calibration_records",
  "equipment_maintenance_plans",
  "equipment_maintenance_logs",
  "equipment_spare_parts",
  "equipment_disposal",
];

const METHODS_KEYS: PermissionKey[] = ["methods_dashboard", "methods_list"];

const SAMPLES_KEYS: PermissionKey[] = [
  "samples_requests",
  "samples_requests_new",
  "samples_request_review",
  "samples_request_matrix",
  "samples_list",
  "samples_receive",
  "samples_assign",
  "samples_tracking",
  "samples_storage",
  "samples_reception_log",
];

const ANALYSIS_KEYS: PermissionKey[] = [
  "analysis_inbox",
  "analysis_assign_analyst",
  "analysis_worklist",
  "analysis_worksheet",
  "analysis_sample_prep",
  "analysis_results",
  "analysis_results_by_sample",
  "analysis_qc",
  "analysis_deviation",
  "analysis_review",
];

const DELIVERY_KEYS: PermissionKey[] = [
  "delivery_pending",
  "delivery_review",
  "delivery_reports",
  "delivery_partial",
  "delivery_history",
  "delivery_issued",
  "delivery_revision",
];

const CATALOG_KEYS: PermissionKey[] = [
  "catalog_matrices",
  "catalog_test_methods",
  "catalog_mappings",
];

function writeSome(keys: PermissionKey[]): Partial<Record<PermissionKey, AccessLevel>> {
  return Object.fromEntries(keys.map((k) => [k, "write"])) as Partial<
    Record<PermissionKey, AccessLevel>
  >;
}

function writeAll(keys: PermissionKey[]): Partial<Record<PermissionKey, AccessLevel>> {
  return Object.fromEntries(keys.map((k) => [k, "write"])) as Partial<
    Record<PermissionKey, AccessLevel>
  >;
}

function readAll(keys: PermissionKey[]): Partial<Record<PermissionKey, AccessLevel>> {
  return Object.fromEntries(keys.map((k) => [k, "read"])) as Partial<
    Record<PermissionKey, AccessLevel>
  >;
}

const ROLE_DEFAULTS: Record<UserRole, Partial<Record<PermissionKey, AccessLevel>>> = {
  Admin: {},
  LabManager: {
    ...readAll(CHEM_INFO_KEYS),
    ...writeAll(MATERIALS_KEYS),
    ...writeAll(EQUIPMENT_KEYS),
    ...writeAll(METHODS_KEYS),
    ...writeAll(SAMPLES_KEYS),
    ...writeAll(ANALYSIS_KEYS),
    ...writeAll(DELIVERY_KEYS),
    ...writeAll(CATALOG_KEYS),
    admin_tasks: "write",
    admin_people: "write",
  },
  Analyst: {
    ...readAll(CHEM_INFO_KEYS),
    ...writeAll(MATERIALS_KEYS),
    ...writeAll(EQUIPMENT_KEYS),
    ...writeAll(METHODS_KEYS),
    ...writeSome(["samples_list", "samples_receive", "samples_tracking"]),
    samples_requests: "read",
    samples_request_review: "read",
    samples_reception_log: "read",
    samples_assign: "read",
    samples_storage: "read",
    analysis_inbox: "read",
    analysis_assign_analyst: "read",
    analysis_sample_prep: "read",
    analysis_deviation: "read",
    ...writeSome(["analysis_worklist", "analysis_worksheet", "analysis_results", "analysis_results_by_sample"]),
    analysis_qc: "read",
    analysis_review: "read",
    ...readAll(DELIVERY_KEYS),
    admin_tasks: "write",
  },
  QAQC: {
    dashboard: "write",
    reports: "write",
    admin_tasks: "write",
    ...readAll(CHEM_INFO_KEYS),
    ...readAll(MATERIALS_KEYS.filter((k) => k !== "dashboard" && k !== "reports")),
    ...readAll(EQUIPMENT_KEYS),
    ...readAll(METHODS_KEYS),
    ...readAll(SAMPLES_KEYS),
    samples_tracking: "write",
    samples_storage: "write",
    ...readAll(ANALYSIS_KEYS),
    analysis_qc: "write",
    analysis_deviation: "write",
    analysis_review: "write",
    ...readAll(DELIVERY_KEYS),
    delivery_pending: "write",
    delivery_review: "write",
    delivery_reports: "write",
    delivery_history: "write",
    delivery_issued: "write",
    delivery_revision: "write",
    delivery_partial: "write",
  },
  CustomerViewer: {
    ...readAll(DELIVERY_KEYS.filter((k) => k === "delivery_issued" || k === "delivery_reports")),
  },
  Viewer: {
    dashboard: "write",
    reports: "write",
    ...readAll(CHEM_INFO_KEYS),
    ...readAll(MATERIALS_KEYS.filter((k) => k !== "dashboard" && k !== "reports")),
    ...readAll(EQUIPMENT_KEYS),
    methods_dashboard: "read",
    methods_list: "read",
    ...readAll(SAMPLES_KEYS),
    ...readAll(ANALYSIS_KEYS),
    ...readAll(DELIVERY_KEYS),
  },
};

function defaultAccess(role: UserRole, key: PermissionKey): AccessLevel {
  if (role === "Admin") return "write";
  return ROLE_DEFAULTS[role][key] ?? "none";
}

export function hasPermission(
  role: UserRole,
  extraKeys: string[],
  key: PermissionKey,
  mode: "read" | "write" = "write",
): boolean {
  if (role === "Admin") return true;
  if (extraKeys.includes(key)) return true;
  const access = defaultAccess(role, key);
  if (access === "none") return false;
  if (mode === "read") return access === "read" || access === "write";
  return access === "write";
}

export function listEffectivePermissions(role: UserRole, extraKeys: string[]): PermissionKey[] {
  if (role === "Admin") return [...PERMISSION_KEYS];
  const keys = new Set<PermissionKey>();
  for (const key of PERMISSION_KEYS) {
    if (hasPermission(role, extraKeys, key, "read")) keys.add(key);
  }
  return [...keys];
}
