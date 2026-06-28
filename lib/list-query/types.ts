export type SortOrder = "asc" | "desc";

export interface ListQueryDefaults {
  sortBy: string;
  sortOrder: SortOrder;
  page?: number;
  limit?: number;
}

export interface ListQueryParams {
  q: string;
  sortBy: string;
  sortOrder: SortOrder;
  page: number;
  limit: number;
  /** True when sortBy/sortOrder are explicitly set in URL (user clicked a column). */
  sortActive: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type SearchParamsInput = Record<string, string | string[] | undefined>;
