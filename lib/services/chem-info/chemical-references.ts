import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  buildPrismaOrderBy,
  getSkipTake,
  parseListQueryParams,
  type ListQueryParams,
  type PaginatedResult,
  type SearchParamsInput,
  type SortFieldMap,
} from "@/lib/list-query";
import { parseJsonArray, parseJsonStatements } from "@/lib/chem-info/json-utils";
import type {
  ChemicalReferenceSyncStatus,
  ChemicalReferenceView,
  ChemicalSafetyView,
  GhsPictogramView,
  SdsDocumentView,
} from "@/types/chem-info";
import { toDateStr } from "@/lib/modules/shared";

export const CHEMICAL_REFERENCE_SORT_ALLOWLIST = [
  "casNumber",
  "name",
  "molecularFormula",
  "molecularWeight",
  "source",
  "lastSyncedAt",
] as const;

export const SYNC_STATUS_FILTER_VALUES = [
  "local",
  "synced",
  "manual",
  "needs_review",
] as const satisfies readonly ChemicalReferenceSyncStatus[];

export function buildSyncStatusWhere(
  status: ChemicalReferenceSyncStatus,
): Prisma.ChemicalReferenceWhereInput {
  return { syncStatus: status };
}

const SORT_MAP: SortFieldMap = {
  casNumber: "casNumber",
  name: "name",
  molecularFormula: "molecularFormula",
  molecularWeight: "molecularWeight",
  source: "source",
  lastSyncedAt: "lastSyncedAt",
};

export type ChemicalReferenceListParams = ListQueryParams & {
  searchMode: "all" | "name" | "cas" | "formula";
  syncStatus?: ChemicalReferenceSyncStatus | "all";
};

export function parseChemicalReferenceListParams(
  searchParams: SearchParamsInput,
): ChemicalReferenceListParams {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "name", sortOrder: "asc", limit: 25 },
    CHEMICAL_REFERENCE_SORT_ALLOWLIST,
  );
  const modeRaw = searchParams.searchMode;
  const mode = Array.isArray(modeRaw) ? modeRaw[0] : modeRaw;
  const searchMode =
    mode === "name" || mode === "cas" || mode === "formula" ? mode : "all";
  const syncRaw = searchParams.syncStatus;
  const syncVal = Array.isArray(syncRaw) ? syncRaw[0] : syncRaw;
  const syncStatus = (
    SYNC_STATUS_FILTER_VALUES as readonly string[]
  ).includes(syncVal ?? "")
    ? (syncVal as ChemicalReferenceSyncStatus)
    : "all";
  return { ...base, searchMode, syncStatus };
}

function mapSds(row: {
  id: string;
  title: string;
  supplier: string;
  revisionDate: Date | null;
  filePath: string | null;
  externalUrl: string | null;
  isPrimary: boolean;
  uploadedBy: string;
  createdAt: Date;
}): SdsDocumentView {
  return {
    id: row.id,
    title: row.title,
    supplier: row.supplier,
    revisionDate: row.revisionDate ? toDateStr(row.revisionDate) : null,
    filePath: row.filePath,
    externalUrl: row.externalUrl,
    isPrimary: row.isPrimary,
    uploadedBy: row.uploadedBy,
    createdAt: toDateStr(row.createdAt),
  };
}

async function loadPictograms(codes: string[]): Promise<GhsPictogramView[]> {
  if (!codes.length) return [];
  const rows = await db.ghsPictogram.findMany({ where: { code: { in: codes } } });
  const byCode = new Map(rows.map((r) => [r.code, r]));
  return codes
    .map((code) => byCode.get(code))
    .filter(Boolean)
    .map((r) => ({
      code: r!.code,
      label: r!.label,
      imagePath: r!.imagePath,
      description: r!.description,
    }));
}

async function mapSafety(
  profile: {
    signalWord: string;
    hazardStatements: string;
    precautionaryStatements: string;
    pictogramCodes: string;
    unNumber: string;
    hazardClass: string;
    packingGroup: string;
    updatedAt: Date;
  } | null,
): Promise<ChemicalSafetyView | null> {
  if (!profile) return null;
  const pictogramCodes = parseJsonArray<string>(profile.pictogramCodes);
  const pictograms = await loadPictograms(pictogramCodes);
  return {
    signalWord: profile.signalWord,
    hazardStatements: parseJsonStatements(profile.hazardStatements),
    precautionaryStatements: parseJsonStatements(profile.precautionaryStatements),
    pictograms,
    unNumber: profile.unNumber,
    hazardClass: profile.hazardClass,
    packingGroup: profile.packingGroup,
    updatedAt: toDateStr(profile.updatedAt),
  };
}

