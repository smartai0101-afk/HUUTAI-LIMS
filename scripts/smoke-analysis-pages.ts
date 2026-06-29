import { listInboxAssignments } from "../lib/services/analysis/analysis-inbox";
import { listTasksForAnalystAssign } from "../lib/services/analysis/analyst-assignment";
import { listWorklists } from "../lib/services/analysis/worklist";
import { listWorksheets } from "../lib/services/analysis/worksheet";
import { listTestResults } from "../lib/services/analysis/test-results";
import { listTasksForQc } from "../lib/services/analysis/qc-check";
import { listReviewQueue } from "../lib/services/analysis/review";
import { db } from "../lib/db";

async function main() {
  const [inbox, tasks, worklists, worksheets, results, qc, review] = await Promise.all([
    listInboxAssignments(),
    listTasksForAnalystAssign(),
    listWorklists(),
    listWorksheets(),
    listTestResults(),
    listTasksForQc(),
    listReviewQueue(),
  ]);
  console.log("Smoke OK:", {
    inbox: inbox.length,
    tasks: tasks.length,
    worklists: worklists.length,
    worksheets: worksheets.length,
    results: results.length,
    qc: qc.length,
    review: review.length,
  });
}

main()
  .catch((e) => {
    console.error("Smoke FAILED:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
