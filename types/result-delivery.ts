import type { ReportHistoryAction, ReportStatus, ResultEvaluation } from "@prisma/client";

export type ReportResultRow = {
  parameterName: string;
  parameterGroup: string;
  resultValue: string;
  unit: string;
  lod: string;
  loq: string;
  limitValue: string;
  evaluation: ResultEvaluation | null;
  analystName: string;
  methodCode?: string;
  methodName?: string;
  standardRef?: string;
};

export type ReportSignatures = {
  analyst: string;
  reviewer: string;
  labManager: string;
  qa: string;
  finalApprover: string;
};

export type ReportMethodRow = {
  parameterName: string;
  methodCode: string;
  methodName: string;
  methodVersion: string;
  department: string;
  equipment: string;
  analysisDate: string;
};

export type ReportSignatureDetail = {
  name: string;
  title: string;
  signedAt: string;
  eSignStatus: string;
};

export type ReportConclusion = {
  mode: "pass" | "fail" | "none";
  text: string;
};

export type TestReportCustomerSnapshot = {
  name: string;
  address: string;
  contact: string;
  email: string;
  phone: string;
  requestCode: string;
  requestDate: string;
  requesterName: string;
};

export type TestReportSampleSnapshot = {
  sciTechSampleCode: string;
  customerSampleCode: string;
  sampleName: string;
  sampleType: string;
  quantity: string;
  packaging: string;
  conditionOnReceipt: string;
  receivedAt: string;
  analysisStartedAt: string;
  analysisCompletedAt: string;
  issueDate: string;
  receivedBy: string;
  deliveredBy?: string;
};

export type TestReportCoverSnapshot = {
  jobNumber: string;
  sampleDescriptionEn: string;
  sampleDescriptionVi: string;
  testingPeriod: string;
  testsRequestedEn: string;
  testsRequestedVi: string;
  sampledByEn: string;
  sampledByVi: string;
};

export type TestReportDocumentSnapshot = {
  customer: TestReportCustomerSnapshot;
  sample: TestReportSampleSnapshot;
  cover?: TestReportCoverSnapshot;
  methods: ReportMethodRow[];
  conclusion: ReportConclusion;
  remarks: string;
  isoNotes: string[] | { en: string; vi: string }[];
  signatureDetails: {
    analyst: ReportSignatureDetail;
    reviewer: ReportSignatureDetail;
    qa: ReportSignatureDetail;
    labManager: ReportSignatureDetail;
    finalApprover: ReportSignatureDetail;
  };
};

export type PendingReleaseRow = {
  sampleId: string;
  sampleCode: string;
  sampleName: string;
  customerName: string;
  receivedAt: string;
  completedAt: string | null;
  analystNames: string;
  reviewerName: string;
  statusLabel: string;
  dueDate: string | null;
  hasDraftReport: boolean;
  draftReportId: string | null;
  readyToIssue: boolean;
};

export type TestReportView = {
  id: string;
  reportCode: string;
  sampleId: string | null;
  requestId?: string | null;
  isPartial?: boolean;
  sampleCode: string;
  sampleName: string;
  reportVersion: number;
  issueNumber: number;
  issueDate: string | null;
  issuedBy: string;
  approvedBy: string;
  qaApprovedBy: string;
  analystName: string;
  reviewerName: string;
  labManagerName: string;
  customerName: string;
  customerAddress: string;
  customerContact: string;
  requestCode: string;
  receivedAt: string | null;
  analysisCompletedAt: string | null;
  status: ReportStatus;
  pdfUrl: string;
  note: string;
  results: ReportResultRow[];
  signatures: ReportSignatures;
  document: TestReportDocumentSnapshot;
  createdAt: string;
};

export type ReportHistoryView = {
  id: string;
  reportId: string;
  reportCode: string;
  sampleCode: string;
  version: number;
  issueNumber: number;
  action: ReportHistoryAction;
  actionBy: string;
  actionAt: string;
  reason: string;
};

export type IssuedReportRow = {
  id: string;
  reportCode: string;
  sampleId: string;
  sampleCode: string;
  customerName: string;
  issueDate: string | null;
  issuedBy: string;
  reportVersion: number;
  issueNumber: number;
  status: ReportStatus;
};
