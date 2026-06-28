import type { ChemicalReference } from "@prisma/client";
import { db } from "@/lib/db";
import {
  buildPlaceholderCas,
  isPlaceholderCas,
  normalizeChemicalName,
} from "@/lib/services/chem-info/cas-parser";
import {
  fetchPubChemCompound,
  mapPubChemToReference,
  type PubChemCompound,
} from "@/lib/services/chem-info/pubchem";

export type SyncLogInput = {
  action: "search" | "preview" | "sync" | "refresh";
  query?: string;
  pubchemCid?: number;
  status: "success" | "error" | "skipped";
  message?: string;
  performedBy: string;
  chemicalReferenceId?: string;
};

export async function writeSyncLog(input: SyncLogInput) {
  await db.chemicalReferenceSyncLog.create({
    data: {
      action: input.action,
      query: input.query ?? "",
      pubchemCid: input.pubchemCid ?? null,
      source: "PubChem",
      status: input.status,
      message: input.message ?? "",
      performedBy: input.performedBy,
      chemicalReferenceId: input.chemicalReferenceId ?? null,
    },
  });
}

export async function findExistingReference(params: {
  casNumber?: string;
  pubchemCid?: number;
  inchiKey?: string;
  normalizedName?: string;
}): Promise<ChemicalReference | null> {
  const { casNumber, pubchemCid, inchiKey, normalizedName } = params;

  if (casNumber && !isPlaceholderCas(casNumber)) {
    const byCas = await db.chemicalReference.findUnique({ where: { casNumber } });
    if (byCas) return byCas;
  }

  if (pubchemCid) {
    const byCid = await db.chemicalReference.findUnique({ where: { pubchemCid } });
    if (byCid) return byCid;
  }

  if (inchiKey) {
    const byInchi = await db.chemicalReference.findFirst({ where: { inchiKey } });
    if (byInchi) return byInchi;
  }

  if (normalizedName) {
    const byName = await db.chemicalReference.findFirst({ where: { normalizedName } });
    if (byName) return byName;
  }

  return null;
}

function mergeString(current: string, incoming: string, allowOverwrite: boolean) {
  if (!incoming) return current;
  if (!current || allowOverwrite) return incoming;
  return current;
}

function buildMergeData(
  existing: ChemicalReference,
  draft: ReturnType<typeof mapPubChemToReference>,
  allowOverwrite: boolean,
) {
  const now = new Date();
  const syncStatus = draft.needsReview
    ? "needs_review"
    : existing.syncStatus === "manual"
      ? "manual"
      : "synced";

  return {
    pubchemCid: existing.pubchemCid ?? draft.pubchemCid,
    name: mergeString(existing.name, draft.name, allowOverwrite),
    normalizedName: mergeString(
      existing.normalizedName || normalizeChemicalName(existing.name),
      draft.normalizedName,
      allowOverwrite,
    ),
    iupacName: mergeString(existing.iupacName, draft.iupacName, allowOverwrite),
    molecularFormula: mergeString(existing.molecularFormula, draft.molecularFormula, allowOverwrite),
    molecularWeight: existing.molecularWeight ?? draft.molecularWeight,
    smiles: mergeString(existing.smiles, draft.smiles, allowOverwrite),
    isomericSmiles: mergeString(existing.isomericSmiles, draft.isomericSmiles, allowOverwrite),
    inchi: mergeString(existing.inchi, draft.inchi, allowOverwrite),
    inchiKey: mergeString(existing.inchiKey, draft.inchiKey, allowOverwrite),
    structure2dUrl: existing.structure2dUrl ?? draft.structure2dUrl,
    synonyms: existing.synonyms !== "[]" && !allowOverwrite
      ? existing.synonyms
      : JSON.stringify(draft.synonyms),
    physicalProperties:
      existing.physicalProperties !== "{}" && !allowOverwrite
        ? existing.physicalProperties
        : JSON.stringify(draft.physicalProperties),
    extendedData: JSON.stringify({
      ...safeParseJson(existing.extendedData),
      ...draft.extendedData,
    }),
    source: existing.source === "seed" ? existing.source : "PubChem",
    syncStatus,
    lastSyncedAt: now,
    casNumber:
      isPlaceholderCas(existing.casNumber) && !draft.needsReview
        ? draft.casNumber
        : existing.casNumber,
  };
}

