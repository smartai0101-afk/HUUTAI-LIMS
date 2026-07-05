import { db } from "@/lib/db";
import { appendWorkflowEvent } from "@/lib/services/workflow-orchestrator";

export async function deliverReportByEmail(
  reportId: string,
  recipient: string,
  sentBy: string,
  note?: string,
) {
  const report = await db.testReport.findUnique({
    where: { id: reportId },
    include: { sample: true },
  });
  if (!report) throw new Error("Không tìm thấy phiếu kết quả");
  if (!["issued", "reissued"].includes(report.status)) {
    throw new Error("Chỉ gửi phiếu đã phát hành");
  }
  if (!recipient.trim()) throw new Error("Cần email người nhận");

  const printUrl = `/results-delivery/reports/${reportId}/print`;
  const attachmentUrl = report.pdfUrl || printUrl;

  return db.$transaction(async (tx) => {
    const log = await tx.reportDeliveryLog.create({
      data: {
        reportId,
        channel: "email",
        recipient: recipient.trim(),
        sentBy,
        attachmentUrl,
        status: "sent",
        note: note?.trim() ?? `Gửi COA ${report.reportCode}`,
      },
    });

    await tx.reportHistory.create({
      data: {
        reportId,
        version: report.reportVersion,
        issueNumber: report.issueNumber,
        action: "email_sent",
        actionBy: sentBy,
        reason: `Gửi tới ${recipient.trim()}`,
        pdfUrl: attachmentUrl,
      },
    });

    await appendWorkflowEvent(tx, {
      sampleId: report.sampleId,
      entityType: "test_report",
      entityId: reportId,
      fromStatus: report.status,
      toStatus: report.status,
      action: "EmailSent",
      performedBy: sentBy,
      reason: recipient.trim(),
    });

    return log;
  });
}
