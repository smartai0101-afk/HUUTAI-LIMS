import { PERMISSION_LABELS, type PermissionKey } from "@/lib/auth/nav-permissions";

export type EntityRouteInfo = {
  moduleKey: PermissionKey;
  moduleLabel: string;
  href: string;
};

const ENTITY_ROUTES: Record<string, EntityRouteInfo> = {
  Chemical: { moduleKey: "chemicals", moduleLabel: PERMISSION_LABELS.chemicals, href: "/chemicals" },
  Standard: { moduleKey: "standards", moduleLabel: PERMISSION_LABELS.standards, href: "/standards" },
  MicrobialStrain: {
    moduleKey: "microbial_strains",
    moduleLabel: PERMISSION_LABELS.microbial_strains,
    href: "/microbial-strains",
  },
  PreparedChemical: {
    moduleKey: "prepared_chemicals",
    moduleLabel: PERMISSION_LABELS.prepared_chemicals,
    href: "/prepared-chemicals",
  },
  PreparedStandard: {
    moduleKey: "prepared_standards",
    moduleLabel: PERMISSION_LABELS.prepared_standards,
    href: "/prepared-standards",
  },
  PreparedStrain: {
    moduleKey: "prepared_strains",
    moduleLabel: PERMISSION_LABELS.prepared_strains,
    href: "/prepared-strains",
  },
  StockLot: { moduleKey: "stock_in", moduleLabel: PERMISSION_LABELS.stock_in, href: "/stock-in" },
  StockInLog: { moduleKey: "stock_in", moduleLabel: PERMISSION_LABELS.stock_in, href: "/stock-in" },
  chemical: { moduleKey: "stock_in", moduleLabel: PERMISSION_LABELS.stock_in, href: "/stock-in" },
  standard: { moduleKey: "stock_in", moduleLabel: PERMISSION_LABELS.stock_in, href: "/stock-in" },
  microbial_strain: {
    moduleKey: "stock_in",
    moduleLabel: PERMISSION_LABELS.stock_in,
    href: "/stock-in",
  },
  Container: { moduleKey: "containers", moduleLabel: PERMISSION_LABELS.containers, href: "/containers" },
  UsageLog: { moduleKey: "usage_logs", moduleLabel: PERMISSION_LABELS.usage_logs, href: "/usage-logs" },
  Equipment: {
    moduleKey: "equipment_catalog",
    moduleLabel: PERMISSION_LABELS.equipment_catalog,
    href: "/equipment/catalog",
  },
  CalibrationPlan: {
    moduleKey: "equipment_calibration_plans",
    moduleLabel: PERMISSION_LABELS.equipment_calibration_plans,
    href: "/equipment/calibration-plans",
  },
  CalibrationRecord: {
    moduleKey: "equipment_calibration_records",
    moduleLabel: PERMISSION_LABELS.equipment_calibration_records,
    href: "/equipment/calibration-records",
  },
  PostCalibrationEvaluation: {
    moduleKey: "equipment_calibration_records",
    moduleLabel: PERMISSION_LABELS.equipment_calibration_records,
    href: "/equipment/calibration-records",
  },
  MaintenancePlan: {
    moduleKey: "equipment_maintenance_plans",
    moduleLabel: PERMISSION_LABELS.equipment_maintenance_plans,
    href: "/equipment/maintenance-plans",
  },
  MaintenanceLog: {
    moduleKey: "equipment_maintenance_logs",
    moduleLabel: PERMISSION_LABELS.equipment_maintenance_logs,
    href: "/equipment/maintenance-logs",
  },
  RepairProposal: {
    moduleKey: "equipment_maintenance_logs",
    moduleLabel: PERMISSION_LABELS.equipment_maintenance_logs,
    href: "/equipment/maintenance-logs",
  },
  SparePart: {
    moduleKey: "equipment_spare_parts",
    moduleLabel: PERMISSION_LABELS.equipment_spare_parts,
    href: "/equipment/spare-parts",
  },
  EquipmentSparePartLink: {
    moduleKey: "equipment_spare_parts",
    moduleLabel: PERMISSION_LABELS.equipment_spare_parts,
    href: "/equipment/spare-parts",
  },
  SparePartUsage: {
    moduleKey: "equipment_spare_parts",
    moduleLabel: PERMISSION_LABELS.equipment_spare_parts,
    href: "/equipment/spare-parts",
  },
  EquipmentDisposal: {
    moduleKey: "equipment_disposal",
    moduleLabel: PERMISSION_LABELS.equipment_disposal,
    href: "/equipment/disposal",
  },
  EquipmentHistoryEvent: {
    moduleKey: "equipment_history",
    moduleLabel: PERMISSION_LABELS.equipment_history,
    href: "/equipment/history",
  },
  Task: { moduleKey: "admin_tasks", moduleLabel: PERMISSION_LABELS.admin_tasks, href: "/admin/tasks" },
  sample_request: {
    moduleKey: "samples_requests",
    moduleLabel: PERMISSION_LABELS.samples_requests,
    href: "/samples/requests",
  },
  sample: {
    moduleKey: "samples_list",
    moduleLabel: PERMISSION_LABELS.samples_list,
    href: "/samples",
  },
  analysis_task: {
    moduleKey: "analysis_inbox",
    moduleLabel: PERMISSION_LABELS.analysis_inbox,
    href: "/analysis/inbox",
  },
  test_report: {
    moduleKey: "delivery_reports",
    moduleLabel: PERMISSION_LABELS.delivery_reports,
    href: "/results-delivery/reports",
  },
  qc_check: {
    moduleKey: "analysis_qc",
    moduleLabel: PERMISSION_LABELS.analysis_qc,
    href: "/analysis/qc",
  },
};

const DEFAULT_ROUTE: EntityRouteInfo = {
  moduleKey: "dashboard",
  moduleLabel: PERMISSION_LABELS.dashboard,
  href: "/",
};

export function resolveEntityRoute(entityType: string): EntityRouteInfo {
  return ENTITY_ROUTES[entityType] ?? DEFAULT_ROUTE;
}

export const ACTION_LABELS: Record<string, string> = {
  Created: "đã thêm mới",
  Updated: "đã chỉnh sửa",
  Deleted: "đã xóa",
  StatusChanged: "đã đổi trạng thái",
  Approved: "đã duyệt",
  Rejected: "đã từ chối",
  Requested: "đã yêu cầu",
  Imported: "đã import",
  StockIn: "đã nhập kho",
  Completed: "đã hoàn thành",
  Linked: "đã liên kết",
  Unlinked: "đã gỡ liên kết",
  Used: "đã ghi xuất",
  Converted: "đã chuyển đổi",
  LimsRequestSubmitted: "đã gửi yêu cầu mẫu",
  LimsAnalystAssigned: "đã phân công analyst",
  LimsQcFailed: "QC không đạt",
  LimsPendingIssue: "chờ phát hành kết quả",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}
