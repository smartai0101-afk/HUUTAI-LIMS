import type { ReportHistory, TestReport } from "@prisma/client";
import {
  buildLegacyDocumentSnapshot,
  buildSignatureDetails,
} from "@/lib/test-report/build-document-snapshot";
import type {
  IssuedReportRow,
  PendingReleaseRow,
  ReportHistoryView,
  ReportResultRow,
  ReportSignatures,
  TestReportDocumentSnapshot,
  TestReportView,
} from "@/types/result-delivery";

export function parseReportResults(json: string): ReportResultRow[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as ReportResultRow[]) : [];
  } catch {
    return [];
  }
}

export function parseReportSignatures(json: string): ReportSignatures {
  try {
    const parsed = JSON.parse(json);
    return {
      analyst: parsed?.analyst ?? "",
      reviewer: parsed?.reviewer ?? "",
      labManager: parsed?.labManager ?? "",
      qa: parsed?.qa ?? "",
      finalApprover: parsed?.finalApprover ?? "",
    };
  } catch {
    return { analyst: "", reviewer: "", labManager: "", qa: "", finalApprover: "" };
  }
}

export function parseDocumentSnapshot(json: string): TestReportDocumentSnapshot | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || !parsed.customer || !parsed.sample) {
      return null;
    }
    return parsed as TestReportDocumentSnapshot;
  } catch {
    return null;
  }
}

function resolveDocument(
  report: TestReport & { sample?: { sampleCode: string; sampleName: string } | null },
  results: ReportResultRow[],
  signatures: ReportSignatures,
  history: Pick<ReportHistory, "action" | "actionAt">[] = [],
): TestReportDocumentSnapshot {
  const stored = parseDocumentSnapshot(report.documentSnapshotJson);
  if (stored) {
    return {
      ...stored,
      signatureDetails: buildSignatureDetails(signatures, history),
    };
  }
  return buildLegacyDocumentSnapshot(report, results, signatures);
}

export function mapTestReportView(
  report: TestReport & {
    sample?: { sampleCode: string; sampleName: string } | null;
    history?: Pick<ReportHistory, "action" | "actionAt">[];
  },
): TestReportView {
  const results = parseReportResults(report.resultsJson);
  const signatures = parseReportSignatures(report.signaturesJson);
  return {
    id: report.id,
    reportCode: report.reportCode,
    sampleId: report.sampleId,
    requestId: report.requestId,
    isPartial: report.isPartial,
    sampleCode: report.sample?.sampleCode ?? "",
    sampleName: report.sample?.sampleName ?? "",
    reportVersion: report.reportVersion,
    issueNumber: report.issueNumber,
    issueDate: report.issueDate?.toISOString() ?? null,
    issuedBy: report.issuedBy,
    approvedBy: report.approvedBy,
    qaApprovedBy: report.qaApprovedBy,
    analystName: report.analystName,
    reviewerName: report.reviewerName,
    labManagerName: report.labManagerName,
    customerName: report.customerName,
    customerAddress: report.customerAddress,
    customerContact: report.customerContact,
    requestCode: report.requestCode,
    receivedAt: report.receivedAt?.toISOString() ?? null,
    analysisCompletedAt: report.analysisCompletedAt?.toISOString() ?? null,
    status: report.status,
    pdfUrl: report.pdfUrl,
    note: report.note,
    results,
    signatures,
    document: resolveDocument(report, results, signatures, report.history ?? []),
    createdAt: report.createdAt.toISOString(),
  };
}

export function mapPendingReleaseRow(input: {
  sample: {
    id: string;
    sampleCode: string;
    sampleName: string;
    receivedAt: Date;
    dueDate: Date | null;
    status: string;
    request: { customerName: string; requesterName: string } | null;
  };
  analystNames: string[];
  reviewerName: string;
  completedAt: Date | null;
  draftReport: { id: string; status: string; approvedBy: string; qaApprovedBy: string } | null;
  readyToIssue: boolean;
}): PendingReleaseRow {
  return {
    sampleId: input.sample.id,
    sampleCode: input.sample.sampleCode,
    sampleName: input.sample.sampleName,
    customerName: input.sample.request?.customerName ?? "",
    receivedAt: input.sample.receivedAt.toISOString(),
    completedAt: input.completedAt?.toISOString() ?? null,
    analystNames: input.analystNames.join(", "),
    reviewerName: input.reviewerName,
    statusLabel: input.draftReport?.status ?? "Chưa tạo phiếu",
    dueDate: input.sample.dueDate?.toISOString() ?? null,
    hasDraftReport: Boolean(input.draftReport),
    draftReportId: input.draftReport?.id ?? null,
    readyToIssue: input.readyToIssue,
  };
}

export function mapReportHistoryView(
  row: {
    id: string;
    reportId: string;
    version: number;
    issueNumber: number;
    action: ReportHistoryView["action"];
    actionBy: string;
    actionAt: Date;
    reason: string;
    report: { reportCode: string; sample: { sampleCode: string } | null };
  },
): ReportHistoryView {
  return {
    id: row.id,
    reportId: row.reportId,
    reportCode: row.report.reportCode,
    sampleCode: row.report.sample?.sampleCode ?? "",
    version: row.version,
    issueNumber: row.issueNumber,
    action: row.action,
    actionBy: row.actionBy,
    actionAt: row.actionAt.toISOString(),
    reason: row.reason,
  };
}

export function mapIssuedReportRow(
  report: TestReport & { sample: { sampleCode: string } | null },
): IssuedReportRow {
  return {
    id: report.id,
    reportCode: report.reportCode,
    sampleId: report.sampleId ?? "",
    sampleCode: report.sample?.sampleCode ?? report.requestCode ?? "",
    customerName: report.customerName,
    issueDate: report.issueDate?.toISOString() ?? null,
    issuedBy: report.issuedBy,
    reportVersion: report.reportVersion,
    issueNumber: report.issueNumber,
    status: report.status,
  };
}
