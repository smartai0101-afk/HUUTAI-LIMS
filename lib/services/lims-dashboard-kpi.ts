import { db } from "@/lib/db";

export async function getLimsIsoKpis() {
  const [
    waitingAssignment,
    inAnalysis,
    waitingReview,
    pendingIssue,
    openDeviations,
    overdueSamples,
  ] = await Promise.all([
    db.sample.count({ where: { status: "WaitingAssignment" } }),
    db.sample.count({ where: { status: "InAnalysis" } }),
    db.sample.count({ where: { status: "WaitingReview" } }),
    db.testReport.count({
      where: { status: "approved", qaApprovedBy: { not: "" } },
    }),
    db.deviation.count({ where: { status: { in: ["open", "investigating"] } } }),
    db.sample.count({
      where: {
        dueDate: { lt: new Date() },
        status: {
          notIn: ["ResultIssued", "Stored", "Disposed", "Rejected", "Completed"],
        },
      },
    }),
  ]);

  return {
    waitingAssignment,
    inAnalysis,
    waitingReview,
    pendingIssue,
    openDeviations,
    overdueSamples,
  };
}
