export const METHODS_NAV = {
  dashboard: "Dashboard phương pháp",
  list: "Danh sách phương pháp",
  new: "Tạo phương pháp",
  documents: "Upload SOP",
  workflow: "Flowchart quy trình",
  checklist: "Checklist thực hiện",
  qc: "QC & tiêu chí chấp nhận",
  reagents: "Hóa chất/vật tư",
  equipment: "Thiết bị liên quan",
  approvals: "Phiên bản & phê duyệt",
  executions: "Thực hiện phương pháp",
} as const;

export const METHOD_VERSION_STATUS_LABELS: Record<string, string> = {
  Draft: "Nháp",
  Review: "Chờ duyệt",
  Approved: "Đã phê duyệt",
  Obsolete: "Ngừng sử dụng",
};

export const WORKFLOW_NODE_TYPE_LABELS: Record<string, string> = {
  Start: "Bắt đầu",
  Step: "Bước thao tác",
  Condition: "Điều kiện",
  Qc: "QC",
  Equipment: "Thiết bị",
  Reagent: "Hóa chất",
  End: "Kết thúc",
};

export const AI_WARNING =
  "Kết quả AI cần được kiểm tra theo SOP gốc. Không tự động phê duyệt.";
