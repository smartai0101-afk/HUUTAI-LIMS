import { db } from "@/lib/db";
import type { TestCategoryView } from "@/types/catalog";

export async function listTestCategories(activeOnly = true): Promise<TestCategoryView[]> {
  const rows = await db.testCategory.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    sortOrder: r.sortOrder,
    active: r.active,
  }));
}

export async function upsertTestCategory(input: {
  id?: string;
  code: string;
  name: string;
  sortOrder?: number;
  active?: boolean;
}) {
  if (input.id) {
    return db.testCategory.update({
      where: { id: input.id },
      data: {
        code: input.code.trim(),
        name: input.name.trim(),
        sortOrder: input.sortOrder ?? 0,
        active: input.active ?? true,
      },
    });
  }
  return db.testCategory.create({
    data: {
      code: input.code.trim(),
      name: input.name.trim(),
      sortOrder: input.sortOrder ?? 0,
      active: input.active ?? true,
    },
  });
}
