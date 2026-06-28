import type { ChemicalReferenceSyncStatus } from "@/types/chem-info";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<ChemicalReferenceSyncStatus, string> = {
  local: "Dữ liệu nội bộ",
  synced: "Đồng bộ PubChem",
  manual: "Nhập thủ công",
  needs_review: "Chưa xác minh",
};

const STATUS_STYLES: Record<ChemicalReferenceSyncStatus, string> = {
  local: "bg-slate-100 text-slate-700 ring-slate-200",
  synced: "bg-cyan-50 text-cyan-800 ring-cyan-200",
  manual: "bg-violet-50 text-violet-800 ring-violet-200",
  needs_review: "bg-amber-50 text-amber-800 ring-amber-200",
};

export function ChemicalSyncStatusBadge({
  syncStatus,
  source,
  className,
}: {
  syncStatus: ChemicalReferenceSyncStatus;
  source?: string;
  className?: string;
}) {
  const label =
    source?.toLowerCase() === "pubchem" && syncStatus === "synced"
      ? "PubChem"
      : STATUS_LABELS[syncStatus];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_STYLES[syncStatus],
        className,
      )}
    >
      {label}
    </span>
  );
}

export function sourceLabel(source: string) {
  if (source === "seed") return "Seed";
  if (source.toLowerCase() === "pubchem") return "PubChem";
  return source || "—";
}
