import { db } from "../lib/db";
import {
  getSampleAssignmentContext,
  listLabDepartments,
} from "../lib/services/samples/analysis-assignment";

async function main() {
  const depts = await listLabDepartments();
  console.log(`Departments: ${depts.length}`);
  const sample = await db.sample.findFirst({ where: { status: "WaitingAssignment" } });
  if (!sample) {
    console.log("No WaitingAssignment sample found");
    return;
  }
  const ctx = await getSampleAssignmentContext(sample.id);
  console.log(`${ctx?.sampleCode} pool=${ctx?.parameterPool.length} assignments=${ctx?.assignments.length}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