function safeParseJson(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export async function upsertFromPubChem(
  cid: number,
  options: { performedBy: string; query?: string },
): Promise<{ id: string; created: boolean; error?: string }> {
  const compound = await fetchPubChemCompound(cid);
  if (!compound) {
    await writeSyncLog({
      action: "sync",
      query: options.query,
      pubchemCid: cid,
      status: "error",
      message: "Không tìm thấy compound trên PubChem",
      performedBy: options.performedBy,
    });
    return { id: "", created: false, error: "Không tìm thấy dữ liệu trên PubChem" };
  }

  const draft = mapPubChemToReference(compound);
  const existing = await findExistingReference({
    casNumber: draft.casNumber,
    pubchemCid: draft.pubchemCid,
    inchiKey: draft.inchiKey,
    normalizedName: draft.normalizedName,
  });

  if (existing) {
    const allowOverwrite = existing.syncStatus !== "manual";
    const data = buildMergeData(existing, draft, allowOverwrite);
    await db.chemicalReference.update({ where: { id: existing.id }, data });
    await writeSyncLog({
      action: "sync",
      query: options.query,
      pubchemCid: cid,
      status: "success",
      message: "Merged existing reference",
      performedBy: options.performedBy,
      chemicalReferenceId: existing.id,
    });
    return { id: existing.id, created: false };
  }

  const created = await db.chemicalReference.create({
    data: {
      casNumber: draft.casNumber,
      name: draft.name,
      normalizedName: draft.normalizedName,
      iupacName: draft.iupacName,
      molecularFormula: draft.molecularFormula,
      molecularWeight: draft.molecularWeight,
      synonyms: JSON.stringify(draft.synonyms),
      pubchemCid: draft.pubchemCid,
      smiles: draft.smiles,
      isomericSmiles: draft.isomericSmiles,
      inchi: draft.inchi,
      inchiKey: draft.inchiKey,
      structure2dUrl: draft.structure2dUrl,
      physicalProperties: JSON.stringify(draft.physicalProperties),
      extendedData: JSON.stringify(draft.extendedData),
      source: "PubChem",
      syncStatus: draft.needsReview ? "needs_review" : "synced",
      lastSyncedAt: new Date(),
    },
  });

  await writeSyncLog({
    action: "sync",
    query: options.query,
    pubchemCid: cid,
    status: "success",
    message: "Created new reference",
    performedBy: options.performedBy,
    chemicalReferenceId: created.id,
  });

  return { id: created.id, created: true };
}

export async function refreshReferenceFromPubChem(
  referenceId: string,
  options: { performedBy: string; force?: boolean; query?: string },
): Promise<{ error?: string }> {
  const ref = await db.chemicalReference.findUnique({ where: { id: referenceId } });
  if (!ref) return { error: "Không tìm thấy hóa chất tham chiếu" };

  let compound: PubChemCompound | null = null;
  if (ref.pubchemCid) {
    compound = await fetchPubChemCompound(ref.pubchemCid);
  } else {
    const query = ref.name || ref.casNumber;
    const { searchPubChem } = await import("@/lib/services/chem-info/pubchem");
    const hits = await searchPubChem(query, "all", 1);
    if (hits[0]) compound = await fetchPubChemCompound(hits[0].cid);
  }

  if (!compound) {
    await writeSyncLog({
      action: "refresh",
      query: options.query ?? ref.name,
      pubchemCid: ref.pubchemCid ?? undefined,
      status: "error",
      message: "Không tìm thấy trên PubChem",
      performedBy: options.performedBy,
      chemicalReferenceId: referenceId,
    });
    return { error: "Không tìm thấy dữ liệu trên PubChem" };
  }

  const draft = mapPubChemToReference(compound);
  const isManual = ref.syncStatus === "manual";
  const allowOverwrite = Boolean(options.force) || !isManual;

  const data = buildMergeData(ref, draft, allowOverwrite);
  if (isManual && !options.force) {
    data.name = ref.name;
    data.normalizedName = ref.normalizedName || normalizeChemicalName(ref.name);
    data.syncStatus = "manual";
  }

  await db.chemicalReference.update({ where: { id: referenceId }, data });

  await writeSyncLog({
    action: "refresh",
    query: options.query ?? ref.name,
    pubchemCid: compound.cid,
    status: "success",
    message: isManual && !options.force ? "Filled empty fields only" : "Refreshed from PubChem",
    performedBy: options.performedBy,
    chemicalReferenceId: referenceId,
  });

  return {};
}

export function resolveCasForCompound(compound: PubChemCompound) {
  return compound.casNumber || buildPlaceholderCas(compound.cid, compound.inchiKey || undefined);
}
