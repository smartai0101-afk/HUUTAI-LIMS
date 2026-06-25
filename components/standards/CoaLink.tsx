"use client";

import { useRef, type MouseEvent } from "react";
import { ExternalLink } from "lucide-react";

export function CoaLink({ path }: { path: string | null | undefined }) {
  const openingRef = useRef(false);
  const normalized = path?.trim() ?? "";

  if (!normalized) {
    return <span className="text-slate-400">Không có COA</span>;
  }

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (openingRef.current) return;
    openingRef.current = true;
    window.open(normalized, "_blank", "noopener,noreferrer");
    window.setTimeout(() => {
      openingRef.current = false;
    }, 500);
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      onMouseDown={(event) => event.stopPropagation()}
      className="inline-flex items-center gap-1 text-sm font-medium text-cyan-700 hover:underline"
    >
      <ExternalLink className="h-3.5 w-3.5" />
      Xem COA
    </button>
  );
}
