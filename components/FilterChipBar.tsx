"use client";

import { TouchHorizontalScroll } from "@/components/TouchHorizontalScroll";
import { cn } from "@/lib/utils";

export type FilterChipOption = {
  value: string;
  label: string;
};

type FilterChipBarProps<T extends string = string> = {
  options: FilterChipOption[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
};

export function FilterChipBar<T extends string = string>({
  options,
  value,
  onChange,
  className,
  activeClassName = "bg-cyan-700 text-white",
  inactiveClassName = "bg-slate-100 text-slate-700",
}: FilterChipBarProps<T>) {
  return (
    <TouchHorizontalScroll snap showFade className={className}>
      <div className="flex flex-nowrap gap-2 pb-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value as T)}
            className={cn(
              "shrink-0 snap-start rounded-xl px-3 py-2 text-sm transition-colors",
              value === option.value ? activeClassName : inactiveClassName,
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </TouchHorizontalScroll>
  );
}
