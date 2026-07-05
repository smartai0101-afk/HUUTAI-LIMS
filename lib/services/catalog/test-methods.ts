import type { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import type { TestMethodMethodLink, TestMethodView } from "@/types/catalog";

const methodLinkInclude = {
  method: { select: { id: true, methodCode: true, methodName: true } },
} satisfies Prisma.AnalyticalMethodTestMethodInclude;

const testMethodInclude = {
  category: true,
  defaultMethod: { select: { methodCode: true, methodName: true } },
  responsibleDept: { select: { name: true } },
  methodLinks: {
    include: methodLinkInclude,
    orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
  },
} satisfies Prisma.TestMethodInclude;

function mapMethodLinks(
  links: Prisma.TestMethodGetPayload<{ include: typeof testMethodInclude }>["methodLinks"],
): TestMethodMethodLink[] {
  return links.map((link) => ({
    methodId: link.method.id,
    methodCode: link.method.methodCode,
    methodName: link.method.methodName,
    unit: link.unit,
    lod: link.lod,
    loq: link.loq,
    isPrimary: link.isPrimary,
    sortOrder: link.sortOrder,
  }));
}

function mapTestMethod(row: Prisma.TestMethodGetPayload<{ include: typeof testMethodInclude }>): TestMethodView {
  const methodLinks = mapMethodLinks(row.methodLinks);
  const primary = methodLinks.find((l) => l.isPrimary) ?? methodLinks[0];
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    categoryId: row.categoryId,
    categoryCode: row.category.code,
    categoryName: row.category.name,
    defaultUnit: row.defaultUnit,
    resultType: row.resultType,
    lod: row.lod,
    loq: row.loq,
    estimatedMinutes: row.estimatedMinutes,
    price: row.price,
    methodLinks,
    defaultMethodId: primary?.methodId ?? row.defaultMethodId,
    defaultMethodCode: primary?.methodCode ?? row.defaultMethod?.methodCode ?? null,
    defaultMethodName: primary?.methodName ?? row.defaultMethod?.methodName ?? null,
    responsibleDeptId: row.responsibleDeptId,
    responsibleDeptName: row.responsibleDept?.name ?? null,
    active: row.active,
  };
}

export type TestMethodRow = TestMethodView & {
  usageCount: number;
};

export type TestMethodMethodLinkInput = {
  methodId: string;
  unit?: string;
  lod?: string;
  loq?: string;
  isPrimary?: boolean;
  sortOrder?: number;
};

export async function listTestMethods(activeOnly = true): Promise<TestMethodView[]> {
  const rows = await listTestMethodsWithStats(activeOnly);
  return rows.map(({ usageCount: _usageCount, ...rest }) => rest);
}

export async function listTestMethodsWithStats(activeOnly = true): Promise<TestMethodRow[]> {
  const rows = await db.testMethod.findMany({
    where: activeOnly ? { active: true, deletedAt: null } : { deletedAt: null },
    include: testMethodInclude,
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });

  const usageCounts = await db.requestSampleLineTest.groupBy({
    by: ["testMethodId"],
    _count: { _all: true },
  });
  const usageByMethod = new Map(usageCounts.map((c) => [c.testMethodId, c._count._all]));

  return rows.map((r) => ({
    ...mapTestMethod(r),
    usageCount: usageByMethod.get(r.id) ?? 0,
  }));
}

export async function listTestMethodsForMatrix(matrixId: string): Promise<TestMethodView[]> {
  const mappings = await db.matrixTestMapping.findMany({
    where: { matrixId },
    include: {
      testMethod: { include: testMethodInclude },
    },
  });
  return mappings
    .filter((m) => m.testMethod.active && !m.testMethod.deletedAt)
    .map((m) => mapTestMethod(m.testMethod))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName) || a.name.localeCompare(b.name));
}

export async function isTestMethodValidForMatrix(matrixId: string, testMethodId: string): Promise<boolean> {
  const mapping = await db.matrixTestMapping.findUnique({
    where: { matrixId_testMethodId: { matrixId, testMethodId } },
  });
  return Boolean(mapping);
}

export async function resolvePrimaryMethodForTestMethod(testMethodId: string): Promise<{
  methodId: string | null;
  methodVersionId: string | null;
}> {
  const link = await db.analyticalMethodTestMethod.findFirst({
    where: { testMethodId },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    include: { method: { select: { id: true, currentVersionId: true } } },
  });
  if (link) {
    return {
      methodId: link.method.id,
      methodVersionId: link.method.currentVersionId,
    };
  }

  const tm = await db.testMethod.findUnique({
    where: { id: testMethodId },
    select: {
      defaultMethodId: true,
      defaultMethod: { select: { currentVersionId: true } },
    },
  });
  return {
    methodId: tm?.defaultMethodId ?? null,
    methodVersionId: tm?.defaultMethod?.currentVersionId ?? null,
  };
}

