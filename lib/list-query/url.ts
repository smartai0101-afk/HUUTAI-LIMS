import type { SortOrder } from "./types";

export function buildListSearchParams(
  current: URLSearchParams,
  updates: Record<string, string | null | undefined>,
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }
  return next;
}

export function nextSortParams(
  columnKey: string,
  currentSortBy: string | undefined,
  currentSortOrder: SortOrder | undefined,
): { sortBy: string | null; sortOrder: SortOrder | null } {
  if (currentSortBy !== columnKey) {
    return { sortBy: columnKey, sortOrder: "asc" };
  }
  if (currentSortOrder === "asc") {
    return { sortBy: columnKey, sortOrder: "desc" };
  }
  return { sortBy: null, sortOrder: null };
}

export function listQueryToSearchString(params: URLSearchParams): string {
  const s = params.toString();
  return s ? `?${s}` : "";
}