function parseExtendedData(value: string): { pubchemUrl?: string } {
  try {
    const parsed = JSON.parse(value) as { pubchemUrl?: string };
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function mapChemicalReference(row: {
  id: string;
  casNumber: string;
  name: string;
  iupacName?: string;
  molecularFormula: string;
  molecularWeight: number | null;
  synonyms: string;
  pubchemCid: number | null;
  smiles: string;
  isomericSmiles?: string;
  inchi: string;
  inchiKey: string;
  structure2dUrl: string | null;
  notes: string;
  source: string;
  syncStatus?: string;
  lastSyncedAt?: Date | null;
  extendedData?: string;
  safetyProfile?: {
    signalWord: string;
    hazardStatements: string;
    precautionaryStatements: string;
    pictogramCodes: string;
    unNumber: string;
    hazardClass: string;
    packingGroup: string;
    updatedAt: Date;
  } | null;
  sdsDocuments?: Array<{
    id: string;
    title: string;
    supplier: string;
    revisionDate: Date | null;
    filePath: string | null;
    externalUrl: string | null;
    isPrimary: boolean;
    uploadedBy: string;
    createdAt: Date;
  }>;
  hazardCategory?: { categories: string } | null;
}): Promise<ChemicalReferenceView> {
  const safety = await mapSafety(row.safetyProfile ?? null);
  const extended = parseExtendedData(row.extendedData ?? "{}");
  const syncStatus = (row.syncStatus ?? "local") as ChemicalReferenceSyncStatus;
  return {
    id: row.id,
    casNumber: row.casNumber,
    name: row.name,
    iupacName: row.iupacName ?? "",
    molecularFormula: row.molecularFormula,
    molecularWeight: row.molecularWeight,
    synonyms: parseJsonArray<string>(row.synonyms),
    pubchemCid: row.pubchemCid,
    smiles: row.smiles,
    isomericSmiles: row.isomericSmiles ?? "",
    inchi: row.inchi,
    inchiKey: row.inchiKey,
    structure2dUrl:
      row.structure2dUrl ??
      (row.pubchemCid
        ? `https://pubchem.ncbi.nlm.nih.gov/image/imagefly.cgi?cid=${row.pubchemCid}&width=300&height=300`
        : null),
    notes: row.notes,
    source: row.source,
    syncStatus,
    lastSyncedAt: row.lastSyncedAt ? toDateStr(row.lastSyncedAt) : null,
    hazardCategories: parseJsonArray<string>(row.hazardCategory?.categories ?? "[]"),
    safety,
    sdsDocuments: (row.sdsDocuments ?? []).map(mapSds),
    pubchemUrl:
      extended.pubchemUrl ??
      (row.pubchemCid ? `https://pubchem.ncbi.nlm.nih.gov/compound/${row.pubchemCid}` : null),
  };
}

const REFERENCE_LIST_INCLUDE = {
  hazardCategory: true,
};

const REFERENCE_INCLUDE = {
  safetyProfile: true,
  sdsDocuments: { orderBy: { isPrimary: "desc" as const } },
  hazardCategory: true,
};

export async function listChemicalReferences(
  params: ChemicalReferenceListParams,
): Promise<PaginatedResult<ChemicalReferenceView>> {
  const where: Prisma.ChemicalReferenceWhereInput = {};
  if (
    params.syncStatus &&
    params.syncStatus !== "all" &&
    (SYNC_STATUS_FILTER_VALUES as readonly string[]).includes(params.syncStatus)
  ) {
    Object.assign(where, buildSyncStatusWhere(params.syncStatus));
  }
  if (params.q) {
    const q = params.q.trim();
    if (params.searchMode === "cas") {
      where.casNumber = { contains: q };
    } else if (params.searchMode === "formula") {
      where.molecularFormula = { contains: q };
    } else if (params.searchMode === "name") {
      where.name = { contains: q };
    } else {
      where.OR = [
        { name: { contains: q } },
        { casNumber: { contains: q } },
        { molecularFormula: { contains: q } },
        { synonyms: { contains: q } },
      ];
    }
  }

  const orderBy = buildPrismaOrderBy<
    Prisma.ChemicalReferenceOrderByWithRelationInput
  >(params.sortBy, params.sortOrder, SORT_MAP, [{ name: "asc" }]);

  const { skip, take } = getSkipTake(params.page, params.limit);
  const [rows, total] = await Promise.all([
    db.chemicalReference.findMany({
      where,
      include: REFERENCE_LIST_INCLUDE,
      orderBy,
      skip,
      take,
    }),
    db.chemicalReference.count({ where }),
  ]);

  const items = await Promise.all(
    rows.map((row) =>
      mapChemicalReference({
        ...row,
        sdsDocuments: [],
        safetyProfile: null,
      }),
    ),
  );
  return {
    items,
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}

export async function getChemicalReferenceById(id: string): Promise<ChemicalReferenceView | null> {
  const row = await db.chemicalReference.findUnique({
    where: { id },
    include: REFERENCE_INCLUDE,
  });
  return row ? mapChemicalReference(row) : null;
}

export async function getChemicalReferenceByCas(cas: string): Promise<ChemicalReferenceView | null> {
  const row = await db.chemicalReference.findUnique({
    where: { casNumber: cas },
    include: REFERENCE_INCLUDE,
  });
  return row ? mapChemicalReference(row) : null;
}

export async function listChemicalReferenceOptions(): Promise<
  Array<{ id: string; name: string; casNumber: string; hazardCategories: string[] }>
> {
  const rows = await db.chemicalReference.findMany({
    select: {
      id: true,
      name: true,
      casNumber: true,
      hazardCategory: { select: { categories: true } },
    },
    orderBy: { name: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    casNumber: r.casNumber,
    hazardCategories: parseJsonArray<string>(r.hazardCategory?.categories ?? "[]"),
  }));
}
