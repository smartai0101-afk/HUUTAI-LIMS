import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { mapSampleDetail } from "@/lib/mappers/samples";
import { getTestWarnings } from "@/lib/services/samples/sample-warnings";
import type { SampleDetailView } from "@/types/samples";

const detailInclude = {
  request: { select: { requestCode: true } },
  primaryMethod: {
    select: {
      methodCode: true,
      methodName: true,
      currentVersion: { select: { version: true } },
    },
  },
  primaryMethodVersion: { select: { version: true } },
  chemicalReference: { select: { name: true, casNumber: true } },
  tests: {
    include: {
      method: { select: { methodCode: true, methodName: true } },
      methodVersion: { select: { version: true } },
      equipment: { select: { code: true, name: true, status: true, calibrationExpiryDate: true } },
      chemicals: true,
      standards: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
  analysisAssignments: { orderBy: { createdAt: "asc" as const } },
} as const;

export async function getSampleDetail(id: string): Promise<SampleDetailView | null> {
  const row = await db.sample.findUnique({
    where: { id },
    include: detailInclude,
  });
  if (!row) return null;

  const testWarnings: Record<string, string[]> = {};
  for (const test of row.tests) {
    testWarnings[test.id] = await getTestWarnings(test);
  }

  return mapSampleDetail(row, testWarnings);
}

export async function transitionSampleStatus(
  id: string,
  toStatus: import("@prisma/client").SampleStatus,
  changedBy: string,
  reason = "",
) {
  const existing = await db.sample.findUnique({
    where: { id },
    include: { tests: true },
  });
  if (!existing) throw new Error("Không tìm thấy mẫu");

  const { canTransitionSampleStatus, validateCompletionRequirements } = await import(
    "@/lib/services/samples/sample-workflow"
  );

  if (!canTransitionSampleStatus(existing.status, toStatus)) {
    throw new Error(`Không thể chuyển từ "${existing.status}" sang "${toStatus}"`);
  }

  if (toStatus === "Completed") {
    const err = validateCompletionRequirements(existing.tests);
    if (err) throw new Error(err);
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.sample.update({
      where: { id },
      data: { status: toStatus },
    });

    const { appendSampleAuditLog } = await import("@/lib/services/samples/sample-audit");
    await appendSampleAuditLog(tx, {
      entityType: "sample",
      entityId: id,
      action: `Transition:${existing.status}->${toStatus}`,
      before: { status: existing.status, reason },
      after: { status: toStatus },
      changedBy,
    });

    return updated;
  });
}

export async function listMethodOptions() {
  const methods = await db.analyticalMethod.findMany({
    include: {
      currentVersion: { select: { id: true, version: true, status: true } },
    },
    orderBy: { methodCode: "asc" },
  });

  return methods.map((m) => ({
    id: m.id,
    methodCode: m.methodCode,
    methodName: m.methodName,
    versionId: m.currentVersion?.id ?? null,
    version: m.currentVersion?.version ?? null,
    versionStatus: m.currentVersion?.status ?? null,
  }));
}

export async function listChemicalReferenceOptions(q = "") {
  const where: Prisma.ChemicalReferenceWhereInput = q
    ? {
        OR: [
          { name: { contains: q } },
          { casNumber: { contains: q } },
        ],
      }
    : {};

  return db.chemicalReference.findMany({
    where,
    select: { id: true, name: true, casNumber: true },
    orderBy: { name: "asc" },
    take: 50,
  });
}

export async function listEquipmentOptions() {
  return db.equipment.findMany({
    where: { status: { not: "Disposed" } },
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      calibrationExpiryDate: true,
    },
    orderBy: { code: "asc" },
  });
}

export async function listChemicalOptions() {
  return db.chemical.findMany({
    select: { id: true, code: true, name: true, quantity: true, expiryDate: true, status: true },
    orderBy: { code: "asc" },
    take: 200,
  });
}

export async function listStandardOptions() {
  return db.standard.findMany({
    select: { id: true, code: true, name: true, quantity: true, expiryDate: true, status: true },
    orderBy: { code: "asc" },
    take: 200,
  });
}

export async function listStaffOptions() {
  return db.staff.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
