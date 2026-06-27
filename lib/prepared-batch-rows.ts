export type PreparedBatchRowMeta = {
  rowKey: string;
  showGroupFields: boolean;
  parentCode: string;
  batchNumber: number;
};

type BatchRowSource = {
  id: string;
  parentCode: string;
  batchNumber: number;
  code: string;
};

/** Expand prepared records into grouped table rows (one row per batch, group header on first batch). */
export function expandPreparedToBatchRows<T extends BatchRowSource>(
  items: T[],
): Array<T & PreparedBatchRowMeta> {
  const byParent = new Map<string, T[]>();
  for (const item of items) {
    const key = item.parentCode || item.code;
    const list = byParent.get(key) ?? [];
    list.push(item);
    byParent.set(key, list);
  }

  const rows: Array<T & PreparedBatchRowMeta> = [];
  const sortedGroups = [...byParent.entries()].sort(([a], [b]) => a.localeCompare(b));

  for (const [, group] of sortedGroups) {
    const sorted = [...group].sort((a, b) => a.batchNumber - b.batchNumber || a.code.localeCompare(b.code));
    sorted.forEach((item, index) => {
      rows.push({
        ...item,
        rowKey: item.id,
        showGroupFields: index === 0,
        parentCode: item.parentCode || item.code,
        batchNumber: item.batchNumber,
      });
    });
  }

  return rows;
}

/** Render a cell value only on the first row of a multi-batch group. */
export function groupedPreparedCell<T>(showGroupFields: boolean, value: T, fallback: T = "" as T): T {
  return showGroupFields ? value : fallback;
}
