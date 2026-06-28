import { db } from "@/lib/db";
import {
  buildPlaceholderCas,
  isValidCasNumber,
  normalizeChemicalName,
  parseCasFromSynonyms,
} from "@/lib/services/chem-info/cas-parser";
import { pickPubChemDisplayName } from "@/lib/services/chem-info/display-name";
import { PubChemSearchError } from "@/lib/services/chem-info/pubchem-errors";

const CACHE_TTL_SEARCH_MS = 24 * 60 * 60 * 1000;
const CACHE_TTL_COMPOUND_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_SEARCH_LIMIT = 20;
const FETCH_BATCH_SIZE = 5;
const MIN_REQUEST_INTERVAL_MS = 340;
const PUBCHEM_FETCH_TIMEOUT_MS = 15_000;

let lastRequestAt = 0;

export type PubChemSearchMode = "all" | "name" | "cas" | "formula";

export type PubChemSearchHit = {
  cid: number;
  name: string;
  cas?: string;
  molecularFormula?: string;
  molecularWeight?: number | null;
  structure2dUrl: string;
};

export type PubChemPhysicalProperties = {
  meltingPoint?: string;
  boilingPoint?: string;
  density?: string;
  xlogp?: number | null;
};

export type PubChemCompound = {
  cid: number;
  name: string;
  iupacName: string;
  casNumber: string;
  molecularFormula: string;
  molecularWeight: number | null;
  smiles: string;
  isomericSmiles: string;
  inchi: string;
  inchiKey: string;
  synonyms: string[];
  physicalProperties: PubChemPhysicalProperties;
  structure2dUrl: string;
};

export type PubChemReferenceDraft = {
  casNumber: string;
  name: string;
  normalizedName: string;
  iupacName: string;
  molecularFormula: string;
  molecularWeight: number | null;
  pubchemCid: number;
  smiles: string;
  isomericSmiles: string;
  inchi: string;
  inchiKey: string;
  structure2dUrl: string;
  synonyms: string[];
  physicalProperties: PubChemPhysicalProperties;
  extendedData: {
    synonyms: string[];
    pubchemUrl: string;
    externalHazardRef: boolean;
  };
  needsReview: boolean;
};

async function throttlePubChem() {
  const now = Date.now();
  const wait = MIN_REQUEST_INTERVAL_MS - (now - lastRequestAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

async function pubChemFetch(url: string): Promise<Response> {
  await throttlePubChem();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PUBCHEM_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 0 },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new PubChemSearchError(
        "TIMEOUT",
        "PubChem không phản hồi trong thời gian cho phép (timeout 15 giây). Vui lòng thử lại sau.",
      );
    }
    throw new PubChemSearchError(
      "UNREACHABLE",
      "Không thể kết nối tới PubChem. Kiểm tra kết nối mạng, firewall hoặc VPN rồi thử lại.",
    );
  } finally {
    clearTimeout(timer);
  }
}

