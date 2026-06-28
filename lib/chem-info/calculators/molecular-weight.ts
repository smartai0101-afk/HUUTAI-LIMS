import { ELEMENT_SEED } from "@/lib/chem-info/elements-data";
import {
  parseMolecularFormula,
  parseMolecularFormulaParts,
  type ParsedElement,
} from "./molecular-formula-parser";

export { parseMolecularFormula };

export type FormulaPartBreakdown = {
  label: string;
  coefficient: number;
  weight: number;
  elements: Array<{ symbol: string; count: number; mass: number; subtotal: number }>;
};

export type MolecularWeightResult =
  | {
      ok: true;
      weight: number;
      parts: FormulaPartBreakdown[];
      breakdown: Array<{ symbol: string; count: number; mass: number; subtotal: number }>;
    }
  | { ok: false; error: string };

const ATOMIC_MASS_BY_SYMBOL = new Map(ELEMENT_SEED.map((e) => [e.symbol, e.atomicMass]));

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function elementRows(
  elements: ParsedElement[],
): { rows: Array<{ symbol: string; count: number; mass: number; subtotal: number }>; weight: number; error?: string } {
  const rows: Array<{ symbol: string; count: number; mass: number; subtotal: number }> = [];
  let weight = 0;

  for (const { symbol, count } of elements) {
    const mass = ATOMIC_MASS_BY_SYMBOL.get(symbol);
    if (mass == null) return { rows: [], weight: 0, error: `Không tìm thấy nguyên tố: ${symbol}` };
    const subtotal = mass * count;
    weight += subtotal;
    rows.push({ symbol, count, mass, subtotal });
  }

  return { rows, weight };
}

export function calculateMolecularWeight(formula: string): MolecularWeightResult {
  const parsed = parseMolecularFormulaParts(formula);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const parts: FormulaPartBreakdown[] = [];
  let totalWeight = 0;

  for (const part of parsed.parts) {
    const { rows, weight, error } = elementRows(part.elements);
    if (error) return { ok: false, error };
    totalWeight += weight;
    parts.push({
      label: part.label,
      coefficient: part.coefficient,
      weight: round3(weight),
      elements: rows.map((r) => ({ ...r, subtotal: round3(r.subtotal) })),
    });
  }

  const { rows: breakdown, weight: aggWeight, error } = elementRows(parsed.aggregated);
  if (error) return { ok: false, error };

  return {
    ok: true,
    weight: round3(aggWeight),
    parts,
    breakdown: breakdown.map((r) => ({ ...r, subtotal: round3(r.subtotal) })),
  };
}
