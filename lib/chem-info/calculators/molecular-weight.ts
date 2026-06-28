/** Parse simple molecular formulas like H2SO4, C6H12O6, NaCl, (H2O)5 */
export function parseMolecularFormula(formula: string): Array<{ symbol: string; count: number }> {
  const cleaned = formula.replace(/\s/g, "");
  if (!cleaned) return [];

  const counts = new Map<string, number>();

  function addSymbol(symbol: string, count: number) {
    counts.set(symbol, (counts.get(symbol) ?? 0) + count);
  }

  function parseSegment(segment: string, multiplier: number): number {
    let index = 0;
    while (index < segment.length) {
      if (segment[index] === "(") {
        const close = segment.indexOf(")", index);
        if (close === -1) break;
        const inner = segment.slice(index + 1, close);
        index = close + 1;
        const groupCountMatch = segment.slice(index).match(/^(\d+)/);
        const groupMult = groupCountMatch ? Number(groupCountMatch[1]) : 1;
        if (groupCountMatch) index += groupCountMatch[1].length;
        parseSegment(inner, multiplier * groupMult);
        continue;
      }

      const elementMatch = segment.slice(index).match(/^([A-Z][a-z]?)(\d*)/);
      if (!elementMatch) break;
      const symbol = elementMatch[1];
      const count = (elementMatch[2] ? Number(elementMatch[2]) : 1) * multiplier;
      addSymbol(symbol, count);
      index += elementMatch[0].length;
    }
    return index;
  }

  parseSegment(cleaned, 1);

  return Array.from(counts.entries()).map(([symbol, count]) => ({ symbol, count }));
}

export type MolecularWeightResult =
  | { ok: true; weight: number; breakdown: Array<{ symbol: string; count: number; mass: number; subtotal: number }> }
  | { ok: false; error: string };

import { ELEMENT_SEED } from "@/lib/chem-info/elements-data";

const ATOMIC_MASS_BY_SYMBOL = new Map(ELEMENT_SEED.map((e) => [e.symbol, e.atomicMass]));

export function calculateMolecularWeight(formula: string): MolecularWeightResult {
  const parsed = parseMolecularFormula(formula);
  if (!parsed.length) return { ok: false, error: "Công thức không hợp lệ" };

  const rows: Array<{ symbol: string; count: number; mass: number; subtotal: number }> = [];
  let weight = 0;

  for (const { symbol, count } of parsed) {
    const mass = ATOMIC_MASS_BY_SYMBOL.get(symbol);
    if (mass == null) return { ok: false, error: `Không tìm thấy nguyên tố: ${symbol}` };
    const subtotal = mass * count;
    weight += subtotal;
    rows.push({ symbol, count, mass, subtotal });
  }

  return { ok: true, weight: Math.round(weight * 1000) / 1000, breakdown: rows };
}
