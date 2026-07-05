import { createNotification } from "@/lib/notifications/create";
import { db } from "@/lib/db";

const DEDUPE_HOURS = 24;

async function shouldNotify(entityId: string, action: string): Promise<boolean> {
  const since = new Date(Date.now() - DEDUPE_HOURS * 60 * 60 * 1000);
  const existing = await db.notification.findFirst({
    where: { entityId, action, createdAt: { gte: since } },
  });
  return !existing;
}

export async function notifySampleRequestSubmitted(
  requestId: string,
  requestCode: string,
  submittedBy: string,
) {
  if (!(await shouldNotify(requestId, "LimsRequestSubmitted"))) return;
  await createNotification({
    actorName: submittedBy,
    action: "LimsRequestSubmitted",
    entityType: "sample_request",
    entityId: requestId,
    recordLabel: requestCode,
    object: "Phiếu yêu cầu chờ kiểm tra tiếp nhận",
    metadata: { href: `/samples/requests/review` },
  });
}

export async function notifyAnalystAssigned(
  taskId: string,
  sampleCode: string,
  analystName: string,
  changedBy: string,
) {
  if (!(await shouldNotify(taskId, "LimsAnalystAssigned"))) return;
  await createNotification({
    actorName: changedBy,
    action: "LimsAnalystAssigned",
    entityType: "analysis_task",
    entityId: taskId,
    recordLabel: sampleCode,
    object: `Phân công cho ${analystName}`,
    metadata: { href: `/analysis/worklists` },
  });
}

export async function notifyQcFailed(
  taskId: string,
  sampleCode: string,
  checkedBy: string,
  note?: string,
) {
  if (!(await shouldNotify(taskId, "LimsQcFailed"))) return;
  await createNotification({
    actorName: checkedBy,
    action: "LimsQcFailed",
    entityType: "analysis_task",
    entityId: taskId,
    recordLabel: sampleCode,
    object: note?.trim() || "QC không đạt — cần xử lý sai lệch/CAPA",
    metadata: { href: `/analysis/deviations` },
  });
}

export async function notifyPendingReportIssue(
  reportId: string,
  reportCode: string,
  sampleCode: string,
  actorName: string,
) {
  if (!(await shouldNotify(reportId, "LimsPendingIssue"))) return;
  await createNotification({
    actorName,
    action: "LimsPendingIssue",
    entityType: "test_report",
    entityId: reportId,
    recordLabel: reportCode,
    object: `Mẫu ${sampleCode} chờ phát hành kết quả`,
    metadata: { href: `/results-delivery/review` },
  });
}
