"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { checkCodeAvailabilityAction, previewNextCode } from "@/lib/actions/code-generator";
import type { CodePrefix } from "@/lib/code-prefixes";
import { formatSequenceDisplay } from "@/lib/code-prefixes";

type Props = {
  prefix: CodePrefix;
  sequence: string;
  onSequenceChange: (value: string) => void;
  mode: "create" | "edit";
  disabled?: boolean;
  label?: string;
  className?: string;
};

export function CodeSequenceInput({
  prefix,
  sequence,
  onSequenceChange,
  mode,
  disabled = false,
  label = "Số thứ tự",
  className = "",
}: Props) {
  const [status, setStatus] = useState<{ message: string; ok: boolean } | null>(null);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedNext = useRef(false);

  useEffect(() => {
    if (mode !== "create" || loadedNext.current || sequence.trim()) return;
    loadedNext.current = true;
    startTransition(async () => {
      const result = await previewNextCode(prefix);
      if ("error" in result) return;
      onSequenceChange(formatSequenceDisplay(result.sequenceNumber));
    });
  }, [mode, prefix, sequence, onSequenceChange]);

  useEffect(() => {
    if (mode === "edit") {
      setStatus(null);
      return;
    }
    const raw = sequence.trim();
    if (!raw) {
      setStatus(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await checkCodeAvailabilityAction(prefix, raw);
        if ("error" in result) {
          setStatus({ message: result.error, ok: false });
          return;
        }
        setStatus({ message: result.message, ok: result.available });
      });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [prefix, sequence, mode]);

  const readOnly = mode === "edit" || disabled;

  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-stretch gap-2">
        <span className="inline-flex min-w-[4.5rem] items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
          {prefix}-
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={sequence}
          readOnly={readOnly}
          disabled={disabled}
          onChange={(e) => onSequenceChange(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
          placeholder="0001"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
        />
      </div>
      {mode === "create" && status && (
        <p className={`mt-1 text-xs ${status.ok ? "text-emerald-600" : "text-amber-600"}`}>
          {pending ? "Đang kiểm tra…" : status.message}
        </p>
      )}
      {mode === "edit" && sequence && (
        <p className="mt-1 text-xs text-slate-500">
          {prefix}-{formatSequenceDisplay(Number.parseInt(sequence, 10) || 0)}
        </p>
      )}
    </div>
  );
}

export function formatFullCode(prefix: CodePrefix, sequence: string): string {
  const n = Number.parseInt(sequence.replace(/\D/g, ""), 10);
  if (!Number.isFinite(n) || n < 1) return "";
  return `${prefix}-${formatSequenceDisplay(n)}`;
}
