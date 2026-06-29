import type { ReportHistory, TestReport } from "@prisma/client";
import { SAMPLE_CONDITION_LABELS } from "@/lib/sample-labels";
import { SCI_TECH_LAB_CONFIG } from "@/lib/test-report/sci-tech-lab-config";
import { formatCoaDate, inferStandardRef } from "@/lib/test-report/coa-format";
import type {
  ReportConclusion,
  ReportMethodRow,
  ReportResultRow,
  ReportSignatureDetail,
  ReportSignatures,
  TestReportCoverSnapshot,
  TestReportDocumentSnapshot,
  TestReportSampleSnapshot,
  TestReportView,
} from "@/types/result-delivery";

type AnalysisTaskWithContext = {
  parameterGroup: string;
  departmentName: string;
  analystName: string;
  assignedAt: Date;
  testResults: {
    parameterName: string;
    resultValue: string;
    unit: string;
    lod: string;
    loq: string;
    limitValue: string;
    evaluation: "pass" | "fail" | "not_applicable" | null;
    analystName: string;
    enteredAt: Date | null;
  }[];
  worklistLinks: {
    worklist: {
      methodName: string;
      methodVersion: number | null;
      equipmentName: string;
      worksheets: { startedAt: Date | null; completedAt: Date | null }[];
    };
  }[];
};

type SampleContext = {
  sampleCode: string;
  sampleName: string;
  customerSampleCode: string;
  sampleType: string;
  quantity: number | null;
  unit: string;
  containerType: string;
  conditionOnReceipt: keyof typeof SAMPLE_CONDITION_LABELS;
  preservationCondition: string;
  receivedBy: string;
  deliveredBy?: string;
  receivedAt: Date;
  request: {
    requestCode: string;
    requestDate: Date;
    requesterName: string;
    customerName: string;
    department: string;
  } | null;
  analysisTasks: AnalysisTaskWithContext[];
};

function buildConclusion(results: ReportResultRow[]): ReportConclusion {
  const withLimits = results.filter((r) => r.limitValue.trim());
  if (withLimits.length === 0) {
    return { mode: "none", text: SCI_TECH_LAB_CONFIG.conclusionDisclaimer };
  }
  const hasFail = withLimits.some((r) => r.evaluation === "fail");
  if (hasFail) {
    return { mode: "fail", text: "Sample does not meet requirements. / Mẫu không đạt yêu cầu." };
  }
  const allPass = withLimits.every((r) => r.evaluation === "pass");
  if (allPass) {
    return { mode: "pass", text: "Sample meets requirements. / Mẫu đạt yêu cầu." };
  }
  return { mode: "none", text: SCI_TECH_LAB_CONFIG.conclusionDisclaimer };
}

function getTaskWorklist(task: AnalysisTaskWithContext) {
  return task.worklistLinks[0]?.worklist ?? null;
}

function getAnalysisStartedAt(tasks: AnalysisTaskWithContext[]): Date | null {
  let earliest: Date | null = null;
  for (const task of tasks) {
    const wl = getTaskWorklist(task);
    for (const ws of wl?.worksheets ?? []) {
      if (ws.startedAt && (!earliest || ws.startedAt < earliest)) {
        earliest = ws.startedAt;
      }
    }
    if (!earliest && task.assignedAt) earliest = task.assignedAt;
  }
  return earliest;
}

function buildSampleDescriptionEn(sampleName: string, quantity: string, packaging: string): string {
  const parts = [sampleName];
  if (quantity !== "—") parts.push(`(approx. ${quantity})`);
  if (packaging !== "—") parts.push(`in ${packaging}`);
  return parts.join(" ");
}

function buildSampleDescriptionVi(sampleName: string, quantity: string, packaging: string): string {
  const parts = [sampleName];
  if (quantity !== "—") parts.push(`(khoảng ${quantity})`);
  if (packaging !== "—") parts.push(`chứa trong ${packaging}`);
  return parts.join(" ");
}

function buildTestsRequested(results: ReportResultRow[]): { en: string; vi: string } {
  const names = [...new Set(results.map((r) => r.parameterName).filter(Boolean))];
  if (names.length === 0) return SCI_TECH_LAB_CONFIG.testsRequestedFallback;
  const joined = names.join(", ");
  return { en: joined, vi: joined };
}

