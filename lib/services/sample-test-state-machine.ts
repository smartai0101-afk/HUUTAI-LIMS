import type { SampleTestStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { appendWorkflowEvent } from "@/lib/services/workflow-orchestrator";

type Tx = Prisma.TransactionClient;

export const SAMPLE_TEST_TRANSITIONS: Partial<Record<SampleTestStatus, SampleTestStatus[]>> = {
  Pending: ["Assigned", "Cancelled"],
  Assigned: ["InWorklist", "InProgress", "Cancelled"],
  InWorklist: ["InWorksheet", "Assigned", "Cancelled"],
  InWorksheet: ["Analyzing", "InWorklist", "Cancelled"],
  Analyzing: ["ResultEntered", "Cancelled"],
  InProgress: ["ResultEntered", "Analyzing", "Cancelled"],
  ResultEntered: ["QcPending", "TechReviewPending"],
  QcPending: ["QcPassed", "QcFailed"],
  QcFailed: ["QcPending", "Analyzing", "Cancelled"],
  QcPassed: ["TechReviewPending"],
  TechReviewPending: ["TechApproved", "Analyzing", "Cancelled"],
  TechApproved: ["ReportPending", "Reported"],
  ReportPending: ["Reported"],
  Reported: [],
  Done: ["Reviewed", "TechApproved"],
  Reviewed: ["Reported"],
  Cancelled: [],
};

export function canTransitionSampleTest(from: SampleTestStatus, to: SampleTestStatus): boolean {
  return SAMPLE_TEST_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function transitionSampleTest(
  tx: Tx,
  params: {
    sampleTestId: string;
    sampleId: string;
    from: SampleTestStatus;
    to: SampleTestStatus;
    performedBy: string;
    performedByUserId?: string;
    reason?: string;
  },
) {
  if (!canTransitionSampleTest(params.from, params.to)) {
    throw new Error(`Không thể chuyển trạng thái ${params.from} → ${params.to}`);
  }

  await tx.sampleTest.update({
    where: { id: params.sampleTestId },
    data: { status: params.to },
  });

  await appendWorkflowEvent(tx, {
    sampleId: params.sampleId,
    entityType: "sample_test",
    entityId: params.sampleTestId,
    fromStatus: params.from,
    toStatus: params.to,
    action: "status_transition",
    performedBy: params.performedBy,
    performedByUserId: params.performedByUserId,
    reason: params.reason,
  });
}

export async function syncRequestStatusFromSampleTests(requestId: string) {
  const { db } = await import("@/lib/db");
  const request = await db.sampleRequest.findUnique({
    where: { id: requestId },
    include: {
      sampleLines: { select: { status: true } },
      samples: {
        include: { tests: { select: { status: true } } },
      },
    },
  });
  if (!request) return;

  const terminal: SampleTestStatus[] = ["TechApproved", "Reported", "Reviewed", "Done", "Cancelled"];
  const allTests = request.samples.flatMap((s) => s.tests);
  if (allTests.length === 0) return;

  const approvedCount = allTests.filter((t) => terminal.includes(t.status)).length;
  let newStatus = request.status;

  if (approvedCount === allTests.length) {
    newStatus = "Completed";
  } else if (approvedCount > 0) {
    newStatus = "PartiallyCompleted";
  } else if (request.samples.length > 0) {
    newStatus = "Processing";
  }

  if (newStatus !== request.status) {
    await db.sampleRequest.update({ where: { id: requestId }, data: { status: newStatus } });
  }
}
