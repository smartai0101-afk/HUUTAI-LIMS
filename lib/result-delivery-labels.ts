import type { ReportHistoryAction, ReportStatus } from "@prisma/client";
import { RESULTS_DELIVERY_NAV } from "@/lib/result-delivery-nav";

export { RESULTS_DELIVERY_NAV };
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: "Nháp",
  approved: "Đã duyệt",
  issued: "Đã phát hành",
  reissued: "Phát hành lại",
  cancelled: "Đã hủy",
};

export const REPORT_HISTORY_ACTION_LABELS: Record<ReportHistoryAction, string> = {
  created: "Tạo phiếu",
  updated: "Cập nhật",
  approved: "Lab Manager duyệt",
  qa_approved: "QA phê duyệt",
  issued: "Phát hành",
  reissued: "Phát hành lại",
  cancelled: "Hủy",
  email_sent: "Gửi email",
};

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  draft: "bg-slate-100 text-slate-800",
  approved: "bg-blue-100 text-blue-800",
  issued: "bg-emerald-100 text-emerald-800",
  reissued: "bg-amber-100 text-amber-800",
  cancelled: "bg-red-100 text-red-800",
};
