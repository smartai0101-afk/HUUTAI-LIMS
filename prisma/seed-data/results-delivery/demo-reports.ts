import type { PrismaClient } from "@prisma/client";
import {
  buildDocumentSnapshot,
  buildResultsSnapshot,
} from "../../../lib/test-report/build-document-snapshot";

export async function seedDemoReports(prisma: PrismaClient) {
  const sample = await prisma.sample.findUnique({
    where: { sampleCode: "SPL-20260629-0001" },
    include: {
      request: true,
      analysisTasks: {
        where: { status: "approved" },
        include: {
          testResults: true,
          worklistLinks: {
            include: {
              worklist: {
                include: {
                  worksheets: { select: { startedAt: true, completedAt: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!sample || sample.analysisTasks.length === 0) return;

  const existing = await prisma.testReport.findFirst({
    where: { sampleId: sample.id, status: { in: ["issued", "reissued"] } },
  });

  const results = buildResultsSnapshot(sample.analysisTasks);
  const signatures = {
    analyst: sample.analysisTasks.map((t) => t.analystName).filter(Boolean).join(", ") || "Analyst Seed",
    reviewer: "Seed Reviewer",
    labManager: "Seed Lab Manager",
    qa: "Seed QA",
    finalApprover: "Seed Lab Manager",
  };
  const analysisCompletedAt = new Date("2026-06-07T00:00:00.000Z");
  const issueDate = new Date("2026-06-08T00:00:00.000Z");
  const document = buildDocumentSnapshot({
    sample,
    results,
    signatures,
    analysisCompletedAt,
    issueDate,
    history: [
      { action: "created", actionAt: new Date("2026-06-07T12:00:00.000Z") },
      { action: "approved", actionAt: new Date("2026-06-07T14:00:00.000Z") },
      { action: "qa_approved", actionAt: new Date("2026-06-07T15:00:00.000Z") },
      { action: "issued", actionAt: issueDate },
    ],
  });

  if (existing) {
    if (existing.documentSnapshotJson && existing.documentSnapshotJson !== "{}") return;
    await prisma.testReport.update({
      where: { id: existing.id },
      data: {
        resultsJson: JSON.stringify(results),
        documentSnapshotJson: JSON.stringify(document),
      },
    });
    return;
  }

  const report = await prisma.testReport.create({
    data: {
      reportCode: "RPT-SEED-0001",
      sampleId: sample.id,
      reportVersion: 1,
      issueNumber: 1,
      issueDate,
      issuedBy: "Seed Lab Manager",
      approvedBy: "Seed Lab Manager",
      qaApprovedBy: "Seed QA",
      analystName: signatures.analyst,
      reviewerName: "Seed Reviewer",
      labManagerName: "Seed Lab Manager",
      customerName: sample.request?.customerName ?? "",
      customerAddress: sample.request?.department ?? "",
      customerContact: sample.request?.requesterName ?? "",
      requestCode: sample.request?.requestCode ?? "",
      receivedAt: sample.receivedAt,
      analysisCompletedAt,
      resultsJson: JSON.stringify(results),
      signaturesJson: JSON.stringify(signatures),
      documentSnapshotJson: JSON.stringify(document),
      status: "issued",
      createdBy: "Seed",
    },
  });

  await prisma.reportHistory.create({
    data: {
      reportId: report.id,
      version: 1,
      issueNumber: 1,
      action: "issued",
      actionBy: "Seed",
      reason: "Phát hành lần đầu (demo)",
    },
  });

  await prisma.sample.update({
    where: { id: sample.id },
    data: { status: "ResultIssued" },
  });
}
