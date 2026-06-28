"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildListSearchParams, listQueryToSearchString, nextSortParams, type SortOrder } from "@/lib/list-query";

type Options = {
  /** Reset page to 1 when updating filters/sort/search. Default true. */
  resetPageOnChange?: boolean;
};

export function useListQueryState(options: Options = {}) {
  const { resetPageOnChange = true } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  const pushParams = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const next = buildListSearchParams(current, updates);
      router.replace(`${pathname}${listQueryToSearchString(next)}`, { scroll: false });
    },
    [current, pathname, router],
  );

  const setQuery = useCallback(
    (q: string) => {
      pushParams({ q: q || null, ...(resetPageOnChange ? { page: null } : {}) });
    },
    [pushParams, resetPageOnChange],
  );

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      pushParams({ [key]: value, ...(resetPageOnChange ? { page: null } : {}) });
    },
    [pushParams, resetPageOnChange],
  );

  const setFilters = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      pushParams({ ...updates, ...(resetPageOnChange ? { page: null } : {}) });
    },
    [pushParams, resetPageOnChange],
  );

  const toggleSort = useCallback(
    (sortKey: string) => {
      const currentSortBy = current.get("sortBy") || undefined;
      const currentSortOrder = (current.get("sortOrder") as SortOrder | null) || undefined;
      const next = nextSortParams(sortKey, currentSortBy, currentSortOrder);
      pushParams({
        sortBy: next.sortBy,
        sortOrder: next.sortOrder,
        ...(resetPageOnChange ? { page: null } : {}),
      });
    },
    [current, pushParams, resetPageOnChange],
  );

  const setPage = useCallback(
    (page: number) => {
      pushParams({ page: page <= 1 ? null : String(page) });
    },
    [pushParams],
  );

  const setLimit = useCallback(
    (limit: number) => {
      pushParams({ limit: String(limit), page: null });
    },
    [pushParams],
  );

  return {
    searchParams,
    current,
    setQuery,
    setFilter,
    setFilters,
    toggleSort,
    setPage,
    setLimit,
    pushParams,
  };
}
