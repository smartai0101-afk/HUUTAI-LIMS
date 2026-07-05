import type { Prisma, RequestPriority } from "@prisma/client";
import { db } from "@/lib/db";
import { isTestMethodValidForMatrix, resolvePrimaryMethodForTestMethod } from "@/lib/services/catalog/test-methods";
import type { RequestSampleLineView, SampleTestMatrixView } from "@/types/catalog";

const lineInclude = {
  matrix: { select: { code: true, name: true } },
  tests: {
    include: {
      testMethod: {
        include: {
          category: { select: { name: true } },
          defaultMethod: { select: { methodCode: true } },
        },
      },
      method: { select: { methodCode: true } },
    },
    orderBy: { testMethod: { name: "asc" } },
  },
} satisfies Prisma.RequestSampleLineInclude;

type LineRow = Prisma.RequestSampleLineGetPayload<{ include: typeof lineInclude }>;

function mapLine(row: LineRow): RequestSampleLineView {
  return {
    id: row.id,
    lineNo: row.lineNo,
    tempCode: row.tempCode,
    sampleName: row.sampleName,
    matrixId: row.matrixId,
    matrixCode: row.matrix?.code ?? null,
    matrixName: row.matrix?.name ?? null,
    sampleType: row.sampleType,
    quantity: row.quantity,
    unit: row.unit,
    conditionNote: row.conditionNote,
    status: row.status,
    sampleId: row.sampleId,
    tests: row.tests.map((t) => ({
      id: t.id,
      testMethodId: t.testMethodId,
      testMethodCode: t.testMethod.code,
      testMethodName: t.testMethod.name,
      categoryName: t.testMethod.category.name,
      defaultUnit: t.testMethod.defaultUnit,
      methodId: t.methodId,
      methodCode: t.method?.methodCode ?? t.testMethod.defaultMethod?.methodCode ?? null,
      priority: t.priority,
      note: t.note,
    })),
  };
}

export async function listRequestSampleLines(requestId: string): Promise<RequestSampleLineView[]> {
  const rows = await db.requestSampleLine.findMany({
    where: { requestId },
    include: lineInclude,
    orderBy: { lineNo: "asc" },
  });
  return rows.map(mapLine);
}

export async function listDraftLinesForReceive(requestId: string): Promise<RequestSampleLineView[]> {
  const rows = await db.requestSampleLine.findMany({
    where: { requestId, status: "draft" },
    include: lineInclude,
    orderBy: { lineNo: "asc" },
  });
  return rows.map(mapLine);
}

export async function getSampleTestMatrixView(requestId: string): Promise<SampleTestMatrixView> {
  const lines = await listRequestSampleLines(requestId);
  const matrixIds = [...new Set(lines.map((l) => l.matrixId).filter(Boolean))] as string[];

  const allTestMethods = matrixIds.length
    ? (
        await Promise.all(matrixIds.map((id) => import("@/lib/services/catalog/test-methods").then((m) => m.listTestMethodsForMatrix(id))))
      ).flat()
    : await import("@/lib/services/catalog/test-methods").then((m) => m.listTestMethods());

  const uniqueTests = new Map(allTestMethods.map((t) => [t.id, t]));
  const testMethods = [...uniqueTests.values()].sort(
    (a, b) => a.categoryName.localeCompare(b.categoryName) || a.name.localeCompare(b.name),
  );

  const cells: SampleTestMatrixView["cells"] = [];
  for (const line of lines) {
    for (const tm of testMethods) {
      const selected = line.tests.some((t) => t.testMethodId === tm.id);
      let valid = true;
      if (line.matrixId && selected) {
        valid = await isTestMethodValidForMatrix(line.matrixId, tm.id);
      }
      cells.push({ lineId: line.id, testMethodId: tm.id, selected, valid });
    }
  }

  return { lines, testMethods, cells };
}

export type RequestSampleLineInput = {
  id?: string;
  tempCode?: string;
  sampleName: string;
  matrixId?: string | null;
  sampleType?: string;
  quantity?: number | null;
  unit?: string;
  conditionNote?: string;
  testMethodIds?: string[];
};

export async function upsertRequestSampleLines(requestId: string, lines: RequestSampleLineInput[]) {
  return db.$transaction(async (tx) => {
    const existing = await tx.requestSampleLine.findMany({
      where: { requestId },
      select: { id: true, status: true },
    });
    const keepIds = new Set(lines.filter((l) => l.id).map((l) => l.id!));

    for (const ex of existing) {
      if (!keepIds.has(ex.id) && ex.status === "draft") {
        await tx.requestSampleLineTest.deleteMany({ where: { lineId: ex.id } });
        await tx.requestSampleLine.delete({ where: { id: ex.id } });
      }
    }

    let lineNo = 1;
    for (const line of lines) {
      const data = {
        lineNo: lineNo++,
        tempCode: line.tempCode?.trim() ?? `TMP-${String(lineNo - 1).padStart(3, "0")}`,
        sampleName: line.sampleName.trim(),
        matrixId: line.matrixId || null,
        sampleType: line.sampleType?.trim() ?? "",
        quantity: line.quantity ?? null,
        unit: line.unit?.trim() ?? "",
        conditionNote: line.conditionNote?.trim() ?? "",
      };

      let lineId: string;
      if (line.id) {
        await tx.requestSampleLine.update({ where: { id: line.id }, data });
        lineId = line.id;
      } else {
        const created = await tx.requestSampleLine.create({
          data: { ...data, requestId, status: "draft" },
        });
        lineId = created.id;
      }

      if (line.testMethodIds) {
        await tx.requestSampleLineTest.deleteMany({ where: { lineId } });
        for (const testMethodId of line.testMethodIds) {
          if (line.matrixId) {
            const valid = await tx.matrixTestMapping.findUnique({
              where: { matrixId_testMethodId: { matrixId: line.matrixId, testMethodId } },
            });
            if (!valid) continue;
          }
          const primary = await resolvePrimaryMethodForTestMethod(testMethodId);
          await tx.requestSampleLineTest.create({
            data: {
              lineId,
              testMethodId,
              methodId: primary.methodId,
              methodVersionId: primary.methodVersionId,
            },
          });
        }
      }
    }

    const count = await tx.requestSampleLine.count({ where: { requestId, status: "draft" } });
    await tx.sampleRequest.update({
      where: { id: requestId },
      data: { sampleCount: Math.max(count, 1) },
    });
  });
}

