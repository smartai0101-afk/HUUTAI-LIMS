import { db } from "@/lib/db";
import {
  DEMO_REQUEST_PREFIX,
  DEMO_SAMPLE_PREFIX,
  EXPECTED_SAMPLE_STATUS_COUNTS,
} from "../prisma/seed-data/samples/sample-definitions";

async function main() {
  const requests = await db.sampleRequest.findMany({
    where: { requestCode: { startsWith: DEMO_REQUEST_PREFIX } },
    select: { requestCode: true, status: true },
    orderBy: { requestCode: "asc" },
  });

  const samples = await db.sample.findMany({
    where: { sampleCode: { startsWith: DEMO_SAMPLE_PREFIX } },
    select: { sampleCode: true, status: true, assignedTo: true },
    orderBy: { sampleCode: "asc" },
  });

  console.assert(requests.length === 10, `Expected 10 requests, got ${requests.length}`);
  console.assert(samples.length === 10, `Expected 10 samples, got ${samples.length}`);

  const statusCounts: Record<string, number> = {};
  for (const s of samples) {
    statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1;
  }

  for (const [status, expected] of Object.entries(EXPECTED_SAMPLE_STATUS_COUNTS)) {
    const actual = statusCounts[status] ?? 0;
    console.assert(
      actual === expected,
      `Status ${status}: expected ${expected}, got ${actual}`,
    );
  }

  const storageCount = await db.sampleStorageRecord.count({
    where: { sample: { sampleCode: { startsWith: DEMO_SAMPLE_PREFIX } } },
  });
  console.assert(storageCount >= 4, `Expected >= 4 storage records, got ${storageCount}`);

  const disposed = samples.filter((s) => s.status === "Disposed");
  console.assert(disposed.length === 1, `Expected 1 disposed sample, got ${disposed.length}`);

  const assignedWithTests = await db.sample.count({
    where: {
      sampleCode: { startsWith: DEMO_SAMPLE_PREFIX },
      status: { in: ["Assigned", "InAnalysis", "Stored", "Disposed"] },
      tests: { some: {} },
    },
  });
  console.assert(
    assignedWithTests >= 5,
    `Expected >= 5 samples with tests, got ${assignedWithTests}`,
  );

  const assignEligible = await db.sample.count({
    where: {
      sampleCode: { startsWith: DEMO_SAMPLE_PREFIX },
      status: { in: ["Received", "WaitingAssignment", "Assigned"] },
    },
  });
  console.assert(assignEligible >= 3, `Expected >= 3 assign-eligible samples, got ${assignEligible}`);

  const trackingEligible = await db.sample.count({
    where: {
      sampleCode: { startsWith: DEMO_SAMPLE_PREFIX },
      status: { notIn: ["Stored", "Disposed", "Rejected"] },
    },
  });
  console.assert(trackingEligible >= 5, `Expected >= 5 tracking samples, got ${trackingEligible}`);

  console.log("verify-samples-seed: PASS");
  console.log("Requests:", requests.map((r) => r.requestCode).join(", "));
  console.log("Sample statuses:", statusCounts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