function normalizeMethodLinks(links: TestMethodMethodLinkInput[]): TestMethodMethodLinkInput[] {
  const unique = new Map<string, TestMethodMethodLinkInput>();
  for (const link of links) {
    if (!link.methodId) continue;
    unique.set(link.methodId, link);
  }
  const list = [...unique.values()];
  if (list.length === 0) return [];

  let primaryIndex = list.findIndex((l) => l.isPrimary);
  if (primaryIndex < 0) primaryIndex = 0;
  return list.map((link, index) => ({
    ...link,
    isPrimary: index === primaryIndex,
    sortOrder: link.sortOrder ?? index,
  }));
}

export async function syncTestMethodMethodLinks(
  testMethodId: string,
  links: TestMethodMethodLinkInput[],
  defaults?: { defaultUnit?: string; defaultLoq?: string; lod?: string },
) {
  const normalized = normalizeMethodLinks(links);
  const methodIds = normalized.map((l) => l.methodId);

  if (methodIds.length > 0) {
    const methods = await db.analyticalMethod.findMany({
      where: { id: { in: methodIds } },
      select: { id: true },
    });
    if (methods.length !== methodIds.length) {
      throw new Error("Một hoặc nhiều phương pháp thử không hợp lệ");
    }
  }

  const tm = await db.testMethod.findUnique({
    where: { id: testMethodId },
    select: { defaultUnit: true, lod: true, loq: true },
  });
  if (!tm) throw new Error("Không tìm thấy chỉ tiêu");

  const fallbackUnit = defaults?.defaultUnit ?? tm.defaultUnit;
  const fallbackLod = defaults?.lod ?? tm.lod;
  const fallbackLoq = defaults?.defaultLoq ?? tm.loq;

  await db.$transaction(async (tx) => {
    await tx.analyticalMethodTestMethod.deleteMany({ where: { testMethodId } });

    if (normalized.length > 0) {
      await tx.analyticalMethodTestMethod.createMany({
        data: normalized.map((link) => ({
          id: randomUUID(),
          methodId: link.methodId,
          testMethodId,
          unit: link.unit?.trim() ?? fallbackUnit,
          lod: link.lod?.trim() ?? fallbackLod,
          loq: link.loq?.trim() ?? fallbackLoq,
          sortOrder: link.sortOrder ?? 0,
          isPrimary: Boolean(link.isPrimary),
        })),
      });
    }

    const primary = normalized.find((l) => l.isPrimary) ?? normalized[0];
    await tx.testMethod.update({
      where: { id: testMethodId },
      data: { defaultMethodId: primary?.methodId ?? null },
    });
  });
}

export async function syncPrimaryMethodLink(
  testMethodId: string,
  methodId: string | null,
  unit?: string,
  lod?: string,
) {
  if (!methodId) {
    await syncTestMethodMethodLinks(testMethodId, []);
    return;
  }

  const existing = await db.analyticalMethodTestMethod.findMany({
    where: { testMethodId },
    include: methodLinkInclude,
  });

  const tm = await db.testMethod.findUnique({
    where: { id: testMethodId },
    select: { defaultUnit: true, lod: true, loq: true },
  });
  if (!tm) throw new Error("Không tìm thấy chỉ tiêu");

  const links: TestMethodMethodLinkInput[] = existing
    .filter((l) => l.methodId !== methodId)
    .map((l) => ({
      methodId: l.methodId,
      unit: l.unit,
      lod: l.lod,
      loq: l.loq,
      isPrimary: false,
      sortOrder: l.sortOrder,
    }));

  links.unshift({
    methodId,
    unit: unit ?? tm.defaultUnit,
    lod: lod ?? tm.lod,
    loq: tm.loq,
    isPrimary: true,
    sortOrder: 0,
  });

  await syncTestMethodMethodLinks(testMethodId, links);
}

