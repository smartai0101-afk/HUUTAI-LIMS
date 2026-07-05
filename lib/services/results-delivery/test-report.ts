import { db } from "@/lib/db";
import { generateReportCode } from "@/lib/report-code";
import {
  buildDocumentSnapshot,
  buildResultsSnapshot,
} from "@/lib/test-report/build-document-snapshot";
import {
  mapIssuedReportRow,
  mapPendingReleaseRow,
  mapReportHistoryView,
  mapTestReportView,
  parseReportResults,
  parseReportSignatures,
} from "@/lib/mappers/result-delivery";
import { appendSampleAuditLog } from "@/lib/services/samples/sample-audit";
import { appendWorkflowEvent } from "@/lib/services/workflow-orchestrator";
import { notifyPendingReportIssue } from "@/lib/services/lims-notification-hooks";
import type { ReportSignatures } from "@/types/result-delivery";
import { assertSampleReadyForRelease } from "./report-guards";

const sampleAnalysisInclude = {
  request: true,
  analysisTasks: {
    where: { status: { not: "cancelled" as const } },
    include: {
      testResults: true,
      qcChecks: true,
      worklistLinks: {
        include: {
          worklist: {
            include: {
              worksheets: {
                select: { startedAt: true, completedAt: true },
                orderBy: { createdAt: "asc" as const },
              },
            },
          },
        },
      },
    },
    orderBy: { parameterGroup: "asc" as const },
  },
  testReports: { where: { status: { not: "cancelled" as const } }, orderBy: { createdAt: "desc" as const } },
} as const;

async function loadSampleAnalysisContext(sampleId: string) {
  const sample = await db.sample.findUnique({
    where: { id: sampleId },
    include: sampleAnalysisInclude,
  });
  if (!sample) throw new Error("Không tìm thấy mẫu");
  return sample;
}

async function appendHistory(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  data: {
    reportId: string;
    version: number;
    issueNumber: number;
    action: "created" | "approved" | "qa_approved" | "issued" | "reissued" | "updated" | "cancelled";
    actionBy: string;
    reason?: string;
    documentSnapshotJson?: string;
    pdfUrl?: string;
  },
) {
  await tx.reportHistory.create({
    data: {
      reportId: data.reportId,
      version: data.version,
      issueNumber: data.issueNumber,
      action: data.action,
      actionBy: data.actionBy,
      reason: data.reason ?? "",
      documentSnapshotJson: data.documentSnapshotJson ?? "{}",
      pdfUrl: data.pdfUrl ?? "",
    },
  });
}

async function snapshotDocumentForReport(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  reportId: string,
  sample: Awaited<ReturnType<typeof loadSampleAnalysisContext>>,
  results: ReturnType<typeof buildResultsSnapshot>,
  signatures: ReportSignatures,
  analysisCompletedAt: Date,
  issueDate?: Date | null,
) {
  const reportRow = await tx.testReport.findUnique({
    where: { id: reportId },
    select: {
      customerAddress: true,
      customerName: true,
      customerContact: true,
      issueDate: true,
    },
  });
  const history = await tx.reportHistory.findMany({
    where: { reportId },
    orderBy: { actionAt: "asc" },
    select: { action: true, actionAt: true },
  });
  const document = buildDocumentSnapshot({
    sample: {
      ...sample,
      deliveredBy: sample.deliveredBy,
    },
    results,
    signatures,
    analysisCompletedAt,
    issueDate: issueDate ?? reportRow?.issueDate,
    history,
    customerAddress: reportRow?.customerAddress,
    customerName: reportRow?.customerName,
    customerContact: reportRow?.customerContact,
  });
  await tx.testReport.update({
    where: { id: reportId },
    data: { documentSnapshotJson: JSON.stringify(document) },
  });
  return JSON.stringify(document);
}

