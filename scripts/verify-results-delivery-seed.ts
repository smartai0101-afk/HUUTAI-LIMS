import { db } from "@/lib/db";
import { parseDocumentSnapshot } from "@/lib/mappers/result-delivery";

async function main() {
  const issued = await db.testReport.findMany({
    where: { reportCode: { startsWith: "RPT-" } },
    include: { history: true, sample: { select: { sampleCode: true, status: true } } },
  });

  console.assert(issued.length >= 1, `Expected >= 1 test report, got ${issued.length}`);

  const seedReport = issued.find((r) => r.reportCode === "RPT-SEED-0001");
  console.assert(seedReport, "Expected demo report RPT-SEED-0001");
  console.assert(
    seedReport?.status === "issued",
    `Expected issued status, got ${seedReport?.status}`,
  );
  console.assert(
    seedReport?.sample?.status === "ResultIssued",
    `Expected sample ResultIssued, got ${seedReport?.sample?.status}`,
  );
  console.assert(
    (seedReport?.history.length ?? 0) >= 1,
    "Expected at least one history entry",
  );

  const document = seedReport ? parseDocumentSnapshot(seedReport.documentSnapshotJson) : null;
  console.assert(document, "Expected documentSnapshotJson on seed report");
  if (seedReport) {
    const results = JSON.parse(seedReport.resultsJson) as unknown[];
    console.assert(results.length >= 1, "Expected at least one result row");
  }

  const pendingCompleted = await db.sample.count({
    where: {
      status: "Completed",
      analysisTasks: { every: { status: "approved" } },
    },
  });
  console.log(`Completed samples ready for release check: ${pendingCompleted}`);

  console.log("verify-results-delivery-seed: PASS");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