export async function upsertTestMethod(input: {
  id?: string;
  code: string;
  name: string;
  categoryId: string;
  defaultUnit?: string;
  resultType?: import("@prisma/client").TestResultType;
  lod?: string;
  loq?: string;
  estimatedMinutes?: number | null;
  price?: number | null;
  responsibleDeptId?: string | null;
  active?: boolean;
  methodLinks?: TestMethodMethodLinkInput[];
}) {
  const data = {
    code: input.code.trim(),
    name: input.name.trim(),
    categoryId: input.categoryId,
    defaultUnit: input.defaultUnit?.trim() ?? "",
    resultType: input.resultType ?? "numeric",
    lod: input.lod?.trim() ?? "",
    loq: input.loq?.trim() ?? "",
    estimatedMinutes: input.estimatedMinutes ?? null,
    price: input.price ?? null,
    responsibleDeptId: input.responsibleDeptId ?? null,
    active: input.active ?? true,
  };

  const duplicateCode = await db.testMethod.findFirst({
    where: {
      code: data.code,
      ...(input.id ? { NOT: { id: input.id } } : {}),
    },
  });
  if (duplicateCode) {
    throw new Error("Mã chỉ tiêu đã tồn tại, vui lòng dùng mã khác");
  }

  let testMethodId: string;
  if (input.id) {
    const row = await db.testMethod.update({ where: { id: input.id }, data });
    testMethodId = row.id;
  } else {
    const row = await db.testMethod.create({ data });
    testMethodId = row.id;
  }

  if (input.methodLinks !== undefined) {
    await syncTestMethodMethodLinks(testMethodId, input.methodLinks, {
      defaultUnit: data.defaultUnit,
      lod: data.lod,
      defaultLoq: data.loq,
    });
  }

  return db.testMethod.findUniqueOrThrow({
    where: { id: testMethodId },
    include: testMethodInclude,
  });
}

export async function setMatrixTestMappings(matrixId: string, testMethodIds: string[]) {
  await db.matrixTestMapping.deleteMany({ where: { matrixId } });
  if (testMethodIds.length === 0) return;
  await db.matrixTestMapping.createMany({
    data: testMethodIds.map((testMethodId) => ({ matrixId, testMethodId, isRecommended: true })),
  });
}

export async function softDeleteTestMethod(id: string) {
  return db.testMethod.update({
    where: { id },
    data: { deletedAt: new Date(), active: false },
  });
}

export async function hardDeleteTestMethod(id: string) {
  const requestLineCount = await db.requestSampleLineTest.count({ where: { testMethodId: id } });
  if (requestLineCount > 0) {
    throw new Error(
      `Không thể xóa: chỉ tiêu đang được dùng ở ${requestLineCount} dòng phiếu YC. Hãy ẩn thay vì xóa.`,
    );
  }

  const method = await db.testMethod.findUnique({ where: { id } });
  if (!method) throw new Error("Không tìm thấy chỉ tiêu.");

  return db.testMethod.delete({ where: { id } });
}

export type TestMethodBulkPatch = {
  categoryId?: string;
  defaultMethodId?: string | null;
  defaultUnit?: string;
  lod?: string;
};

export async function bulkSoftDeleteTestMethods(ids: string[]) {
  if (ids.length === 0) return { hidden: 0 };
  await db.testMethod.updateMany({
    where: { id: { in: ids } },
    data: { deletedAt: new Date(), active: false },
  });
  return { hidden: ids.length };
}

export async function bulkHardDeleteTestMethods(ids: string[]) {
  const skipped: { id: string; reason: string }[] = [];
  let deleted = 0;
  for (const id of ids) {
    try {
      await hardDeleteTestMethod(id);
      deleted += 1;
    } catch (e) {
      skipped.push({
        id,
        reason: e instanceof Error ? e.message : "Không thể xóa chỉ tiêu",
      });
    }
  }
  return { deleted, skipped };
}

export async function bulkUpdateTestMethods(ids: string[], patch: TestMethodBulkPatch) {
  let updated = 0;
  for (const id of ids) {
    const current = await db.testMethod.findUnique({ where: { id } });
    if (!current) continue;

    const nextUnit = patch.defaultUnit !== undefined ? patch.defaultUnit : current.defaultUnit;
    const nextLod = patch.lod !== undefined ? patch.lod : current.lod;

    await upsertTestMethod({
      id,
      code: current.code,
      name: current.name,
      categoryId: patch.categoryId ?? current.categoryId,
      defaultUnit: nextUnit,
      resultType: current.resultType,
      lod: nextLod,
      loq: current.loq,
      estimatedMinutes: current.estimatedMinutes,
      price: current.price,
      responsibleDeptId: current.responsibleDeptId,
      active: current.active,
    });

    if (patch.defaultMethodId !== undefined) {
      await syncPrimaryMethodLink(id, patch.defaultMethodId, nextUnit, nextLod);
    }

    updated += 1;
  }
  return { updated };
}
