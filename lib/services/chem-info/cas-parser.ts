const CAS_REGEX = /^\d{2,7}-\d{2}-\d$/;

export function isValidCasNumber(value: string): boolean {
  return CAS_REGEX.test(value.trim());
}

export function parseCasFromSynonyms(synonyms: string[]): string {
  for (const raw of synonyms) {
    const value = raw.trim();
    if (isValidCasNumber(value)) return value;
    const match = value.match(/\b(\d{2,7}-\d{2}-\d)\b/);
    if (match && isValidCasNumber(match[1])) return match[1];
  }
  return "";
}

export function isPlaceholderCas(casNumber: string): boolean {
  const v = casNumber.trim();
  return v.startsWith("NO-CAS-") || v.startsWith("PUBCHEM-");
}

export function buildPlaceholderCas(cid: number, inchiKey?: string): string {
  if (inchiKey) {
    const prefix = inchiKey.replace(/[^A-Z0-9]/gi, "").slice(0, 14).toUpperCase();
    if (prefix) return `NO-CAS-${prefix}`;
  }
  return `PUBCHEM-${cid}`;
}

export function normalizeChemicalName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}
