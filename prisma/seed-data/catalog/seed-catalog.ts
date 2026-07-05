import type { PrismaClient } from "@prisma/client";
import {
  SEED_CATEGORIES,
  SEED_MATRICES,
  SEED_MATRIX_GROUPS,
  SEED_PACKAGES,
  SEED_TEST_METHODS,
} from "./catalog-data";

function slugCode(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase()
    .slice(0, 40);
}

async function backfillMatrixGroupsFromLegacy(prisma: PrismaClient) {
  const legacy = await prisma.sampleMatrix.findMany({
    where: { groupId: null, deletedAt: null },
    select: { id: true, groupName: true },
  });
  const names = [...new Set(legacy.map((r) => r.groupName.trim()).filter(Boolean))];
  for (const name of names) {
    const code = slugCode(name) || `GRP_${name.slice(0, 8)}`;
    const group = await prisma.sampleMatrixGroup.upsert({
      where: { code },
      create: { code, name, sortOrder: 50, active: true },
      update: { name, active: true, deletedAt: null },
    });
    await prisma.sampleMatrix.updateMany({
      where: { groupName: name, groupId: null },
      data: { groupId: group.id },
    });
  }
}

export async function seedLimsCatalog(prisma: PrismaClient) {
  console.log("Seeding LIMS catalog (matrix groups, matrices, test methods, packages)...");

  for (const g of SEED_MATRIX_GROUPS) {
    await prisma.sampleMatrixGroup.upsert({
      where: { code: g.code },
      create: { ...g, active: true },
      update: { name: g.name, sortOrder: g.sortOrder, active: true, deletedAt: null },
    });
  }

  const groups = await prisma.sampleMatrixGroup.findMany();
  const groupByCode = new Map(groups.map((g) => [g.code, g]));

  for (const m of SEED_MATRICES) {
    const group = groupByCode.get(m.groupCode);
    await prisma.sampleMatrix.upsert({
      where: { code: m.code },
      create: {
        code: m.code,
        name: m.name,
        groupId: group?.id ?? null,
        groupName: group?.name ?? "",
        sortOrder: m.sortOrder,
        active: true,
      },
      update: {
        name: m.name,
        groupId: group?.id ?? null,
        groupName: group?.name ?? "",
        sortOrder: m.sortOrder,
        active: true,
        deletedAt: null,
      },
    });
  }

  await backfillMatrixGroupsFromLegacy(prisma);

  for (const c of SEED_CATEGORIES) {
    await prisma.testCategory.upsert({
      where: { code: c.code },
      create: { ...c, active: true },
      update: { name: c.name, sortOrder: c.sortOrder, active: true },
    });
  }

  const categories = await prisma.testCategory.findMany();
  const catByCode = new Map(categories.map((c) => [c.code, c.id]));
  const matrices = await prisma.sampleMatrix.findMany();
  const matrixByCode = new Map(matrices.map((m) => [m.code, m.id]));

  for (const tm of SEED_TEST_METHODS) {
    const categoryId = catByCode.get(tm.categoryCode);
    if (!categoryId) continue;

    const testMethod = await prisma.testMethod.upsert({
      where: { code: tm.code },
      create: {
        code: tm.code,
        name: tm.name,
        categoryId,
        defaultUnit: tm.defaultUnit,
        resultType: tm.resultType,
        lod: tm.lod ?? "",
        loq: tm.loq ?? "",
        estimatedMinutes: tm.estimatedMinutes ?? null,
        active: true,
      },
      update: {
        name: tm.name,
        categoryId,
        defaultUnit: tm.defaultUnit,
        resultType: tm.resultType,
        lod: tm.lod ?? "",
        loq: tm.loq ?? "",
        estimatedMinutes: tm.estimatedMinutes ?? null,
        active: true,
      },
    });

    for (const matrixCode of tm.matrixCodes ?? []) {
      const matrixId = matrixByCode.get(matrixCode);
      if (!matrixId) continue;
      await prisma.matrixTestMapping.upsert({
        where: { matrixId_testMethodId: { matrixId, testMethodId: testMethod.id } },
        create: { matrixId, testMethodId: testMethod.id, isRecommended: true },
        update: { isRecommended: true },
      });
    }
  }

  const testMethods = await prisma.testMethod.findMany();
  const tmByCode = new Map(testMethods.map((t) => [t.code, t.id]));

  for (const pkg of SEED_PACKAGES) {
    const matrixId = matrixByCode.get(pkg.matrixCode) ?? null;
    const packageRow = await prisma.testPackage.upsert({
      where: { code: pkg.code },
      create: { code: pkg.code, name: pkg.name, matrixId, active: true },
      update: { name: pkg.name, matrixId, active: true },
    });

    await prisma.testPackageItem.deleteMany({ where: { packageId: packageRow.id } });
    let sortOrder = 0;
    for (const code of pkg.testMethodCodes) {
      const testMethodId = tmByCode.get(code);
      if (!testMethodId) continue;
      await prisma.testPackageItem.create({
        data: { packageId: packageRow.id, testMethodId, sortOrder: sortOrder++ },
      });
    }
  }

  console.log("LIMS catalog seed complete.");
}
