import { db } from "@/lib/db";

/** Expand a code to include alias mappings for search/filter. */
export async function expandCodeSearchTerms(code: string): Promise<string[]> {
  const trimmed = code.trim();
  if (!trimmed) return [];

  const terms = new Set<string>([trimmed.toLowerCase()]);
  const aliases = await db.codeAlias.findMany({
    where: { OR: [{ oldCode: trimmed }, { newCode: trimmed }] },
    select: { oldCode: true, newCode: true },
  });

  for (const alias of aliases) {
    terms.add(alias.oldCode.toLowerCase());
    terms.add(alias.newCode.toLowerCase());
  }

  return [...terms];
}

export function matchesCodeSearch(query: string, codes: string[], expandedTerms?: string[]): boolean {
  const q = query.toLowerCase();
  if (!q) return true;
  if (codes.some((c) => c.toLowerCase().includes(q))) return true;
  return expandedTerms?.some((t) => t.includes(q)) ?? false;
}
