import type {
  AnalysisTaskStatus,
  QcCheckStatus,
  QcCheckType,
  TestResultStatus,
  WorklistStatus,
  WorksheetStatus,
} from "@prisma/client";

export const ANALYSIS_NAV = {
  group: "Phân tích",
  inbox: "Mẫu chờ lab tiếp nhận",
  assignAnalyst: "Phân công analyst",
  worklist: "Worklist",
  worksheet: "Worksheet",
  samplePrep: "Chuẩn bị mẫu",
  results: "Nhập kết quả",
  resultsBySample: "Nhập kết quả theo mẫu",
  qc: "Kiểm tra QC",
  deviation: "Sai lệch / CAPA",
  review: "Kết quả chờ duyệt",
} as const;

export const ANALYSIS_TASK_STATUS_LABELS: Record<AnalysisTaskStatus, string> = {
  waiting_lab_acceptance: "Chờ lab tiếp nhận",
  lab_accepted: "Phòng ban đã tiếp nhận",
  analyst_assigned: "Đã phân công analyst",
  in_worklist: "Trong worklist",
  in_analysis: "Đang phân tích",
  result_entered: "Đã nhập kết quả",
  qc_checked: "Đã kiểm tra QC",
  submitted_for_review: "Chờ duyệt kết quả",
  approved: "Đã duyệt",
  rejected: "Trả về chỉnh sửa",
  cancelled: "Hủy",
};

export const WORKLIST_STATUS_LABELS: Record<WorklistStatus, string> = {
  draft: "Nháp",
  created: "Đã tạo",
  running: "Đang chạy",
  completed: "Hoàn thành",
  cancelled: "Hủy",
};

export const WORKSHEET_STATUS_LABELS: Record<WorksheetStatus, string> = {
  draft: "Nháp",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
  cancelled: "Hủy",
};

export const TEST_RESULT_STATUS_LABELS: Record<TestResultStatus, string> = {
  not_entered: "Chưa nhập",
  entered: "Đã nhập",
  qc_pending: "Cần kiểm tra",
  qc_passed: "QC đạt",
  qc_failed: "QC không đạt",
  submitted_for_review: "Đã gửi duyệt",
  approved: "Đã duyệt",
  rejected: "Trả về",
};

export const QC_CHECK_TYPE_LABELS: Record<QcCheckType, string> = {
  blank: "Blank",
  duplicate: "Duplicate",
  spike: "Spike",
  crm: "CRM",
  recovery: "Recovery",
  rsd: "RSD",
  calibration: "Calibration",
  control_chart: "Control chart",
};

export const QC_CHECK_STATUS_LABELS: Record<QcCheckStatus, string> = {
  pass: "Đạt",
  fail: "Không đạt",
  rerun: "Cần chạy lại",
  investigate: "Cần điều tra",
};

export const RESULT_EVALUATION_LABELS = {
  pass: "Đạt",
  fail: "Không đạt",
  not_applicable: "Không áp dụng",
} as const;

export const INBOX_STATUS_LABEL = "Chờ phòng ban tiếp nhận";
