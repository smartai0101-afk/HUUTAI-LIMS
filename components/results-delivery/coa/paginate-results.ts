import type { ReportResultRow } from "@/types/result-delivery";

export type ResultsTableRow =
  | { type: "group"; index: number; label: string }
  | { type: "result"; row: ReportResultRow };

const DEFAULT_MAX_ROWS = 26;

export function paginateResults(
  results: ReportResultRow[],
  maxRowsPerPage = DEFAULT_MAX_ROWS,
): ResultsTableRow[][] {
  if (results.length === 0) return [[]];

  const groups = new Map<string, ReportResultRow[]>();
  for (const row of results) {
    const key = row.parameterGroup?.trim() || "General";
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const pages: ResultsTableRow[][] = [];
  let current: ResultsTableRow[] = [];
  let rowCount = 0;
  let groupIndex = 0;

  const flush = () => {
    if (current.length > 0) {
      pages.push(current);
      current = [];
      rowCount = 0;
    }
  };

  for (const [groupName, groupRows] of groups) {
    groupIndex += 1;
    const blockSize = 1 + groupRows.length;

    if (rowCount > 0 && rowCount + blockSize > maxRowsPerPage) {
      flush();
    }

    if (blockSize > maxRowsPerPage && rowCount === 0) {
      current.push({ type: "group", index: groupIndex, label: groupName });
      rowCount += 1;
      for (const row of groupRows) {
        if (rowCount >= maxRowsPerPage) {
          flush();
        }
        current.push({ type: "result", row });
        rowCount += 1;
      }
      continue;
    }

    current.push({ type: "group", index: groupIndex, label: groupName });
    rowCount += 1;
    for (const row of groupRows) {
      current.push({ type: "result", row });
      rowCount += 1;
    }
  }

  flush();
  return pages.length > 0 ? pages : [[]];
}

export function countCoaPages(resultCount: number, maxRowsPerPage = DEFAULT_MAX_ROWS): number {
  const pages = paginateResults(
    Array.from({ length: resultCount }, (_, i) => ({
      parameterName: `p${i}`,
      parameterGroup: "g",
      resultValue: "",
      unit: "",
      lod: "",
      loq: "",
      limitValue: "",
      evaluation: null,
      analystName: "",
    })),
    maxRowsPerPage,
  );
  return 1 + pages.length + 1;
}
