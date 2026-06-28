import type { SortOrder } from "./types";

/** Maps UI sortKey → Prisma orderBy value (field name or nested object). */
export type SortFieldMap = Record<string, string | Record<string, SortOrder>>;

export function buildPrismaOrderBy<T extends object>(
  sortBy: string,
  sortOrder: SortOrder,
  allowlist: SortFieldMap,
  defaultOrderBy: T | T[],
): T | T[] {
  const field = allowlist[sortBy];
  if (!field) return defaultOrderBy;

  if (typeof field === "string") {
    return { [field]: sortOrder } as T;
  }
  return field as T;
}
