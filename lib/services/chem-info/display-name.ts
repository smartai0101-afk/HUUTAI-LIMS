import { isValidCasNumber } from "@/lib/services/chem-info/cas-parser";

const SYSTEM_ID_PATTERNS = [
  /^DTXSID\d+/i,
  /^DTXCID\d+/i,
  /^CID\s*\d+$/i,
  /^CHEBI:\d+/i,
  /^EINECS\s*\d/i,
  /^EC[\s-]*\d/i,
  /^UNII-/i,
  /^SCHEMBL\d+/i,
  /^HMDB\d+/i,
  /^KEGG:/i,
  /^InChI=/i,
  /^InChIKey=/i,
  /^[A-Z]{14}-[A-Z]{10}-[A-Z]$/i,
  /^PubChem\s/i,
];

function isSystemIdentifier(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return true;
  if (isValidCasNumber(trimmed)) return true;
  if (/^\d+$/.test(trimmed)) return true;
  if (trimmed.length > 80) return true;
  return SYSTEM_ID_PATTERNS.some((re) => re.test(trimmed));
}

function isReadableName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 80) return false;
  if (isSystemIdentifier(trimmed)) return false;
  return /[A-Za-z]/.test(trimmed);
}

function scoreName(name: string, query?: string): number {
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  let score = 0;

  if (query) {
    const q = query.trim().toLowerCase();
    if (q && lower === q) score += 100;
    else if (q && lower.startsWith(q)) score += 60;
    else if (q && lower.includes(q)) score += 30;
  }

  if (/^[A-Za-z][A-Za-z0-9\s\-(),.]+$/.test(trimmed)) score += 10;
  if (trimmed.length <= 40) score += 5;
  if (trimmed.length <= 25) score += 3;
  if (/^[a-z]/.test(trimmed)) score += 2;

  return score;
}

export function pickPubChemDisplayName(
  synonyms: string[],
  options?: { query?: string; iupacName?: string; cid?: number },
): string {
  const query = options?.query?.trim();
  const candidates = synonyms.filter(isReadableName);

  if (candidates.length) {
    const ranked = [...candidates].sort((a, b) => scoreName(b, query) - scoreName(a, query));
    const best = ranked[0];
    if (best) return best;
  }

  const iupac = options?.iupacName?.trim();
  if (iupac && isReadableName(iupac)) return iupac;

  if (options?.cid != null) return `CID ${options.cid}`;
  return "Unknown compound";
}

export { isSystemIdentifier, isReadableName };
