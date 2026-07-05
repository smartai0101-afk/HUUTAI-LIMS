import { db } from "@/lib/db";
import type { SampleMatrixGroupView } from "@/types/catalog";

export type SampleMatrixGroupRow = SampleMatrixGroupView & {
  matrixCount: number;
};

export async function listSampleMatrixGroups(activeOnly = true): Promise<SampleMatrixGroupView[]> {
  const rows = await listSampleMatrixGroupsWithStats(activeOnly);
  return rows.map(({ matrixCount: _matrixCount, ...rest }) => rest);
}

export async function listSampleMatrixGroupsWithStats(
  activeOnly = true,
): Promise<SampleMatrixGroupRow[]> {
  const rows = await db.sampleMatrixGroup.findMany({
    where: activeOnly ? { active: true, deletedAt: null } : { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const counts = await db.sampleMatrix.groupBy({
    by: ["groupId"],
    where: { deletedAt: null, groupId: { not: null } },
    _count: { _all: true },
  });
  const countByGroup = new Map(counts.map((c) => [c.groupId!, c._count._all]));

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    sortOrder: r.sortOrder,
    active: r.active,
    matrixCount: countByGroup.get(r.id) ?? 0,
  }));
}

export async function getSampleMatrixGroupById(id: string) {
  return db.sampleMatrixGroup.findFirst({ where: { id, deletedAt: null } });
}

async function assertUniqueSortOrder(sortOrder: number, excludeId?: string) {
  const conflict = await db.sampleMatrixGroup.findFirst({
    where: {
      sortOrder,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { name: true },
  });
  if (conflict) {
    throw new Error(`Thứ tự ${sortOrder} đã được dùng bởi nhóm "${conflict.name}".`);
  }
}

async function nextAvailableSortOrder(): Promise<number> {
  const max = await db.sampleMatrixGroup.aggregate({
    where: { deletedAt: null },
    _max: { sortOrder: true },
  });
  return (max._max.sortOrder ?? 0) + 1;
}

export async function upsertSampleMatrixGroup(input: {
  id?: string;
  code: string;
  name: string;
  sortOrder?: number;
  active?: boolean;
}) {
  const code = input.code.trim();
  const name = input.name.trim();
  if (!code || !name) throw new Error("Mã và tên nhóm là bắt buộc.");

  let sortOrder = input.sortOrder;
  if (sortOrder == null || sortOrder <= 0) {
    sortOrder = await nextAvailableSortOrder();
  }

  await assertUniqueSortOrder(sortOrder, input.id);

  if (input.id) {
    const updated = await db.sampleMatrixGroup.update({
      where: { id: input.id },
      data: {
        code,
        name,
        sortOrder,
        active: input.active ?? true,
      },
    });
    await db.sampleMatrix.updateMany({
      where: { groupId: input.id },
      data: { groupName: name },
    });
    return updated;
  }

  const duplicateCode = await db.sampleMatrixGroup.findFirst({
    where: { code, deletedAt: null },
  });
  if (duplicateCode) throw new Error(`Mã nhóm "${code}" đã tồn tại.`);

  return db.sampleMatrixGroup.create({
    data: {
      code,
      name,
      sortOrder,
      active: input.active ?? true,
    },
  });
}

export async function reindexMatrixGroups(): Promise<number> {
  const groups = await db.sampleMatrixGroup.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  let order = 1;
  for (const g of groups) {
    await db.sampleMatrixGroup.update({
      where: { id: g.id },
      data: { sortOrder: order++ },
    });
  }
  return groups.length;
}

export async function softDeleteSampleMatrixGroup(id: string) {
  const childCount = await db.sampleMatrix.count({
    where: { groupId: id, deletedAt: null },
  });
  if (childCount > 0) {
    throw new Error(`Không thể ẩn nhóm: còn ${childCount} nền mẫu thuộc nhóm này.`);
  }
  return db.sampleMatrixGroup.update({
    where: { id },
    data: { deletedAt: new Date(), active: false },
  });
}

export async function hardDeleteSampleMatrixGroup(id: string) {
  const childCount = await db.sampleMatrix.count({
    where: { groupId: id, deletedAt: null },
  });
  if (childCount > 0) {
    throw new Error(`Không thể xóa: nhóm còn ${childCount} nền mẫu. Hãy chuyển hoặc xóa nền trước.`);
  }

  const group = await db.sampleMatrixGroup.findUnique({ where: { id } });
  if (!group) throw new Error("Không tìm thấy nhóm.");

  const requestCount = await db.sampleRequest.count({
    where: { sampleType: group.name },
  });
  if (requestCount > 0) {
    throw new Error(
      `Không thể xóa: ${requestCount} phiếu yêu cầu đang dùng loại mẫu "${group.name}". Hãy ẩn thay vì xóa.`,
    );
  }

  return db.sampleMatrixGroup.delete({ where: { id } });
}

export type MatrixImportRow = {
  groupCode: string;
  groupName: string;
  matrixCode: string;
  matrixName: string;
  sortOrder?: number;
};

export type MatrixImportResult = {
  groupsCreated: number;
  groupsUpdated: number;
  matricesCreated: number;
  matricesUpdated: number;
  errors: { row: number; message: string }[];
};

export async function importMatrixCatalog(rows: MatrixImportRow[]): Promise<MatrixImportResult> {
  const result: MatrixImportResult = {
    groupsCreated: 0,
    groupsUpdated: 0,
    matricesCreated: 0,
    matricesUpdated: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 2;
    const groupCode = row.groupCode?.trim();
    const groupName = row.groupName?.trim();
    const matrixCode = row.matrixCode?.trim();
    const matrixName = row.matrixName?.trim();

    if (!groupCode || !groupName || !matrixCode || !matrixName) {
      result.errors.push({ row: line, message: "Thiếu groupCode, groupName, matrixCode hoặc matrixName" });
      continue;
    }

    try {
      const existingGroup = await db.sampleMatrixGroup.findUnique({ where: { code: groupCode } });
      const group = await db.sampleMatrixGroup.upsert({
        where: { code: groupCode },
        create: {
          code: groupCode,
          name: groupName,
          sortOrder: row.sortOrder ?? (await nextAvailableSortOrder()),
          active: true,
        },
        update: {
          name: groupName,
          active: true,
          deletedAt: null,
        },
      });
      if (existingGroup) result.groupsUpdated++;
      else result.groupsCreated++;

      const existingMatrix = await db.sampleMatrix.findUnique({ where: { code: matrixCode } });
      await db.sampleMatrix.upsert({
        where: { code: matrixCode },
        create: {
          code: matrixCode,
          name: matrixName,
          groupId: group.id,
          groupName: group.name,
          sortOrder: row.sortOrder ?? 0,
          active: true,
        },
        update: {
          name: matrixName,
          groupId: group.id,
          groupName: group.name,
          sortOrder: row.sortOrder ?? existingMatrix?.sortOrder ?? 0,
          active: true,
          deletedAt: null,
        },
      });
      if (existingMatrix) result.matricesUpdated++;
      else result.matricesCreated++;
    } catch (e) {
      result.errors.push({
        row: line,
        message: e instanceof Error ? e.message : "Lỗi không xác định",
      });
    }
  }

  return result;
}