export function buildCoverSnapshot(input: {
  sample: TestReportSampleSnapshot;
  results: ReportResultRow[];
  requestCode: string;
  sampleCode: string;
}): TestReportCoverSnapshot {
  const { sample, results, requestCode, sampleCode } = input;
  const started = sample.analysisStartedAt !== "—" ? sample.analysisStartedAt : "";
  const completed = sample.analysisCompletedAt !== "—" ? sample.analysisCompletedAt : "";
  const testingPeriod =
    started && completed ? `${started} – ${completed}` : started || completed || "—";
  const testsRequested = buildTestsRequested(results);
  const deliveredBy = sample.deliveredBy?.trim();
  const sampledByEn = deliveredBy || SCI_TECH_LAB_CONFIG.sampledByFallback.en;
  const sampledByVi = deliveredBy || SCI_TECH_LAB_CONFIG.sampledByFallback.vi;

  return {
    jobNumber: requestCode || sampleCode,
    sampleDescriptionEn: buildSampleDescriptionEn(sample.sampleName, sample.quantity, sample.packaging),
    sampleDescriptionVi: buildSampleDescriptionVi(sample.sampleName, sample.quantity, sample.packaging),
    testingPeriod,
    testsRequestedEn: testsRequested.en,
    testsRequestedVi: testsRequested.vi,
    sampledByEn,
    sampledByVi,
  };
}

export function resolveCoverSnapshot(
  report: TestReportView,
): TestReportCoverSnapshot {
  if (report.document.cover) return report.document.cover;
  return buildCoverSnapshot({
    sample: report.document.sample,
    results: report.results,
    requestCode: report.requestCode,
    sampleCode: report.sampleCode,
  });
}

export function buildResultsSnapshot(tasks: AnalysisTaskWithContext[]): ReportResultRow[] {
  const rows: ReportResultRow[] = [];
  for (const task of tasks) {
    const wl = getTaskWorklist(task);
    const methodName = wl?.methodName ?? "";
    const methodCode = methodName ? methodName.split(" ")[0] : "";
    for (const result of task.testResults) {
      rows.push({
        parameterName: result.parameterName,
        parameterGroup: task.parameterGroup,
        resultValue: result.resultValue,
        unit: result.unit,
        lod: result.lod,
        loq: result.loq,
        limitValue: result.limitValue,
        evaluation: result.evaluation,
        analystName: result.analystName || task.analystName,
        methodCode,
        methodName,
        standardRef: inferStandardRef(result.limitValue),
      });
    }
  }
  return rows;
}

export function buildMethodRows(tasks: AnalysisTaskWithContext[]): ReportMethodRow[] {
  const rows: ReportMethodRow[] = [];
  for (const task of tasks) {
    const wl = getTaskWorklist(task);
    for (const result of task.testResults) {
      const analysisDate =
        result.enteredAt ??
        wl?.worksheets.find((w) => w.completedAt)?.completedAt ??
        wl?.worksheets.find((w) => w.startedAt)?.startedAt ??
        task.assignedAt;
      rows.push({
        parameterName: result.parameterName,
        methodCode: wl?.methodName?.split(" ")[0] ?? "—",
        methodName: wl?.methodName || "—",
        methodVersion: wl?.methodVersion ? String(wl.methodVersion) : "—",
        department: task.departmentName || "—",
        equipment: wl?.equipmentName || "—",
        analysisDate: formatCoaDate(analysisDate),
      });
    }
  }
  return rows;
}

export function buildSignatureDetails(
  signatures: ReportSignatures,
  history: Pick<ReportHistory, "action" | "actionAt">[] = [],
): TestReportDocumentSnapshot["signatureDetails"] {
  const findDate = (action: ReportHistory["action"]) => {
    const row = history.find((h) => h.action === action);
    return row ? formatCoaDate(row.actionAt) : "";
  };

  const signed = (name: string, action: ReportHistory["action"]) => ({
    name,
    signedAt: findDate(action),
    eSignStatus: name.trim() ? "Đã ký điện tử" : "",
  });

  return {
    analyst: {
      ...signed(signatures.analyst, "created"),
      title: "Analyst / Người phân tích",
    },
    reviewer: {
      ...signed(signatures.reviewer, "created"),
      title: "Reviewer",
    },
    labManager: {
      ...signed(signatures.labManager, "approved"),
      title: "Lab Manager",
    },
    qa: {
      ...signed(signatures.qa, "qa_approved"),
      title: "QA",
    },
    finalApprover: {
      ...signed(signatures.finalApprover || signatures.labManager, "issued"),
      title: "Final approver / Người phê duyệt cuối",
    },
  };
}

