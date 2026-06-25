/** Full Vietnamese labels for the equipment module (no abbreviations). */

/** English page subtitle (gray line above Vietnamese title), same pattern as "Reference materials". */
export const EQUIPMENT_SUBTITLE = "Laboratory equipment";

export const EQUIPMENT_NAV = {
  dashboard: "Dashboard",
  catalog: "Danh mục",
  history: "Lý lịch",
  calibrationPlans: "Kế hoạch hiệu chuẩn",
  calibrationRecords: "Hồ sơ hiệu chuẩn",
  maintenancePlans: "Kế hoạch bảo trì",
  maintenanceLogs: "Nhật ký bảo trì/sửa chữa",
  repairProposals: "Đề xuất sửa chữa",
  spareParts: "Phụ kiện",
  disposal: "Thanh lý",
} as const;

export const EQUIPMENT_COLUMN = {
  equipmentCode: "Mã thiết bị",
  equipmentName: "Tên thiết bị",
  calibrationDate: "Ngày hiệu chuẩn",
  calibrationVendor: "Đơn vị hiệu chuẩn",
  lastCalibration: "Lần hiệu chuẩn gần nhất",
  nextCalibration: "Ngày hiệu chuẩn kế tiếp",
  calibrationExpiry: "Hạn hiệu chuẩn",
  latestCalibration: "Hiệu chuẩn gần nhất",
  maintenanceNext: "Ngày bảo trì kế tiếp",
  certificateNo: "Số chứng nhận",
  result: "Kết quả",
  calibrationResults: "Kết quả hiệu chuẩn",
  evaluationSummary: "Đánh giá hiệu chuẩn",
} as const;

export const CALIBRATION_EVAL = {
  sectionTitle: "Phần đánh giá hiệu chuẩn",
  recordSectionTitle: "Phần hồ sơ hiệu chuẩn",
  measuredResult: "Kết quả hiệu chuẩn",
  error: "Sai số",
  standardResult: "Kết quả quy chuẩn",
  correctiveAction: "Đánh giá/Hành động khắc phục",
  evaluatedBy: "Người đánh giá",
  evaluationDate: "Ngày đánh giá",
  notes: "Ghi chú",
  certificate: "Chứng nhận hiệu chuẩn",
  generalNotes: "Ghi chú chung",
  passFailHint:
    "Kết quả Đạt/Không đạt được tự suy khi lưu (so sánh kết quả hiệu chuẩn với kết quả quy chuẩn từng dòng).",
} as const;

export const MAINTENANCE_LOG = {
  issueDate: "Ngày phát hiện",
  completedDate: "Ngày hoàn thành",
  status: "Trạng thái",
  statusDone: "Đã hoàn thành",
  statusOpen: "Chưa hoàn thành",
  confirmComplete: "Xác nhận hoàn thành",
  vendor: "Đơn vị thực hiện",
  attachments: "Tệp đính kèm",
  existingAttachments: "Tệp hiện có",
} as const;

export const SPARE_PART = {
  code: "Mã phụ kiện",
  name: "Tên phụ kiện",
  manufacturer: "Hãng sản xuất",
  productCode: "Mã hàng",
  lotNumber: "Số LOT",
  stockQty: "Tồn kho",
  minQty: "Tồn tối thiểu",
  unit: "Đơn vị",
  notes: "Ghi chú",
} as const;

export const DASHBOARD_LABELS = {
  overdueCalibration: "Hiệu chuẩn quá hạn",
  upcomingCalibration: "Hiệu chuẩn sắp đến hạn",
  overdueMaintenance: "Bảo trì quá hạn",
} as const;

export const HISTORY = {
  images: "Hình ảnh",
  addImages: "Thêm ảnh",
  uploadImages: "Tải ảnh lên",
  noImages: "Chưa có hình ảnh",
  prevImage: "Ảnh trước",
  nextImage: "Ảnh sau",
  otherFiles: "Tệp đính kèm",
  deleteImage: "Xóa ảnh",
  imageCounter: (current: number, total: number) => `${current} / ${total}`,
} as const;
