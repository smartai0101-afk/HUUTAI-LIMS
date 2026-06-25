"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export type SearchableOption = {
  value: string;
  label: string;
  searchText?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
  disabled?: boolean;
};

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  emptyLabel = "Không có kết quả",
  className = "",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const haystack = (o.searchText ?? o.label).toLowerCase();
      return haystack.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 text-left text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
      >
        <span className={selected ? "text-slate-900" : "text-slate-400"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm mã, tên, lot..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-8 pr-2 text-sm outline-none focus:border-cyan-300"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length ? (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50 ${
                    opt.value === value ? "bg-cyan-50 text-cyan-900" : "text-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))
            ) : (
              <p className="px-2 py-2 text-sm text-slate-400">{emptyLabel}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
