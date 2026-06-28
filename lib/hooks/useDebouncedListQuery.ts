"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useListQueryState } from "@/lib/hooks/useListQueryState";

type Options = {
  debounceMs?: number;
  initialQuery?: string;
};

export function useDebouncedListQuery(options: Options = {}) {
  const { debounceMs = 450, initialQuery = "" } = options;
  const { setQuery, current, ...rest } = useListQueryState();
  const [inputValue, setInputValue] = useState(initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFocusedRef = useRef(false);
  const lastCommittedRef = useRef(initialQuery.trim());

  // Sync URL → input only when user is not actively typing (back/forward, external nav).
  useEffect(() => {
    const urlQuery = initialQuery.trim();
    if (isFocusedRef.current) return;
    if (urlQuery !== lastCommittedRef.current) {
      setInputValue(initialQuery);
      lastCommittedRef.current = urlQuery;
    }
  }, [initialQuery]);

  const commitSearch = useCallback(
    (value?: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      const trimmed = (value ?? inputValue).trim();
      if (trimmed === lastCommittedRef.current) return;
      lastCommittedRef.current = trimmed;
      setQuery(trimmed);
    },
    [inputValue, setQuery],
  );

  const onSearchChange = useCallback(
    (value: string) => {
      setInputValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const trimmed = value.trim();
        if (trimmed === lastCommittedRef.current) return;
        lastCommittedRef.current = trimmed;
        setQuery(trimmed);
      }, debounceMs);
    },
    [debounceMs, setQuery],
  );

  const onSearchFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const onSearchBlur = useCallback(() => {
    isFocusedRef.current = false;
    commitSearch();
  }, [commitSearch]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    ...rest,
    current,
    setQuery,
    inputValue,
    onSearchChange,
    onSearchFocus,
    onSearchBlur,
    commitSearch,
  };
}
