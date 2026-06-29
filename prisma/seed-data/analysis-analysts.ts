import type { PrismaClient } from "@prisma/client";

const ANALYST_SEED = [
  { dept: "Phòng Hóa lý", analysts: ["Analyst Hóa lý 01", "Analyst Hóa lý 02"] },
  { dept: "Phòng Kim loại nặng", analysts: ["Analyst Kim loại 01", "Analyst Kim loại 02"] },
  { dept: "Phòng Sắc ký", analysts: ["Analyst Sắc ký 01", "Analyst Sắc ký 02"] },
  { dept: "Phòng Vi sinh", analysts: ["Analyst Vi sinh 01", "Analyst Vi sinh 02"] },
  { dept: "Phòng Dinh dưỡng", analysts: ["Analyst Dinh dưỡng 01", "Analyst Dinh dưỡng 02"] },
  { dept: "Phòng Độc tố nấm mốc", analysts: ["Analyst Độc tố 01", "Analyst Độc tố 02"] },
  { dept: "Phòng QA/QC", analysts: ["Analyst QA 01", "Analyst QA 02"] },
];

export async function seedAnalysisAnalysts(prisma: PrismaClient) {
  for (const group of ANALYST_SEED) {
    const dept = await prisma.labDepartment.findUnique({ where: { name: group.dept } });
    if (!dept) continue;
    for (let i = 0; i < group.analysts.length; i++) {
      const name = group.analysts[i]!;
      const code = `A-${dept.sortOrder}-${i + 1}`;
      await prisma.departmentAnalyst.upsert({
        where: { departmentId_code: { departmentId: dept.id, code } },
        create: { departmentId: dept.id, code, name, active: true },
        update: { name, active: true },
      });
    }
  }
}
