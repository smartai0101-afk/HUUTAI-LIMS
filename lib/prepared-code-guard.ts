import { db } from "@/lib/db";

export const PREPARED_CODE_DELETED_MARKER = "__deleted__";

/** Rename code on soft delete so the original code can be reused (DB @unique on code). */
export function archivePreparedCode(code: string, id: string): string {
  if (code.includes(PREPARED_CODE_DELETED_MARKER)) return code;
  return `${code}${PREPARED_CODE_DELETED_MARKER}${id.slice(0, 8)}`;
}

async function releaseSoftDeletedPreparedChemicalCodeInner(code: string) {
  const ghosts = await db.preparedChemical.findMany({
    where: { code, deletedAt: { not: null } },
    select: { id: true, code: true },
  });
  for (const row of ghosts) {
    await db.preparedChemical.update({
      where: { id: row.id },
      data: { code: archivePreparedCode(row.code, row.id) },
    });
  }
}

async function releaseSoftDeletedPreparedStandardCodeInner(code: string) {
  const ghosts = await db.preparedStandard.findMany({
    where: { code, deletedAt: { not: null } },
    select: { id: true, code: true },
  });
  for (const row of ghosts) {
    await db.preparedStandard.update({
      where: { id: row.id },
      data: { code: archivePreparedCode(row.code, row.id) },
    });
  }
}

async function releaseSoftDeletedPreparedStrainCodeInner(code: string) {
  const ghosts = await db.preparedStrain.findMany({
    where: { code, deletedAt: { not: null } },
    select: { id: true, code: true },
  });
  for (const row of ghosts) {
    await db.preparedStrain.update({
      where: { id: row.id },
      data: { code: archivePreparedCode(row.code, row.id) },
    });
  }
}

export function releaseSoftDeletedPreparedChemicalCode(code: string) {
  return releaseSoftDeletedPreparedChemicalCodeInner(code);
}

export function releaseSoftDeletedPreparedStandardCode(code: string) {
  return releaseSoftDeletedPreparedStandardCodeInner(code);
}

export function releaseSoftDeletedPreparedStrainCode(code: string) {
  return releaseSoftDeletedPreparedStrainCodeInner(code);
}

export async function findActivePreparedChemicalByCode(code: string, excludeId?: string) {
  return db.preparedChemical.findFirst({
    where: { code, deletedAt: null, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
  });
}

export async function findActivePreparedStandardByCode(code: string, excludeId?: string) {
  return db.preparedStandard.findFirst({
    where: { code, deletedAt: null, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
  });
}

export async function findActivePreparedStrainByCode(code: string, excludeId?: string) {
  return db.preparedStrain.findFirst({
    where: { code, deletedAt: null, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
  });
}
