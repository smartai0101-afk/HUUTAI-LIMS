import { ELEMENT_SEED } from "@/lib/chem-info/elements-data";

const ELEMENT_SYMBOLS = ELEMENT_SEED.map((e) => e.symbol).sort((a, b) => b.length - a.length);
const ELEMENT_SET = new Set(ELEMENT_SYMBOLS);

/** Two-letter symbols only when second letter is lowercase (Co, Cl); CO3 → C + O3. */
export function normalizeElementCase(formula: string): string {
  let result = "";
  for (let i = 0; i < formula.length; i++) {
    const ch = formula[i]!;
    if (!/[A-Za-z]/.test(ch)) {
      result += ch;
      continue;
    }
    const upper = ch.toUpperCase();
    const next = formula[i + 1];
    if (next && /[a-z]/.test(next)) {
      const two = `${upper}${next}`;
      if (ELEMENT_SET.has(two)) {
        result += two;
        i += 1;
        continue;
      }
    }
    result += upper;
  }
  return result;
}

export type ParsedElement = { symbol: string; count: number };

export type ParsedFormulaPart = {
  label: string;
  coefficient: number;
  elements: ParsedElement[];
};

export type ParseFormulaResult =
  | { ok: true; parts: ParsedFormulaPart[]; aggregated: ParsedElement[] }
  | { ok: false; error: string };

/** Normalize hydrate/solvate separators to dot notation. */
export function normalizeFormulaInput(raw: string): string {
  return raw
    .replace(/\s/g, "")
    .replace(/[·•\u00B7\u2022]/g, ".");
}

/** Merge clathrate segments: [CH4, 5, 75H2O] → [CH4, 5.75H2O]. */
function mergeClathrateSegments(segments: string[]): string[] {
  if (segments.length < 3) return segments;

  const result: string[] = [];
  let i = 0;
  while (i < segments.length) {
    if (
      i + 2 < segments.length &&
      /^\d+$/.test(segments[i + 1]!) &&
      /^(\d+)(.+)$/.test(segments[i + 2]!)
    ) {
      const intPart = segments[i + 1]!;
      const fracMatch = segments[i + 2]!.match(/^(\d+)(.+)$/);
      if (fracMatch) {
        result.push(segments[i]!);
        result.push(`${intPart}.${fracMatch[1]}${fracMatch[2]}`);
        i += 3;
        continue;
      }
    }
    result.push(segments[i]!);
    i += 1;
  }
  return result;
}

function parseSegmentElements(
  segment: string,
  multiplier: number,
  counts: Map<string, number>,
): { ok: true; consumed: number } | { ok: false; error: string } {
  const normalized = normalizeElementCase(segment);
  let index = 0;

  while (index < normalized.length) {
    if (normalized[index] === "(") {
      const close = normalized.indexOf(")", index);
      if (close === -1) {
        return { ok: false, error: "Thiếu dấu đóng ngoặc )" };
      }
      const inner = normalized.slice(index + 1, close);
      index = close + 1;
      const groupCountMatch = normalized.slice(index).match(/^(\d+(?:\.\d+)?)/);
      const groupMult = groupCountMatch ? Number(groupCountMatch[1]) : 1;
      if (groupCountMatch) index += groupCountMatch[0].length;

      const innerCounts = new Map<string, number>();
      const innerResult = parseSegmentElements(inner, multiplier * groupMult, innerCounts);
      if (!innerResult.ok) return innerResult;
      for (const [sym, cnt] of innerCounts) {
        counts.set(sym, (counts.get(sym) ?? 0) + cnt);
      }
      continue;
    }

    const rest = normalized.slice(index);
    let matched = false;
    for (const symbol of ELEMENT_SYMBOLS) {
      const re = new RegExp(`^${symbol.replace(/([.*+?^${}()|[\]\\])/g, "\\$1")}(\\d*)`);
      const elementMatch = rest.match(re);
      if (elementMatch) {
        const count = (elementMatch[1] ? Number(elementMatch[1]) : 1) * multiplier;
        counts.set(symbol, (counts.get(symbol) ?? 0) + count);
        index += elementMatch[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      return { ok: false, error: `Ký tự không hợp lệ tại "${rest.slice(0, 8)}"` };
    }
  }

  return { ok: true, consumed: index };
}

function parsePartBody(
  body: string,
  coefficient: number,
): ParsedFormulaPart | { error: string } {
  const counts = new Map<string, number>();
  const result = parseSegmentElements(body, coefficient, counts);
  if (!result.ok) return { error: result.error };
  if (counts.size === 0) {
    return { error: "Công thức không hợp lệ" };
  }

  const label =
    coefficient === 1 ? body : `${Number.isInteger(coefficient) ? coefficient : coefficient}${body}`;

  return {
    label,
    coefficient,
    elements: Array.from(counts.entries()).map(([symbol, count]) => ({ symbol, count })),
  };
}

function splitAdductParts(formula: string): Array<{ coefficient: number; body: string }> {
  const rawParts = mergeClathrateSegments(formula.split("."));
  const parts: Array<{ coefficient: number; body: string }> = [];
  let pendingCoeff = 1;

  for (const raw of rawParts) {
    if (!raw) continue;

    if (/^\d+(?:\.\d+)?$/.test(raw)) {
      pendingCoeff *= Number(raw);
      continue;
    }

    const match = raw.match(/^(\d+(?:\.\d+)?)(.+)$/);
    if (match) {
      parts.push({
        coefficient: pendingCoeff * Number(match[1]),
        body: match[2]!,
      });
      pendingCoeff = 1;
    } else {
      parts.push({ coefficient: pendingCoeff, body: raw });
      pendingCoeff = 1;
    }
  }

  return parts;
}

export function parseMolecularFormulaParts(raw: string): ParseFormulaResult {
  const formula = normalizeFormulaInput(raw);
  if (!formula) {
    return { ok: false, error: "Công thức không hợp lệ" };
  }

  const partSpecs = splitAdductParts(formula);
  if (!partSpecs.length) {
    return { ok: false, error: "Công thức không hợp lệ" };
  }

  const parsedParts: ParsedFormulaPart[] = [];
  const aggregated = new Map<string, number>();

  for (const spec of partSpecs) {
    const partResult = parsePartBody(spec.body, spec.coefficient);
    if ("error" in partResult) {
      return { ok: false, error: partResult.error };
    }
    parsedParts.push(partResult);
    for (const { symbol, count } of partResult.elements) {
      aggregated.set(symbol, (aggregated.get(symbol) ?? 0) + count);
    }
  }

  return {
    ok: true,
    parts: parsedParts,
    aggregated: Array.from(aggregated.entries()).map(([symbol, count]) => ({ symbol, count })),
  };
}

/** Backward-compatible flat parse (aggregated elements across all adduct parts). */
export function parseMolecularFormula(formula: string): ParsedElement[] {
  const result = parseMolecularFormulaParts(formula);
  if (!result.ok) return [];
  return result.aggregated;
}