export function buildDocumentSnapshot(input: {
  sample: SampleContext;
  results: ReportResultRow[];
  signatures: ReportSignatures;
  analysisCompletedAt: Date;
  issueDate?: Date | null;
  history?: Pick<ReportHistory, "action" | "actionAt">[];
  customerAddress?: string;
  customerName?: string;
  customerContact?: string;
}): TestReportDocumentSnapshot {
  const {
    sample,
    results,
    signatures,
    analysisCompletedAt,
    issueDate,
    history = [],
    customerAddress,
    customerName,
    customerContact,
  } = input;
  const startedAt = getAnalysisStartedAt(sample.analysisTasks);
  const quantity =
    sample.quantity != null
      ? `${sample.quantity}${sample.unit ? ` ${sample.unit}` : ""}`.trim()
      : "—";

  const sampleSnapshot: TestReportSampleSnapshot = {
    sciTechSampleCode: sample.sampleCode,
    customerSampleCode: sample.customerSampleCode || "—",
    sampleName: sample.sampleName,
    sampleType: sample.sampleType || "—",
    quantity,
    packaging: sample.containerType || sample.preservationCondition || "—",
    conditionOnReceipt: SAMPLE_CONDITION_LABELS[sample.conditionOnReceipt] ?? sample.conditionOnReceipt,
    receivedAt: formatCoaDate(sample.receivedAt),
    analysisStartedAt: formatCoaDate(startedAt),
    analysisCompletedAt: formatCoaDate(analysisCompletedAt),
    issueDate: formatCoaDate(issueDate),
    receivedBy: sample.receivedBy || "—",
    deliveredBy: sample.deliveredBy?.trim() || "",
  };

  const requestCode = sample.request?.requestCode ?? "";

  return {
    customer: {
      name: customerName ?? sample.request?.customerName ?? "",
      address: customerAddress ?? sample.request?.department ?? "",
      contact: customerContact ?? sample.request?.requesterName ?? "",
      email: SCI_TECH_LAB_CONFIG.email,
      phone: SCI_TECH_LAB_CONFIG.phone,
      requestCode,
      requestDate: formatCoaDate(sample.request?.requestDate),
      requesterName: sample.request?.requesterName ?? "",
    },
    sample: sampleSnapshot,
    cover: buildCoverSnapshot({
      sample: sampleSnapshot,
      results,
      requestCode,
      sampleCode: sample.sampleCode,
    }),
    methods: buildMethodRows(sample.analysisTasks),
    conclusion: buildConclusion(results),
    remarks: SCI_TECH_LAB_CONFIG.defaultRemarks,
    isoNotes: [...SCI_TECH_LAB_CONFIG.isoNotes],
    signatureDetails: buildSignatureDetails(signatures, history),
  };
}

export function buildLegacyDocumentSnapshot(
  report: TestReport & { sample?: { sampleCode: string; sampleName: string } },
  results: ReportResultRow[],
  signatures: ReportSignatures,
): TestReportDocumentSnapshot {
  return buildDocumentSnapshot({
    sample: {
      sampleCode: report.sample?.sampleCode ?? "",
      sampleName: report.sample?.sampleName ?? "",
      customerSampleCode: "",
      sampleType: "",
      quantity: null,
      unit: "",
      containerType: "",
      conditionOnReceipt: "Pass",
      preservationCondition: "",
      receivedBy: "",
      deliveredBy: "",
      receivedAt: report.receivedAt ?? new Date(),
      request: {
        requestCode: report.requestCode,
        requestDate: report.receivedAt ?? new Date(),
        requesterName: report.customerContact,
        customerName: report.customerName,
        department: report.customerAddress,
      },
      analysisTasks: [],
    },
    results,
    signatures,
    analysisCompletedAt: report.analysisCompletedAt ?? new Date(),
    issueDate: report.issueDate,
    customerAddress: report.customerAddress,
    customerName: report.customerName,
    customerContact: report.customerContact,
  });
}

export type { SampleContext, AnalysisTaskWithContext };
