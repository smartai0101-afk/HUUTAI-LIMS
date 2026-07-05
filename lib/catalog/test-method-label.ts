import type { TestMethodView } from "@/types/catalog";

type TestMethodLabelInput = Pick<TestMethodView, "name" | "categoryName" | "code">;

function nameAlreadyIncludesCategory(m: TestMethodLabelInput): boolean {
  const c = m.categoryName?.trim();
  const n = m.name?.trim();
  if (!c || !n) return false;
  return n === c || n.startsWith(`${c} ·`) || n.startsWith(`${c} -`);
}

/** Display label for checkbox options in multi-select. */
export function testMethodOptionLabel(m: TestMethodLabelInput): string {
  if (m.categoryName && m.name !== m.categoryName && !nameAlreadyIncludesCategory(m)) {
    return `${m.categoryName} · ${m.name}`;
  }
  return m.name;
}

/** Short name for compact list display (usually the test method name). */
export function testMethodShortLabel(m: TestMethodLabelInput): string {
  return m.name?.trim() || m.code?.trim() || "";
}

export type TestMethodCategoryEntry<T extends TestMethodLabelInput> = {
  categoryName: string;
  items: T[];
};

/** Group test methods by categoryName, sorted by Vietnamese locale. */
export function groupTestMethodsByCategory<T extends TestMethodLabelInput>(
  testMethods: T[],
): TestMethodCategoryEntry<T>[] {
  const map = new Map<string, T[]>();
  for (const t of testMethods) {
    const key = t.categoryName?.trim() || "Khác";
    const list = map.get(key) ?? [];
    list.push(t);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "vi"))
    .map(([categoryName, items]) => ({
      categoryName,
      items: items.sort((a, b) =>
        testMethodShortLabel(a).localeCompare(testMethodShortLabel(b), "vi"),
      ),
    }));
}

export type TestMethodGroupLine = {
  categoryName: string;
  count: number;
  visibleNames: string[];
  overflow: number;
  fullNames: string[];
  tooltipLine: string;
};

/** Format one category line: "Dư lượng thuốc BVTV (5): Acetamiprid, Abamectin +3" */
export function formatTestMethodGroupLine<T extends TestMethodLabelInput>(
  categoryName: string,
  items: T[],
  options?: { maxNames?: number },
): TestMethodGroupLine {
  const maxNames = options?.maxNames ?? 3;
  const fullNames = items.map((t) => testMethodShortLabel(t));
  const visibleNames = fullNames.slice(0, maxNames);
  const overflow = Math.max(0, fullNames.length - maxNames);
  const count = items.length;
  const tooltipLine = `${categoryName}: ${fullNames.join(", ")}`;

  return {
    categoryName,
    count,
    visibleNames,
    overflow,
    fullNames,
    tooltipLine,
  };
}

/** Full multi-line tooltip for all test method groups. */
export function formatTestMethodsTooltip<T extends TestMethodLabelInput>(
  testMethods: T[],
): string {
  return groupTestMethodsByCategory(testMethods)
    .map(({ categoryName, items }) => formatTestMethodGroupLine(categoryName, items).tooltipLine)
    .join("\n");
}

/** Denormalized analyte cache string from selected test methods. */
export function buildAnalyteCache<T extends TestMethodLabelInput>(testMethods: T[]): string {
  return testMethods.map((t) => testMethodShortLabel(t)).join(", ");
}
