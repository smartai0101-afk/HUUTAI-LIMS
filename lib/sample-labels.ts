import type {
  AnalysisAssignmentStatus,
  SampleConditionOnReceipt,
  SampleRequestStatus,
  SampleStatus,
  SampleTestStatus,
} from "@prisma/client";

export const SAMPLES_NAV = {
  group: "Tiếp nhận mẫu",
  requests: "Phiếu yêu cầu",
  list: "Danh sách mẫu",
  receive: "Tiếp nhận mẫu mới",
  assign: "Phân công phân tích",
  tracking: "Theo dõi trạng thái",
  storage: "Lưu mẫu / Hủy mẫu",
} as const;

export const SAMPLE_REQUEST_STATUS_LABELS: Record<SampleRequestStatus, string> = {
  Draft: "Nháp",
  Submitted: "Đã gửi",
  Received: "Đã tiếp nhận",
  Processing: "Đang xử lý",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};

export const SAMPLE_STATUS_LABELS: Record<SampleStatus, string> = {
  Received: "Mới tiếp nhận",
  WaitingAssignment: "Chờ phân công",
  Assigned: "Đã phân công",
  InAnalysis: "Đang phân tích",
  WaitingReview: "Chờ duyệt kết quả",
  Completed: "Hoàn thành phân tích",
  ResultIssued: "Đã phát hành kết quả",
  Stored: "Đã lưu mẫu",
  Disposed: "Đã hủy mẫu",
  Rejected: "Từ chối",
};

export const SAMPLE_CONDITION_LABELS: Record<SampleConditionOnReceipt, string> = {
  Pass: "Đạt",
  Fail: "Không đạt",
  NeedConfirmation: "Cần xác nhận",
  Rejected: "Từ chối tiếp nhận",
};

export const SAMPLE_TEST_STATUS_LABELS: Record<SampleTestStatus, string> = {
  Pending: "Chờ xử lý",
  Assigned: "Đã phân công",
  InProgress: "Đang thực hiện",
  Done: "Hoàn thành",
  Reviewed: "Đã duyệt",
};

export const ANALYSIS_ASSIGNMENT_STATUS_LABELS: Record<AnalysisAssignmentStatus, string> = {
  waiting_assignment: "Chờ phân công",
  assigned: "Đã phân công",
  department_received: "Phòng ban đã tiếp nhận",
  department_processing: "Đang xử lý tại phòng",
  completed: "Hoàn thành",
  cancelled: "Hủy",
};

export const SAMPLE_STATUS_COLORS: Record<SampleStatus, string> = {
  Received: "bg-blue-100 text-blue-800",
  WaitingAssignment: "bg-amber-100 text-amber-800",
  Assigned: "bg-indigo-100 text-indigo-800",
  InAnalysis: "bg-purple-100 text-purple-800",
  WaitingReview: "bg-orange-100 text-orange-800",
  Completed: "bg-emerald-100 text-emerald-800",
  ResultIssued: "bg-teal-100 text-teal-800",
  Stored: "bg-slate-100 text-slate-800",
  Disposed: "bg-red-100 text-red-800",
  Rejected: "bg-red-100 text-red-800",
};

export const CONDITION_REASON_SUGGESTIONS = [
  "Bao bì hư hỏng",
  "Thiếu nhãn",
  "Không đủ lượng mẫu",
  "Sai điều kiện bảo quản",
  "Không đúng thông tin phiếu yêu cầu",
] as const;

export const SAMPLE_TYPE_OPTIONS = [
  "Nước",
  "Đất",
  "Không khí",
  "Thực phẩm",
  "Hóa chất",
  "Dược phẩm",
  "Khác",
] as const;
