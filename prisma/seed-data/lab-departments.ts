export type LabDepartmentSeed = {
  name: string;
  sortOrder: number;
  manager: {
    name: string;
    title: string;
    isDefault?: boolean;
  };
};

export const LAB_DEPARTMENT_SEED: LabDepartmentSeed[] = [
  {
    name: "Phòng Hóa lý",
    sortOrder: 1,
    manager: { name: "Nguyễn Hoàng Nam", title: "Trưởng phòng Hóa lý" },
  },
  {
    name: "Phòng Kim loại nặng",
    sortOrder: 2,
    manager: { name: "Lê Quốc Huy", title: "Trưởng phòng Kim loại nặng" },
  },
  {
    name: "Phòng Sắc ký",
    sortOrder: 3,
    manager: { name: "Trần Minh Đức", title: "Trưởng phòng Sắc ký" },
  },
  {
    name: "Phòng Vi sinh",
    sortOrder: 4,
    manager: { name: "Phạm Thị Mai", title: "Trưởng phòng Vi sinh" },
  },
  {
    name: "Phòng Dinh dưỡng",
    sortOrder: 5,
    manager: { name: "Võ Thanh Bình", title: "Trưởng phòng Dinh dưỡng" },
  },
  {
    name: "Phòng Độc tố nấm mốc",
    sortOrder: 6,
    manager: { name: "Đặng Thu Hà", title: "Trưởng phòng Độc tố nấm mốc" },
  },
  {
    name: "Phòng QA/QC",
    sortOrder: 7,
    manager: { name: "Bùi Ngọc Lan", title: "QA Manager" },
  },
];

export async function seedLabDepartments(prisma: {
  labDepartment: {
    upsert: (args: {
      where: { name: string };
      create: { name: string; sortOrder: number };
      update: { sortOrder: number };
    }) => Promise<{ id: string; name: string }>;
  };
  departmentManager: {
    deleteMany: (args: { where: { departmentId: string } }) => Promise<unknown>;
    create: (args: {
      data: {
        departmentId: string;
        name: string;
        title: string;
        isDefault: boolean;
      };
    }) => Promise<unknown>;
  };
}) {
  for (const dept of LAB_DEPARTMENT_SEED) {
    const row = await prisma.labDepartment.upsert({
      where: { name: dept.name },
      create: { name: dept.name, sortOrder: dept.sortOrder },
      update: { sortOrder: dept.sortOrder },
    });
    await prisma.departmentManager.deleteMany({ where: { departmentId: row.id } });
    await prisma.departmentManager.create({
      data: {
        departmentId: row.id,
        name: dept.manager.name,
        title: dept.manager.title,
        isDefault: dept.manager.isDefault ?? true,
      },
    });
  }
}
