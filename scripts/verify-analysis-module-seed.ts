import { db } from "../lib/db";

async function main() {
  const [
    deptCount,
    analystCount,
    assignmentCount,
    taskCount,
    resultCount,
  ] = await Promise.all([
    db.labDepartment.count(),
    db.departmentAnalyst.count(),
    db.analysisAssignment.count(),
    db.analysisTask.count(),
    db.testResult.count(),
  ]);

  console.log(`Departments: ${deptCount}`);
  console.log(`Analysts: ${analystCount}`);
  console.log(`Assignments: ${assignmentCount}`);
  console.log(`Tasks: ${taskCount}`);
  console.log(`Test results: ${resultCount}`);

  const inbox = await db.analysisAssignment.count({ where: { status: "assigned" } });
  const labAccepted = await db.analysisTask.count({ where: { status: "lab_accepted" } });
  const submitted = await db.analysisTask.count({ where: { status: "submitted_for_review" } });
  const worklists = await db.analysisWorklist.count();
  const worksheets = await db.analysisWorksheet.count();
  console.log(`Tasks submitted_for_review: ${submitted}`);
  console.log(`Worklists: ${worklists}`);
  console.log(`Worksheets: ${worksheets}`);

  if (deptCount < 7) throw new Error("Expected at least 7 departments");
  if (analystCount < 14) throw new Error("Expected at least 14 analysts");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
