import type { SampleMatrixView } from "@/types/catalog";

type MatrixLabelInput = Pick<SampleMatrixView, "name" | "groupName">;

function nameAlreadyIncludesGroup(m: MatrixLabelInput): boolean {
  const g = m.groupName?.trim();
  const n = m.name?.trim();
  if (!g || !n) return false;
  return n === g || n.startsWith(`${g} ·`) || n.startsWith(`${g} -`);
}

/** Display label for matrix dropdown options and list columns. */
export function matrixOptionLabel(m: MatrixLabelInput): string {
  if (m.groupName && m.name !== m.groupName && !nameAlreadyIncludesGroup(m)) {
    return `${m.groupName} · ${m.name}`;
  }
  return m.name;
}

export function matrixDisplayLabel(
  matrix: { code: string; name: string; groupName: string } | null | undefined,
): string | null {
  if (!matrix) return null;
  return matrixOptionLabel(matrix);
}

/** Short matrix name without repeating the group prefix (for compact list display). */
export function matrixShortLabel(m: MatrixLabelInput): string {
  const g = m.groupName?.trim();
  const n = m.name?.trim();
  if (!g || !n) return n ?? "";
  if (n.startsWith(`${g} - `)) return n.slice(g.length + 3);
  if (n.startsWith(`${g} · `)) return n.slice(g.length + 3);
  return n;
}

export type MatrixGroupEntry<T extends MatrixLabelInput> = {
  groupName: string;
  items: T[];
};

/** Group matrices by groupName, sorted by Vietnamese locale. */
export function groupMatricesByGroup<T extends MatrixLabelInput>(
  matrices: T[],
): MatrixGroupEntry<T>[] {
  const map = new Map<string, T[]>();
  for (const m of matrices) {
    const key = m.groupName?.trim() || "Khác";
    const list = map.get(key) ?? [];
    list.push(m);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "vi"))
    .map(([groupName, items]) => ({
      groupName,
      items: items.sort((a, b) =>
        matrixShortLabel(a).localeCompare(matrixShortLabel(b), "vi"),
      ),
    }));
}

export type MatrixGroupLine = {
  groupName: string;
  count: number;
  visibleNames: string[];
  overflow: number;
  fullNames: string[];
  tooltipLine: string;
};

/** Format one group line: "Thực phẩm (6): Rau củ, Thịt, Thủy sản +3" */
export function formatMatrixGroupLine<T extends MatrixLabelInput>(
  groupName: string,
  items: T[],
  options?: { maxNames?: number },
): MatrixGroupLine {
  const maxNames = options?.maxNames ?? 3;
  const fullNames = items.map((m) => matrixShortLabel(m));
  const visibleNames = fullNames.slice(0, maxNames);
  const overflow = Math.max(0, fullNames.length - maxNames);
  const count = items.length;
  const tooltipLine = `${groupName}: ${fullNames.join(", ")}`;

  return {
    groupName,
    count,
    visibleNames,
    overflow,
    fullNames,
    tooltipLine,
  };
}

/** Full multi-line tooltip for all matrix groups. */
export function formatMatricesTooltip<T extends MatrixLabelInput>(matrices: T[]): string {
  return groupMatricesByGroup(matrices)
    .map(({ groupName, items }) => formatMatrixGroupLine(groupName, items).tooltipLine)
    .join("\n");
}
