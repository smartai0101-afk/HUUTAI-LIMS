import { db } from "@/lib/db";
import type { SampleMatrixView } from "@/types/catalog";

export type SampleMatrixRow = SampleMatrixView & {
  usageCount: number;
};

export async function listSampleMatrices(
  activeOnly = true,
  groupId?: string | null,
): Promise<SampleMatrixView[]> {
  const rows = await listSampleMatricesWithStats(activeOnly, groupId);
  return rows.map(({ usageCount: _usageCount, ...rest }) => rest);
}

export async function listSampleMatricesWithStats(
  activeOnly = true,
  groupId?: string | null,
): Promise<SampleMatrixRow[]> {
  const rows = await db.sampleMatrix.findMany({
    where: {
      ...(activeOnly ? { active: true, deletedAt: null } : { deletedAt: null }),
      ...(groupId ? { groupId } : {}),
    },
    include: { group: true },
    orderBy: [{ groupName: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  const lineCounts = await db.requestSampleLine.groupBy({
    by: ["matrixId"],
    where: { matrixId: { not: null } },
    _count: { _all: true },
  });
  const sampleCounts = await db.sample.groupBy({
    by: ["matrixId"],
    where: { matrixId: { not: null }, deletedAt: null },
    _count: { _all: true },
  });
  const usageByMatrix = new Map<string, number>();
  for (const c of lineCounts) {
    if (c.matrixId) usageByMatrix.set(c.matrixId, (usageByMatrix.get(c.matrixId) ?? 0) + c._count._all);
  }
  for (const c of sampleCounts) {
    if (c.matrixId) usageByMatrix.set(c.matrixId, (usageByMatrix.get(c.matrixId) ?? 0) + c._count._all);
  }

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    groupId: r.groupId,
    groupName: r.group?.name ?? r.groupName,
    sortOrder: r.sortOrder,
    active: r.active,
    usageCount: usageByMatrix.get(r.id) ?? 0,
  }));
}

export async function getSampleMatrixById(id: string) {
  return db.sampleMatrix.findFirst({ where: { id, deletedAt: null } });
}

export async function upsertSampleMatrix(input: {
  id?: string;
  code: string;
  name: string;
  groupId?: string | null;
  groupName?: string;
  sortOrder?: number;
  active?: boolean;
}) {
  let groupName = input.groupName?.trim() ?? "";
  if (input.groupId) {
    const group = await db.sampleMatrixGroup.findUnique({ where: { id: input.groupId } });
    groupName = group?.name ?? groupName;
  }

  const data = {
    code: input.code.trim(),
    name: input.name.trim(),
    groupId: input.groupId ?? null,
    groupName,
    sortOrder: input.sortOrder ?? 0,
    active: input.active ?? true,
  };

  if (input.id) {
    return db.sampleMatrix.update({ where: { id: input.id }, data });
  }
  return db.sampleMatrix.create({ data });
}

export async function softDeleteSampleMatrix(id: string) {
  return db.sampleMatrix.update({
    where: { id },
    data: { deletedAt: new Date(), active: false },
  });
}

export async function hardDeleteSampleMatrix(id: string) {
  const requestLineCount = await db.requestSampleLine.count({ where: { matrixId: id } });
  const sampleCount = await db.sample.count({ where: { matrixId: id, deletedAt: null } });
  if (requestLineCount > 0 || sampleCount > 0) {
    const parts: string[] = [];
    if (requestLineCount > 0) parts.push(`${requestLineCount} dòng phiếu YC`);
    if (sampleCount > 0) parts.push(`${sampleCount} mẫu`);
    throw new Error(
      `Không thể xóa: nền mẫu đang được dùng (${parts.join(", ")}). Hãy ẩn thay vì xóa.`,
    );
  }

  const matrix = await db.sampleMatrix.findUnique({ where: { id } });
  if (!matrix) throw new Error("Không tìm thấy nền mẫu.");

  return db.sampleMatrix.delete({ where: { id } });
}
