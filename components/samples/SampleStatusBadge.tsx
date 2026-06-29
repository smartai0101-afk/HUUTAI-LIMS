import type { SampleStatus } from "@prisma/client";
import { SAMPLE_STATUS_COLORS, SAMPLE_STATUS_LABELS } from "@/lib/sample-labels";
import { cn } from "@/lib/utils";

export function SampleStatusBadge({ status }: { status: SampleStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        SAMPLE_STATUS_COLORS[status] ?? "bg-slate-100 text-slate-700",
      )}
    >
      {SAMPLE_STATUS_LABELS[status] ?? status}
    </span>
  );
}