export async function listPendingRelease() {
  const samples = await db.sample.findMany({
    where: { status: "Completed" },
    include: {
      request: { select: { customerName: true, requesterName: true } },
      analysisTasks: {
        where: { status: { not: "cancelled" } },
        include: { qcChecks: true },
      },
      testReports: {
        where: { status: { in: ["draft", "approved"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const rows = [];
  for (const sample of samples) {
    const tasks = sample.analysisTasks;
    if (tasks.length === 0) continue;
    const allApproved = tasks.every((t) => t.status === "approved");
    if (!allApproved) continue;

    const qcOk = tasks.every((t) => {
      const latest = [...t.qcChecks].sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime())[0];
      return latest?.status === "pass";
    });
    if (!qcOk) continue;

    const draft = sample.testReports[0] ?? null;
    const readyToIssue = Boolean(
      draft && draft.status === "approved" && draft.qaApprovedBy.trim(),
    );

    rows.push(
      mapPendingReleaseRow({
        sample,
        analystNames: [...new Set(tasks.map((t) => t.analystName).filter(Boolean))],
        reviewerName: draft?.reviewerName || draft?.approvedBy || "—",
        completedAt: sample.updatedAt,
        draftReport: draft,
        readyToIssue,
      }),
    );
  }
  return rows;
}

export async function listReports(options?: {
  status?: "draft" | "approved" | "issued" | "reissued";
  partialOnly?: boolean;
}) {
  const rows = await db.testReport.findMany({
    where: {
      ...(options?.status ? { status: options.status } : {}),
      ...(options?.partialOnly ? { isPartial: true } : {}),
    },
    include: {
      sample: { select: { sampleCode: true, sampleName: true } },
      history: { select: { action: true, actionAt: true }, orderBy: { actionAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(mapTestReportView);
}

export async function getReport(id: string) {
  const row = await db.testReport.findUnique({
    where: { id },
    include: {
      sample: { select: { sampleCode: true, sampleName: true } },
      history: { select: { action: true, actionAt: true }, orderBy: { actionAt: "asc" } },
    },
  });
  return row ? mapTestReportView(row) : null;
}

export async function getReportBySample(sampleId: string) {
  const row = await db.testReport.findFirst({
    where: { sampleId, status: { not: "cancelled" } },
    include: {
      sample: { select: { sampleCode: true, sampleName: true } },
      history: { select: { action: true, actionAt: true }, orderBy: { actionAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return row ? mapTestReportView(row) : null;
}

export async function createReport(sampleId: string, createdBy: string) {
  await assertSampleReadyForRelease(sampleId);
  const sample = await loadSampleAnalysisContext(sampleId);

  const existingDraft = sample.testReports.find((r) => r.status === "draft");
  if (existingDraft) {
    const full = await db.testReport.findUnique({
      where: { id: existingDraft.id },
      include: {
        sample: { select: { sampleCode: true, sampleName: true } },
        history: { select: { action: true, actionAt: true }, orderBy: { actionAt: "asc" } },
      },
    });
    return mapTestReportView(full!);
  }

  const results = buildResultsSnapshot(sample.analysisTasks);
  const analystNames = [...new Set(sample.analysisTasks.map((t) => t.analystName).filter(Boolean))];
  const signatures: ReportSignatures = {
    analyst: analystNames.join(", "),
    reviewer: createdBy,
    labManager: "",
    qa: "",
    finalApprover: "",
  };
  const analysisCompletedAt = new Date();

  return db.$transaction(async (tx) => {
    const reportCode = await generateReportCode(tx);
    const report = await tx.testReport.create({
      data: {
        reportCode,
        sampleId,
        customerName: sample.request?.customerName ?? "",
        customerAddress: sample.request?.department ?? "",
        customerContact: sample.request?.requesterName ?? "",
        requestCode: sample.request?.requestCode ?? "",
        receivedAt: sample.receivedAt,
        analysisCompletedAt,
        analystName: analystNames.join(", "),
        reviewerName: createdBy,
        resultsJson: JSON.stringify(results),
        signaturesJson: JSON.stringify(signatures),
        status: "draft",
        createdBy,
      },
      include: { sample: { select: { sampleCode: true, sampleName: true } } },
    });

    await snapshotDocumentForReport(
      tx,
      report.id,
      sample,
      results,
      signatures,
      analysisCompletedAt,
    );

    const snap = await tx.testReport.findUnique({
      where: { id: report.id },
      select: { documentSnapshotJson: true },
    });
    await appendHistory(tx, {
      reportId: report.id,
      version: report.reportVersion,
      issueNumber: report.issueNumber,
      action: "created",
      actionBy: createdBy,
      documentSnapshotJson: snap?.documentSnapshotJson ?? "{}",
    });

    await appendSampleAuditLog(tx, {
      entityType: "sample",
      entityId: sampleId,
      action: "ReportCreated",
      before: {},
      after: { reportCode, status: "draft" },
      changedBy: createdBy,
    });

    const full = await tx.testReport.findUnique({
      where: { id: report.id },
      include: {
        sample: { select: { sampleCode: true, sampleName: true } },
        history: { select: { action: true, actionAt: true }, orderBy: { actionAt: "asc" } },
      },
    });
    return mapTestReportView(full!);
  }).then(async (view) => {
    await notifyPendingReportIssue(view.id, view.reportCode, view.sampleCode, createdBy);
    return view;
  });
}

export async function approveReport(reportId: string, changedBy: string, labManagerName?: string) {
  const report = await db.testReport.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("Không tìm thấy phiếu kết quả");
  if (report.status !== "draft") throw new Error("Chỉ duyệt phiếu ở trạng thái nháp");

  if (report.sampleId) {
    await assertSampleReadyForRelease(report.sampleId);
  }

  const signatures = parseReportSignatures(report.signaturesJson);
  signatures.labManager = labManagerName?.trim() || changedBy;
  signatures.finalApprover = labManagerName?.trim() || changedBy;

  const updated = await db.$transaction(async (tx) => {
    const row = await tx.testReport.update({
      where: { id: reportId },
      data: {
        status: "approved",
        approvedBy: changedBy,
        labManagerName: labManagerName?.trim() || changedBy,
        signaturesJson: JSON.stringify(signatures),
      },
      include: { sample: { select: { sampleCode: true, sampleName: true } } },
    });
    await appendHistory(tx, {
      reportId,
      version: row.reportVersion,
      issueNumber: row.issueNumber,
      action: "approved",
      actionBy: changedBy,
    });

    if (report.sampleId) {
      const sample = await tx.sample.findUnique({
        where: { id: report.sampleId },
        include: sampleAnalysisInclude,
      });
      if (sample) {
        await snapshotDocumentForReport(
          tx,
          reportId,
          sample,
          parseReportResults(report.resultsJson),
          signatures,
          report.analysisCompletedAt ?? new Date(),
        );
      }
    }
    return row;
  });

  return getReport(updated.id);
}

export async function qaApproveReport(reportId: string, changedBy: string, qaName?: string) {
  const report = await db.testReport.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("Không tìm thấy phiếu kết quả");
  if (report.status !== "approved") throw new Error("Phiếu cần Lab Manager duyệt trước");
  if (!report.approvedBy.trim()) throw new Error("Thiếu duyệt Lab Manager");

  const signatures = parseReportSignatures(report.signaturesJson);
  signatures.qa = qaName?.trim() || changedBy;

  const updated = await db.$transaction(async (tx) => {
    const row = await tx.testReport.update({
      where: { id: reportId },
      data: {
        qaApprovedBy: qaName?.trim() || changedBy,
        signaturesJson: JSON.stringify(signatures),
      },
      include: { sample: { select: { sampleCode: true, sampleName: true } } },
    });
    await appendHistory(tx, {
      reportId,
      version: row.reportVersion,
      issueNumber: row.issueNumber,
      action: "qa_approved",
      actionBy: changedBy,
    });

    if (report.sampleId) {
      const sample = await tx.sample.findUnique({
        where: { id: report.sampleId },
        include: sampleAnalysisInclude,
      });
      if (sample) {
        await snapshotDocumentForReport(
          tx,
          reportId,
          sample,
          parseReportResults(report.resultsJson),
          signatures,
          report.analysisCompletedAt ?? new Date(),
        );
      }
    }
    return row;
  });

  return getReport(updated.id);
}

export async function issueReport(reportId: string, issuedBy: string, note?: string) {
  const report = await db.testReport.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("Không tìm thấy phiếu kết quả");
  if (report.status !== "approved") throw new Error("Phiếu chưa được duyệt");
  if (!report.qaApprovedBy.trim()) throw new Error("QA chưa phê duyệt cuối");

  if (report.sampleId) {
    await assertSampleReadyForRelease(report.sampleId);
  }

  const issueDate = new Date();
  const signatures = parseReportSignatures(report.signaturesJson);

  const updated = await db.$transaction(async (tx) => {
    const row = await tx.testReport.update({
      where: { id: reportId },
      data: {
        status: "issued",
        issueDate,
        issuedBy,
        pdfUrl: `/results-delivery/reports/${reportId}/print`,
        note: note?.trim() ?? report.note,
      },
      include: { sample: { select: { sampleCode: true, sampleName: true } } },
    });

    await appendHistory(tx, {
      reportId,
      version: row.reportVersion,
      issueNumber: row.issueNumber,
      action: "issued",
      actionBy: issuedBy,
      reason: note?.trim() ?? "Phát hành lần đầu",
    });

    if (report.sampleId) {
      const sample = await tx.sample.findUnique({
        where: { id: report.sampleId },
        include: sampleAnalysisInclude,
      });
      if (sample) {
        await snapshotDocumentForReport(
          tx,
          reportId,
          sample,
          parseReportResults(report.resultsJson),
          signatures,
          report.analysisCompletedAt ?? issueDate,
          issueDate,
        );
      }

      await tx.sample.update({
        where: { id: report.sampleId },
        data: { status: "ResultIssued" },
      });

      await appendSampleAuditLog(tx, {
        entityType: "sample",
        entityId: report.sampleId,
        action: "ResultIssued",
        before: { status: "Completed" },
        after: { status: "ResultIssued", reportCode: row.reportCode },
        changedBy: issuedBy,
      });
    }

    return row;
  });

  return getReport(updated.id);
}

export async function reissueReport(reportId: string, issuedBy: string, reason: string) {
  const report = await db.testReport.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("Không tìm thấy phiếu kết quả");
  if (!["issued", "reissued"].includes(report.status)) {
    throw new Error("Chỉ phát hành lại phiếu đã phát hành");
  }

  if (!report.sampleId) throw new Error("Phát hành lại chỉ hỗ trợ phiếu theo mẫu");
  const sample = await loadSampleAnalysisContext(report.sampleId);
  const results = buildResultsSnapshot(sample.analysisTasks);
  const signatures = parseReportSignatures(report.signaturesJson);
  const nextVersion = report.reportVersion + 1;
  const nextIssue = report.issueNumber + 1;
  const issueDate = new Date();

  const updated = await db.$transaction(async (tx) => {
    const row = await tx.testReport.update({
      where: { id: reportId },
      data: {
        status: "reissued",
        reportVersion: nextVersion,
        issueNumber: nextIssue,
        issueDate,
        issuedBy,
        pdfUrl: `/results-delivery/reports/${reportId}/print`,
        resultsJson: JSON.stringify(results),
        note: reason.trim(),
      },
      include: { sample: { select: { sampleCode: true, sampleName: true } } },
    });

    await appendHistory(tx, {
      reportId,
      version: nextVersion,
      issueNumber: nextIssue,
      action: "reissued",
      actionBy: issuedBy,
      reason: reason.trim(),
    });

    await snapshotDocumentForReport(
      tx,
      reportId,
      sample,
      results,
      signatures,
      sample.updatedAt,
      issueDate,
    );

    await tx.testReport.update({
      where: { id: reportId },
      data: { status: "issued" },
    });

    return row;
  });

  return getReport(updated.id);
}

export async function listReportHistory() {
  const rows = await db.reportHistory.findMany({
    include: {
      report: {
        include: { sample: { select: { sampleCode: true } } },
      },
    },
    orderBy: { actionAt: "desc" },
    take: 500,
  });
  return rows.map(mapReportHistoryView);
}

export async function listIssuedReports(search?: string) {
  const rows = await db.testReport.findMany({
    where: {
      status: { in: ["issued", "reissued"] },
      ...(search?.trim()
        ? {
            OR: [
              { reportCode: { contains: search.trim() } },
              { customerName: { contains: search.trim() } },
              { sample: { sampleCode: { contains: search.trim() } } },
            ],
          }
        : {}),
    },
    include: { sample: { select: { sampleCode: true } } },
    orderBy: { issueDate: "desc" },
    take: 200,
  });
  return rows.map(mapIssuedReportRow);
}

export function exportReportCsv(report: NonNullable<Awaited<ReturnType<typeof getReport>>>) {
  if (!report) return "";
  const header =
    "STT,Chỉ tiêu,Nhóm,Kết quả,Đơn vị,LOD,LOQ,Giới hạn,Đánh giá,Phương pháp,Analyst";
  const lines = report.results.map((r, i) =>
    [
      i + 1,
      r.parameterName,
      r.parameterGroup,
      r.resultValue,
      r.unit,
      r.lod,
      r.loq,
      r.limitValue,
      r.evaluation ?? "",
      r.methodName ?? "",
      r.analystName,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header, ...lines].join("\n");
}

export async function listReportsForReview() {
  return db.testReport.findMany({
    where: { status: { in: ["draft", "approved"] } },
    include: {
      sample: { select: { sampleCode: true, sampleName: true } },
      history: { orderBy: { actionAt: "desc" }, take: 5 },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

export async function listReportRevisions() {
  return db.reportHistory.findMany({
    where: { action: { in: ["issued", "reissued"] } },
    include: {
      report: {
        include: { sample: { select: { sampleCode: true } } },
      },
    },
    orderBy: { actionAt: "desc" },
    take: 200,
  });
}

export async function cancelReport(reportId: string, reason: string, cancelledBy: string) {
  const report = await db.testReport.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("Không tìm thấy phiếu kết quả");
  if (report.status === "issued") {
    throw new Error("Không thể hủy phiếu đã phát hành — dùng hiệu chỉnh");
  }
  if (!reason.trim()) throw new Error("Cần lý do hủy");

  return db.$transaction(async (tx) => {
    const row = await tx.testReport.update({
      where: { id: reportId },
      data: { status: "cancelled", note: reason.trim() },
    });
    await appendHistory(tx, {
      reportId,
      version: row.reportVersion,
      issueNumber: row.issueNumber,
      action: "cancelled",
      actionBy: cancelledBy,
      reason: reason.trim(),
      documentSnapshotJson: row.documentSnapshotJson,
    });
    await appendWorkflowEvent(tx, {
      sampleId: row.sampleId,
      entityType: "test_report",
      entityId: reportId,
      fromStatus: report.status,
      toStatus: "cancelled",
      action: "ReportCancelled",
      performedBy: cancelledBy,
      reason: reason.trim(),
    });
    return row;
  });
}

export async function storeReportPdfUrl(reportId: string, pdfUrl: string) {
  return db.testReport.update({
    where: { id: reportId },
    data: { pdfUrl },
  });
}

export async function createRequestReport(requestId: string, createdBy: string) {
  const request = await db.sampleRequest.findUnique({
    where: { id: requestId },
    include: {
      samples: {
        include: {
          analysisTasks: { include: { testResults: true } },
          tests: { include: { testMethod: true } },
        },
      },
    },
  });
  if (!request) throw new Error("Không tìm thấy phiếu yêu cầu");

  const results = request.samples.flatMap((s) =>
    s.analysisTasks.flatMap((t) =>
      t.testResults
        .filter((r) => r.status === "approved" || r.status === "qc_passed")
        .map((r) => ({
          sampleId: s.id,
          sampleCode: s.sampleCode,
          sampleName: s.sampleName,
          parameterName: r.parameterName,
          resultValue: r.resultValue,
          unit: r.unit,
          lod: r.lod,
          loq: r.loq,
          note: r.note,
        })),
    ),
  );

  if (results.length === 0) throw new Error("Chưa có kết quả đủ điều kiện phát hành");

  return db.$transaction(async (tx) => {
    const reportCode = await generateReportCode(tx);
    const includedSampleIds = JSON.stringify(request.samples.map((s) => s.id));
    const report = await tx.testReport.create({
      data: {
        reportCode,
        requestId,
        sampleId: request.samples[0]?.id ?? null,
        isPartial: request.samples.some((s) =>
          s.tests.some((t) => !["TechApproved", "Reported", "Reviewed", "Done"].includes(t.status)),
        ),
        includedSampleIds,
        customerName: request.customerName,
        requestCode: request.requestCode,
        resultsJson: JSON.stringify(results),
        status: "draft",
        createdBy,
      },
    });

    let sortOrder = 0;
    for (const r of results) {
      await tx.reportItem.create({
        data: {
          reportId: report.id,
          sampleId: r.sampleId,
          parameterName: r.parameterName,
          resultValue: r.resultValue,
          unit: r.unit,
          lod: r.lod,
          loq: r.loq,
          remark: r.note,
          sortOrder: sortOrder++,
        },
      });
    }

    await appendHistory(tx, {
      reportId: report.id,
      version: 1,
      issueNumber: 1,
      action: "created",
      actionBy: createdBy,
      documentSnapshotJson: "{}",
    });

    return report;
  });
}

export async function createPartialReport(
  requestId: string,
  sampleIds: string[],
  createdBy: string,
) {
  const report = await createRequestReport(requestId, createdBy);
  await db.testReport.update({
    where: { id: report.id },
    data: {
      isPartial: true,
      includedSampleIds: JSON.stringify(sampleIds),
    },
  });
  return report;
}

export { parseReportResults };
