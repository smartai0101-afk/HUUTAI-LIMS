import type { PrismaClient } from "@prisma/client";
import { createAnalyticalMethodWithVersion } from "@/lib/services/analytical-methods/methods";
import { saveMethodWorkflow } from "@/lib/services/analytical-methods/method-workflow";
import { saveMethodReagent } from "@/lib/services/analytical-methods/method-reagents";
import { saveMethodEquipment } from "@/lib/services/analytical-methods/method-equipment-check";
import {
  saveMethodAcceptanceCriteria,
  saveMethodQCRequirement,
  saveMethodSafetyNote,
} from "@/lib/services/analytical-methods/method-safety-check";
import { METHOD_ICP_WATER } from "./method-icp-water";
import { METHOD_LCMS_PESTICIDE } from "./method-lcms-pesticide";
import type { MethodSeedDefinition } from "./types";

const METHOD_DEFINITIONS: MethodSeedDefinition[] = [METHOD_ICP_WATER, METHOD_LCMS_PESTICIDE];

async function ensureMethodSeedCatalog(prisma: PrismaClient): Promise<void> {
  const { parseDate } = await import("../helpers");
  const { computeStandardStatus } = await import("../../../lib/standard-status");

  const nitricExpiry = parseDate("2027-09-01");
  await prisma.chemical.upsert({
    where: { code: "CHEM-0030" },
    update: {},
    create: {
      code: "CHEM-0030",
      name: "Nitric acid 65%",
      chemicalGroup: "Acid",
      manufacturer: "Merck",
      casNumber: "7697-37-2",
      productCode: "100441",
      lot: "HNO3-2412",
      purity: "≥65%, trace metal grade",
      unit: "L",
      quantity: 2,
      expiryDate: nitricExpiry,
      storageCondition: "Tủ acid",
      storageLocation: "B2-09",
      notes: "Acid hóa ICP-OES",
      status: computeStandardStatus(nitricExpiry),
      reorderLevel: 5,
    },
  });

  const acnExpiry = parseDate("2027-10-15");
  const acnAfterOpen = parseDate("2028-04-15");
  await prisma.standard.upsert({
    where: { code: "STD-0027" },
    update: {},
    create: {
      code: "STD-0027",
      name: "Acetamiprid CRM 100 µg/mL",
      standardGroup: "CRM",
      manufacturer: "Dr. Ehrenstorfer",
      casNumber: "135410-20-7",
      productCode: "ACN-100",
      lot: "ACN-2412",
      purity: "99.5%",
      uncertainty: "2%",
      unit: "mL",
      quantity: 5,
      expiryDate: acnExpiry,
      afterOpenExpiry: acnAfterOpen,
      storageCondition: "2-8°C",
      storageLocation: "C2-14",
      notes: "Chuẩn LC-MS/MS thuốc BVTV",
      status: computeStandardStatus(acnExpiry),
    },
  });
}

async function resolveChemicalId(prisma: PrismaClient, code?: string): Promise<string | null> {
  if (!code) return null;
  const row = await prisma.chemical.findUnique({ where: { code }, select: { id: true } });
  return row?.id ?? null;
}

async function resolveStandardId(prisma: PrismaClient, code?: string): Promise<string | null> {
  if (!code) return null;
  const row = await prisma.standard.findUnique({ where: { code }, select: { id: true } });
  return row?.id ?? null;
}

async function resolveEquipmentId(prisma: PrismaClient, code: string): Promise<string | null> {
  const row = await prisma.equipment.findUnique({ where: { code }, select: { id: true } });
  return row?.id ?? null;
}

async function resolveChemicalReferenceId(
  prisma: PrismaClient,
  casNumber?: string,
): Promise<string | null> {
  if (!casNumber?.trim()) return null;
  const row = await prisma.chemicalReference.findUnique({
    where: { casNumber: casNumber.trim() },
    select: { id: true },
  });
  return row?.id ?? null;
}

async function resolveMatrixIds(prisma: PrismaClient, codes: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const code of codes) {
    if (!code) continue;
    const row = await prisma.sampleMatrix.findUnique({ where: { code }, select: { id: true } });
    if (row) ids.push(row.id);
  }
  return [...new Set(ids)];
}

async function resolveTestMethodIds(prisma: PrismaClient, codes: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const code of codes) {
    if (!code) continue;
    const row = await prisma.testMethod.findUnique({ where: { code }, select: { id: true } });
    if (row) ids.push(row.id);
  }
  return [...new Set(ids)];
}