async function parsePubChemJson<T>(res: Response, context: string): Promise<T> {
  let text: string;
  try {
    text = await res.text();
  } catch {
    throw new PubChemSearchError(
      "UNREACHABLE",
      "Không thể đọc phản hồi từ PubChem. Kiểm tra kết nối mạng rồi thử lại.",
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new PubChemSearchError(
      "PARSE_ERROR",
      `Lỗi parse dữ liệu PubChem (${context}). Dữ liệu trả về không đúng định dạng JSON.`,
    );
  }
}

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const row = await db.pubChemCache.findUnique({ where: { cacheKey: key } });
    if (!row || row.expiresAt < new Date()) return null;
    try {
      return JSON.parse(row.payload) as T;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

async function setCache(key: string, payload: unknown, ttlMs: number) {
  try {
    const expiresAt = new Date(Date.now() + ttlMs);
    await db.pubChemCache.upsert({
      where: { cacheKey: key },
      create: { cacheKey: key, payload: JSON.stringify(payload), expiresAt },
      update: { payload: JSON.stringify(payload), expiresAt },
    });
  } catch {
    /* cache write failure should not block search */
  }
}

function structure2dUrl(cid: number) {
  return `https://pubchem.ncbi.nlm.nih.gov/image/imagefly.cgi?cid=${cid}&width=300&height=300`;
}

function pubChemCompoundUrl(cid: number) {
  return `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`;
}

async function fetchCidsByName(query: string, limit: number): Promise<number[]> {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/cids/JSON`;
  const res = await pubChemFetch(url);
  if (!res.ok) return [];
  const data = await parsePubChemJson<{ IdentifierList?: { CID?: number[] } }>(res, "name/cids");
  return data.IdentifierList?.CID?.slice(0, limit) ?? [];
}

async function fetchCidsByCas(cas: string, limit: number): Promise<number[]> {
  return fetchCidsByName(cas, limit);
}

async function fetchCidsByFormula(formula: string, limit: number): Promise<number[]> {
  const encoded = encodeURIComponent(formula.replace(/\s+/g, ""));
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/fastformula/${encoded}/cids/JSON`;
  const res = await pubChemFetch(url);
  if (!res.ok) return [];
  const data = await parsePubChemJson<{ IdentifierList?: { CID?: number[] } }>(res, "formula/cids");
  return data.IdentifierList?.CID?.slice(0, limit) ?? [];
}

async function resolveSearchCids(
  query: string,
  mode: PubChemSearchMode,
  limit: number,
): Promise<number[]> {
  const q = query.trim();
  if (!q) return [];

  if (mode === "cas" || (mode === "all" && isValidCasNumber(q))) {
    const cids = await fetchCidsByCas(q, limit);
    if (cids.length) return cids;
    if (mode === "cas") return [];
  }

  if (mode === "formula") {
    return fetchCidsByFormula(q, limit);
  }

  if (mode === "name") {
    return fetchCidsByName(q, limit);
  }

  const byName = await fetchCidsByName(q, limit);
  if (byName.length) return byName;

  if (/^[A-Za-z0-9+\-\[\]()]+$/.test(q.replace(/\s/g, ""))) {
    const byFormula = await fetchCidsByFormula(q, limit);
    if (byFormula.length) return byFormula;
  }

  return [];
}

async function fetchSynonyms(cid: number): Promise<string[]> {
  const cacheKey = `synonyms:${cid}`;
  const cached = await getCached<string[]>(cacheKey);
  if (cached) return cached;

  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`;
  const res = await pubChemFetch(url);
  if (!res.ok) return [];
  const data = await parsePubChemJson<{
    InformationList?: { Information?: Array<{ Synonym?: string[] }> };
  }>(res, "synonyms");
  const synonyms = data.InformationList?.Information?.[0]?.Synonym?.slice(0, 100) ?? [];
  await setCache(cacheKey, synonyms, CACHE_TTL_COMPOUND_MS);
  return synonyms;
}

export async function fetchPubChemCompound(
  cid: number,
  options?: { query?: string },
): Promise<PubChemCompound | null> {
  const cacheKey = `cid:v3:${cid}:${(options?.query ?? "").toLowerCase()}`;
  const cached = await getCached<PubChemCompound>(cacheKey);
  if (cached) return cached;

  const propUrl =
    "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/" +
    `${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IsomericSMILES,InChI,InChIKey,IUPACName,ExactMass,XLogP/JSON`;
  const res = await pubChemFetch(propUrl);
  if (!res.ok) return null;
  const data = await parsePubChemJson<{
    PropertyTable?: {
      Properties?: Array<{
        CID: number;
        MolecularFormula?: string;
        MolecularWeight?: number | string;
        CanonicalSMILES?: string;
        IsomericSMILES?: string;
        InChI?: string;
        InChIKey?: string;
        IUPACName?: string;
        XLogP?: number;
      }>;
    };
  }>(res, "properties");
  const prop = data.PropertyTable?.Properties?.[0];
  if (!prop) return null;

  const synonyms = await fetchSynonyms(cid);
  const casNumber = parseCasFromSynonyms(synonyms);

  const displayName = pickPubChemDisplayName(synonyms, {
    query: options?.query,
    iupacName: prop.IUPACName ?? "",
    cid,
  });

  const molecularWeightRaw = prop.MolecularWeight;
  const molecularWeight =
    molecularWeightRaw == null || molecularWeightRaw === ""
      ? null
      : Number(molecularWeightRaw);

  const compound: PubChemCompound = {
    cid: prop.CID,
    name: displayName,
    iupacName: prop.IUPACName ?? "",
    casNumber,
    molecularFormula: prop.MolecularFormula ?? "",
    molecularWeight: Number.isFinite(molecularWeight) ? molecularWeight : null,
    smiles: prop.CanonicalSMILES ?? "",
    isomericSmiles: prop.IsomericSMILES ?? prop.CanonicalSMILES ?? "",
    inchi: prop.InChI ?? "",
    inchiKey: prop.InChIKey ?? "",
    synonyms,
    physicalProperties: {
      xlogp: prop.XLogP ?? null,
    },
    structure2dUrl: structure2dUrl(cid),
  };

  await setCache(cacheKey, compound, CACHE_TTL_COMPOUND_MS);
  return compound;
}

async function fetchCompoundsInBatches(
  cids: number[],
  query?: string,
): Promise<PubChemCompound[]> {
  const compounds: PubChemCompound[] = [];
  for (let i = 0; i < cids.length; i += FETCH_BATCH_SIZE) {
    const batch = cids.slice(i, i + FETCH_BATCH_SIZE);
    const results = await Promise.all(batch.map((cid) => fetchPubChemCompound(cid, { query })));
    for (const compound of results) {
      if (compound) compounds.push(compound);
    }
  }
  return compounds;
}

export async function searchPubChem(
  query: string,
  mode: PubChemSearchMode = "all",
  limit = DEFAULT_SEARCH_LIMIT,
): Promise<PubChemSearchHit[]> {
  const q = query.trim();
  if (!q) return [];

  const cappedLimit = Math.min(Math.max(limit, 1), DEFAULT_SEARCH_LIMIT);
  const cacheKey = `search:v3:${mode}:${q.toLowerCase()}:${cappedLimit}`;
  const cached = await getCached<PubChemSearchHit[]>(cacheKey);
  if (cached) return cached;

  const cids = await resolveSearchCids(q, mode, cappedLimit);
  if (!cids.length) {
    return [];
  }

  const compounds = await fetchCompoundsInBatches(cids, q);
  const hits: PubChemSearchHit[] = compounds.map((compound) => ({
    cid: compound.cid,
    name: compound.name,
    cas: compound.casNumber || undefined,
    molecularFormula: compound.molecularFormula || undefined,
    molecularWeight: compound.molecularWeight,
    structure2dUrl: compound.structure2dUrl,
  }));

  await setCache(cacheKey, hits, CACHE_TTL_SEARCH_MS);
  return hits;
}

export function mapPubChemToReference(compound: PubChemCompound): PubChemReferenceDraft {
  const casNumber =
    compound.casNumber ||
    buildPlaceholderCas(compound.cid, compound.inchiKey || undefined);
  const listSynonyms = compound.synonyms.slice(0, 20);
  const extendedSynonyms = compound.synonyms.slice(0, 100);

  return {
    casNumber,
    name: compound.name,
    normalizedName: normalizeChemicalName(compound.name),
    iupacName: compound.iupacName,
    molecularFormula: compound.molecularFormula,
    molecularWeight: compound.molecularWeight,
    pubchemCid: compound.cid,
    smiles: compound.smiles,
    isomericSmiles: compound.isomericSmiles,
    inchi: compound.inchi,
    inchiKey: compound.inchiKey,
    structure2dUrl: compound.structure2dUrl,
    synonyms: listSynonyms,
    physicalProperties: compound.physicalProperties,
    extendedData: {
      synonyms: extendedSynonyms,
      pubchemUrl: pubChemCompoundUrl(compound.cid),
      externalHazardRef: true,
    },
    needsReview: !compound.casNumber,
  };
}

export async function enrichReferenceFromPubChem(referenceId: string): Promise<{ error?: string }> {
  const { refreshReferenceFromPubChem } = await import(
    "@/lib/services/chem-info/chemical-reference-sync"
  );
  const result = await refreshReferenceFromPubChem(referenceId, {
    performedBy: "system",
    force: false,
  });
  return result.error ? { error: result.error } : {};
}
