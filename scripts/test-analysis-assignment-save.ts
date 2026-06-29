import { db } from "../lib/db";
import {
  assignAnalysisGroups,
  listLabDepartments,
} from "../lib/services/samples/analysis-assignment";

async function main() {
  const sample = await db.sample.findFirst({
    where: { sampleCode: "SPL-20260629-0003" },
  });
  if (!sample) throw new Error("Sample 0003 not found");

  const depts = await listLabDepartments();
  const hoaLy = depts.find((d) => d.name === "Phòng Hóa lý")!;
  const kimLoai = depts.find((d) => d.name === "Phòng Kim loại nặng")!;
  const sacKy = depts.find((d) => d.name === "Phòng Sắc ký")!;

  await assignAnalysisGroups(
    {
      sampleId: sample.id,
      groups: [
        {
          parameterGroup: "Chỉ số hóa lý",
          parameters: ["Chỉ số acid", "Chỉ số peroxide"],
          departmentId: hoaLy.id,
          managerId: hoaLy.managers[0]!.id,
          dueDate: "2026-07-15",
        },
        {
          parameterGroup: "Kim loại nặng",
          parameters: ["Pb", "As"],
          departmentId: kimLoai.id,
          managerId: kimLoai.managers[0]!.id,
          dueDate: "2026-07-15",
        },
        {
          parameterGroup: "Dung môi tồn dư",
          parameters: ["Dung môi tồn dư"],
          departmentId: sacKy.id,
          managerId: sacKy.managers[0]!.id,
          dueDate: "2026-07-15",
        },
      ],
    },
    "QA Test",
  );

  const updated = await db.sample.findUnique({
    where: { id: sample.id },
    include: { analysisAssignments: true },
  });
  console.log(`Status: ${updated?.status}, assignedTo: ${updated?.assignedTo}`);
  console.log(`Groups: ${updated?.analysisAssignments.length}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