async function seedOneMethod(prisma: PrismaClient, def: MethodSeedDefinition): Promise<"created" | "skipped"> {
  const existing = await prisma.analyticalMethod.findUnique({
    where: { methodCode: def.methodCode },
    select: { id: true },
  });
  if (existing) {
    console.log(`  Skip ${def.methodCode} (already exists)`);
    return "skipped";
  }

  const matrixIds = await resolveMatrixIds(prisma, def.matrixCodes);
  if (def.matrixCodes.length > 0 && matrixIds.length === 0) {
    console.warn(`  Warning: no sample matrices found for ${def.methodCode}`);
  }

  const testMethodIds = await resolveTestMethodIds(prisma, def.testMethodCodes);
  if (def.testMethodCodes.length > 0 && testMethodIds.length === 0) {
    console.warn(`  Warning: no test methods found for ${def.methodCode}`);
  }

  const method = await createAnalyticalMethodWithVersion({
    methodCode: def.methodCode,
    methodName: def.methodName,
    matrixIds,
    testMethodIds,
    technique: def.technique,
    standardRef: def.standardRef,
    createdBy: "Seed",
  });

  const versionId = method.currentVersionId;
  if (!versionId) throw new Error(`Missing version for ${def.methodCode}`);

  await prisma.methodVersion.update({
    where: { id: versionId },
    data: {
      changeLog: def.sopMarkdown,
      estimatedDurationMinutes: def.estimatedDurationMinutes,
    },
  });

  await saveMethodWorkflow(versionId, {
    layoutJson: def.layoutJson,
    nodes: def.nodes.map((n) => ({
      nodeKey: n.nodeKey,
      type: n.type,
      label: n.label,
      description: n.description ?? "",
      positionX: n.positionX,
      positionY: n.positionY,
      configJson: n.configJson ?? "{}",
    })),
    edges: def.edges.map((e) => ({
      sourceNodeKey: e.sourceNodeKey,
      targetNodeKey: e.targetNodeKey,
      label: e.label,
      conditionJson: e.conditionJson ?? "{}",
    })),
  });

  await prisma.methodWorkflow.updateMany({
    where: { methodVersionId: versionId },
    data: { sourceType: "Imported", isDraft: true },
  });

  for (const r of def.reagents) {
    const chemicalId = await resolveChemicalId(prisma, r.chemicalCode);
    const standardId = await resolveStandardId(prisma, r.standardCode);
    if (r.chemicalCode && !chemicalId) {
      console.warn(`  Warning: chemical ${r.chemicalCode} not found for ${def.methodCode}`);
    }
    if (r.standardCode && !standardId) {
      console.warn(`  Warning: standard ${r.standardCode} not found for ${def.methodCode}`);
    }
    await saveMethodReagent({
      methodVersionId: versionId,
      workflowNodeKey: r.workflowNodeKey ?? "",
      chemicalId,
      standardId,
      nameFreeText: r.nameFreeText,
      casNumber: r.casNumber ?? "",
      amountPerSample: r.amountPerSample,
      unit: r.unit,
      isConsumable: r.isConsumable ?? false,
    });
  }

  for (const e of def.equipment) {
    const equipmentId = await resolveEquipmentId(prisma, e.equipmentCode);
    if (!equipmentId) {
      console.warn(`  Warning: equipment ${e.equipmentCode} not found for ${def.methodCode}`);
      continue;
    }
    await saveMethodEquipment({
      methodVersionId: versionId,
      workflowNodeKey: e.workflowNodeKey ?? "",
      equipmentId,
      role: e.role,
    });
  }

  for (const qc of def.qcRequirements) {
    await saveMethodQCRequirement({
      methodVersionId: versionId,
      qcType: qc.qcType,
      frequency: qc.frequency,
      frequencyUnit: qc.frequencyUnit,
      limitsJson: JSON.stringify(qc.limitsJson ?? {}),
    });
  }

  for (const ac of def.acceptanceCriteria) {
    await saveMethodAcceptanceCriteria({
      methodVersionId: versionId,
      analyte: ac.analyte,
      criteriaJson: JSON.stringify(ac.criteriaJson ?? {}),
    });
  }

  for (const note of def.safetyNotes) {
    const chemicalReferenceId = await resolveChemicalReferenceId(prisma, note.casNumber);
    await saveMethodSafetyNote({
      methodVersionId: versionId,
      noteType: note.noteType,
      content: note.content,
      chemicalReferenceId,
    });
  }

  console.log(`  Created ${def.methodCode} (${def.methodName})`);
  return "created";
}

export async function seedAnalyticalMethods(prisma: PrismaClient): Promise<void> {
  console.log("Seeding analytical methods demo data...");
  await ensureMethodSeedCatalog(prisma);
  let created = 0;
  let skipped = 0;

  for (const def of METHOD_DEFINITIONS) {
    const result = await seedOneMethod(prisma, def);
    if (result === "created") created++;
    else skipped++;
  }

  console.log(`  Analytical methods: ${created} created, ${skipped} skipped`);
}
