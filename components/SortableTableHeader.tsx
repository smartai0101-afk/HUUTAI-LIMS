"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortOrder } from "@/lib/list-query";

type Props = {
  label: string;
  sortKey: string;
  activeSortBy?: string;
  activeSortOrder?: SortOrder;
  sortActive?: boolean;
  onSort: (sortKey: string) => void;
  className?: string;
};

function sortAriaLabel(label: string, sortKey: string, activeSortBy?: string, activeSortOrder?: SortOrder, sortActive?: boolean) {
  if (!sortActive || activeSortBy !== sortKey) {
    return `Sắp xếp theo ${label}`;
  }
  if (activeSortOrder === "asc") return `${label}, tăng dần`;
  return `${label}, giảm dần`;
}

export function SortableTableHeader({
  label,
  sortKey,
  activeSortBy,
  activeSortOrder,
  sortActive = false,
  onSort,
  className,
}: Props) {
  const isActive = sortActive && activeSortBy === sortKey;
  const ariaSort = isActive
    ? activeSortOrder === "asc"
      ? "ascending"
      : "descending"
    : "none";

  const Icon = isActive
    ? activeSortOrder === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      aria-label={sortAriaLabel(label, sortKey, activeSortBy, activeSortOrder, sortActive)}
      aria-sort={ariaSort}
      className={cn(
        "inline-flex items-center gap-1 rounded-md text-left font-medium transition-colors",
        "hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600",
        isActive ? "text-slate-900" : "text-slate-500",
        className,
      )}
    >
      <span>{label}</span>
      <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-cyan-700" : "text-slate-400")} aria-hidden />
    </button>
  );
}
