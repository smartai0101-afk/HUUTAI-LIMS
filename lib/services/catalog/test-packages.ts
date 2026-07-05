import { db } from "@/lib/db";
import type { TestPackageView } from "@/types/catalog";

export async function listTestPackages(matrixId?: string | null): Promise<TestPackageView[]> {
  const rows = await db.testPackage.findMany({
    where: {
      active: true,
      deletedAt: null,
      ...(matrixId ? { OR: [{ matrixId }, { matrixId: null }] } : {}),
    },
    include: {
      matrix: { select: { name: true } },
      items: {
        include: { testMethod: { select: { id: true, name: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    matrixId: r.matrixId,
    matrixName: r.matrix?.name ?? null,
    testMethodIds: r.items.map((i) => i.testMethodId),
    testMethodNames: r.items.map((i) => i.testMethod.name),
    active: r.active,
  }));
}

export async function getTestPackageTestMethodIds(packageId: string): Promise<string[]> {
  const items = await db.testPackageItem.findMany({
    where: { packageId },
    orderBy: { sortOrder: "asc" },
    select: { testMethodId: true },
  });
  return items.map((i) => i.testMethodId);
}
