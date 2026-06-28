import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/chem-info/json-utils";
import { checkChemicalCompatibility } from "@/lib/services/chem-info/compatibility";
import {
  mapMethodAcceptance,
  mapMethodQC,
  mapMethodSafetyNote,
} from "@/lib/mappers/analytical-methods";
import type {
  MethodAcceptanceCriteriaView,
  MethodQCRequirementView,
  MethodSafetyNoteView,
} from "@/types/analytical-methods";
import { listMethodReagents } from "./method-reagents";

export async function listMethodQCRequirements(
  methodVersionId: string,
): Promise<MethodQCRequirementView[]> {
  const rows = await db.methodQCRequirement.findMany({
    where: { methodVersionId },
    orderBy: { qcType: "asc" },
  });
  return rows.map(mapMethodQC);
}

export async function saveMethodQCRequirement(data: {
  id?: string;
  methodVersionId: string;
  qcType: string;
  frequency: string;
  frequencyUnit: string;
  limitsJson: string;
}) {
  const payload = {
    methodVersionId: data.methodVersionId,
    qcType: data.qcType,
    frequency: data.frequency,
    frequencyUnit: data.frequencyUnit,
    limitsJson: data.limitsJson,
  };
  if (data.id) {
    return db.methodQCRequirement.update({ where: { id: data.id }, data: payload });
  }
  return db.methodQCRequirement.create({ data: payload });
}

export async function deleteMethodQCRequirement(id: string) {
  return db.methodQCRequirement.delete({ where: { id } });
}

export async function listMethodAcceptanceCriteria(
  methodVersionId: string,
): Promise<MethodAcceptanceCriteriaView[]> {
  const rows = await db.methodAcceptanceCriteria.findMany({
    where: { methodVersionId },
    orderBy: { analyte: "asc" },
  });
  return rows.map(mapMethodAcceptance);
}

export async function saveMethodAcceptanceCriteria(data: {
  id?: string;
  methodVersionId: string;
  analyte: string;
  criteriaJson: string;
}) {
  const payload = {
    methodVersionId: data.methodVersionId,
    analyte: data.analyte,
    criteriaJson: data.criteriaJson,
  };
  if (data.id) {
    return db.methodAcceptanceCriteria.update({ where: { id: data.id }, data: payload });
  }
  return db.methodAcceptanceCriteria.create({ data: payload });
}

export async function deleteMethodAcceptanceCriteria(id: string) {
  return db.methodAcceptanceCriteria.delete({ where: { id } });
}

export async function listMethodSafetyNotes(
  methodVersionId: string,
): Promise<MethodSafetyNoteView[]> {
  const rows = await db.methodSafetyNote.findMany({
    where: { methodVersionId },
    include: { chemicalReference: { select: { name: true } } },
    orderBy: { noteType: "asc" },
  });
  return rows.map(mapMethodSafetyNote);
}

export async function saveMethodSafetyNote(data: {
  id?: string;
  methodVersionId: string;
  noteType: string;
  content: string;
  chemicalReferenceId?: string | null;
}) {
  const payload = {
    methodVersionId: data.methodVersionId,
    noteType: data.noteType,
    content: data.content,
    chemicalReferenceId: data.chemicalReferenceId || null,
  };
  if (data.id) {
    return db.methodSafetyNote.update({ where: { id: data.id }, data: payload });
  }
  return db.methodSafetyNote.create({ data: payload });
}

export async function deleteMethodSafetyNote(id: string) {
  return db.methodSafetyNote.delete({ where: { id } });
}

export type SafetyCheckResult = {
  casNumber: string;
  chemicalName: string;
  hasSds: boolean;
  hasGhs: boolean;
  signalWord: string | null;
  ppeNotes: string[];
  compatibilityWarnings: string[];
};

export async function runMethodSafetyChecks(
  methodVersionId: string,
): Promise<SafetyCheckResult[]> {
  const reagents = await listMethodReagents(methodVersionId);
  const casList = [...new Set(reagents.map((r) => r.casNumber.trim()).filter(Boolean))];
  const results: SafetyCheckResult[] = [];

  for (const cas of casList) {
    const ref = await db.chemicalReference.findUnique({
      where: { casNumber: cas },
      include: {
        safetyProfile: true,
        sdsDocuments: { take: 1 },
        hazardCategory: true,
      },
    });

    const compatibilityWarnings: string[] = [];
    if (ref) {
      for (const otherCas of casList) {
        if (otherCas === cas) continue;
        const otherRef = await db.chemicalReference.findUnique({
          where: { casNumber: otherCas },
          select: { id: true },
        });
        if (!otherRef) continue;
        const check = await checkChemicalCompatibility(ref.id, otherRef.id);
        if (!check.compatible && check.rules.length > 0) {
          compatibilityWarnings.push(
            `${cas} + ${otherCas}: ${check.rules[0]?.message ?? "Không tương thích"}`,
          );
        }
      }
    }

    const precautionary = ref?.safetyProfile?.precautionaryStatements
      ? parseJsonArray<{ code: string; text: string }>(ref.safetyProfile.precautionaryStatements)
      : [];

    results.push({
      casNumber: cas,
      chemicalName: ref?.name ?? reagents.find((r) => r.casNumber === cas)?.nameFreeText ?? cas,
      hasSds: (ref?.sdsDocuments.length ?? 0) > 0,
      hasGhs: Boolean(ref?.safetyProfile),
      signalWord: ref?.safetyProfile?.signalWord || null,
      ppeNotes: precautionary.map((p) => p.text || p.code),
      compatibilityWarnings,
    });
  }

  return results;
}
