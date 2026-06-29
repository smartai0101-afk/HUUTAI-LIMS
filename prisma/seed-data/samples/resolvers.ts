import type { PrismaClient } from "@prisma/client";

export async function resolveMethod(
  prisma: PrismaClient,
  methodCode?: string,
): Promise<{ id: string; currentVersionId: string | null } | null> {
  if (!methodCode) return null;
  return prisma.analyticalMethod.findUnique({
    where: { methodCode },
    select: { id: true, currentVersionId: true },
  });
}

export async function resolveEquipmentId(
  prisma: PrismaClient,
  code?: string,
): Promise<string | null> {
  if (!code) return null;
  const row = await prisma.equipment.findUnique({ where: { code }, select: { id: true } });
  return row?.id ?? null;
}

export async function resolveChemicalId(
  prisma: PrismaClient,
  code?: string,
): Promise<string | null> {
  if (!code) return null;
  const row = await prisma.chemical.findUnique({ where: { code }, select: { id: true } });
  return row?.id ?? null;
}

export async function resolveStandardId(
  prisma: PrismaClient,
  code?: string,
): Promise<string | null> {
  if (!code) return null;
  const row = await prisma.standard.findUnique({ where: { code }, select: { id: true } });
  return row?.id ?? null;
}
