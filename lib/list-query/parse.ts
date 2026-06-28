import type { ListQueryDefaults, ListQueryParams, SearchParamsInput, SortOrder } from "./types";

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseSortOrder(value: string | undefined): SortOrder | null {
  if (value === "asc" || value === "desc") return value;
  return null;
}

export function parsePage(value: string | undefined, fallback = 1): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

export function parseLimit(value: string | undefined, defaultLimit: number, max = 200): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return defaultLimit;
  return Math.min(parsed, max);
}

export function parseListQueryParams(
  searchParams: SearchParamsInput,
  defaults: ListQueryDefaults,
  sortAllowlist: readonly string[],
): ListQueryParams {
  const q = firstValue(searchParams.q)?.trim() ?? "";
  const rawSortBy = firstValue(searchParams.sortBy);
  const rawSortOrder = firstValue(searchParams.sortOrder);
  const page = parsePage(firstValue(searchParams.page), defaults.page ?? 1);
  const limit = parseLimit(firstValue(searchParams.limit), defaults.limit ?? 50);

  const sortActive = Boolean(
    rawSortBy && sortAllowlist.includes(rawSortBy) && parseSortOrder(rawSortOrder),
  );

  const sortBy =
    sortActive && rawSortBy && sortAllowlist.includes(rawSortBy) ? rawSortBy : defaults.sortBy;
  const sortOrder =
    sortActive && parseSortOrder(rawSortOrder) ? parseSortOrder(rawSortOrder)! : defaults.sortOrder;

  return { q, sortBy, sortOrder, page, limit, sortActive };
}

export function getSkipTake(page: number, limit: number): { skip: number; take: number } {
  return { skip: (page - 1) * limit, take: limit };
}