export async function setLineTests(
  lineId: string,
  testMethodIds: string[],
  options?: { replace?: boolean },
) {
  const line = await db.requestSampleLine.findUnique({ where: { id: lineId } });
  if (!line || line.status !== "draft") throw new Error("Không thể sửa chỉ tiêu của dòng đã tiếp nhận");

  if (options?.replace !== false) {
    await db.requestSampleLineTest.deleteMany({ where: { lineId } });
  }

  for (const testMethodId of testMethodIds) {
    if (line.matrixId) {
      const valid = await isTestMethodValidForMatrix(line.matrixId, testMethodId);
      if (!valid) continue;
    }
    const primary = await resolvePrimaryMethodForTestMethod(testMethodId);
    await db.requestSampleLineTest.upsert({
      where: { lineId_testMethodId: { lineId, testMethodId } },
      create: {
        lineId,
        testMethodId,
        methodId: primary.methodId,
        methodVersionId: primary.methodVersionId,
      },
      update: {},
    });
  }
}

export async function bulkApplyTestsToLines(
  requestId: string,
  testMethodIds: string[],
  filter?: { matrixId?: string; lineIds?: string[] },
) {
  const lines = await db.requestSampleLine.findMany({
    where: {
      requestId,
      status: "draft",
      ...(filter?.matrixId ? { matrixId: filter.matrixId } : {}),
      ...(filter?.lineIds?.length ? { id: { in: filter.lineIds } } : {}),
    },
  });
  for (const line of lines) {
    await setLineTests(line.id, testMethodIds, { replace: false });
  }
}

export async function copyTestsFromLine(sourceLineId: string, targetLineIds: string[]) {
  const source = await db.requestSampleLineTest.findMany({ where: { lineId: sourceLineId } });
  const testMethodIds = source.map((t) => t.testMethodId);
  for (const targetId of targetLineIds) {
    await setLineTests(targetId, testMethodIds, { replace: true });
  }
}

export async function duplicateRequestSampleLine(lineId: string) {
  const line = await db.requestSampleLine.findUnique({
    where: { id: lineId },
    include: { tests: true },
  });
  if (!line) throw new Error("Không tìm thấy dòng mẫu");

  const maxLine = await db.requestSampleLine.aggregate({
    where: { requestId: line.requestId },
    _max: { lineNo: true },
  });

  return db.requestSampleLine.create({
    data: {
      requestId: line.requestId,
      lineNo: (maxLine._max.lineNo ?? 0) + 1,
      tempCode: `${line.tempCode}-COPY`,
      sampleName: `${line.sampleName} (bản sao)`,
      matrixId: line.matrixId,
      sampleType: line.sampleType,
      quantity: line.quantity,
      unit: line.unit,
      conditionNote: line.conditionNote,
      status: "draft",
      tests: {
        create: line.tests.map((t) => ({
          testMethodId: t.testMethodId,
          methodId: t.methodId,
          methodVersionId: t.methodVersionId,
          priority: t.priority,
          note: t.note,
        })),
      },
    },
  });
}

export async function validateRequestForSubmit(requestId: string): Promise<string | null> {
  const lines = await listRequestSampleLines(requestId);
  if (lines.length === 0) return "Phiếu phải có ít nhất một mẫu";
  for (const line of lines) {
    const label = line.sampleName.trim() || line.tempCode || `#${line.lineNo}`;
    if (!line.matrixId) return `Mẫu "${label}" chưa chọn nền mẫu`;
    if (line.tests.length === 0) return `Mẫu "${label}" chưa chọn chỉ tiêu`;
    for (const t of line.tests) {
      if (line.matrixId) {
        const valid = await isTestMethodValidForMatrix(line.matrixId, t.testMethodId);
        if (!valid) return `Chỉ tiêu "${t.testMethodName}" không phù hợp nền mẫu của "${label}"`;
      }
    }
  }
  return null;
}

export async function toggleMatrixCell(lineId: string, testMethodId: string, selected: boolean) {
  const line = await db.requestSampleLine.findUnique({ where: { id: lineId } });
  if (!line || line.status !== "draft") throw new Error("Dòng mẫu không thể chỉnh sửa");

  if (selected) {
    if (line.matrixId) {
      const valid = await isTestMethodValidForMatrix(line.matrixId, testMethodId);
      if (!valid) throw new Error("Chỉ tiêu không phù hợp với nền mẫu");
    }
    await setLineTests(lineId, [testMethodId], { replace: false });
  } else {
    await db.requestSampleLineTest.deleteMany({ where: { lineId, testMethodId } });
  }
}

export async function removeTestsFromLines(lineIds: string[], testMethodIds: string[]) {
  await db.requestSampleLineTest.deleteMany({
    where: { lineId: { in: lineIds }, testMethodId: { in: testMethodIds } },
  });
}

export type { RequestPriority };
