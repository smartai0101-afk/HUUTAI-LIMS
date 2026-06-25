import { scheduleStatusLabel } from "@/lib/equipment-schedule";
import { cn } from "@/lib/utils";

const toneClass: Record<string, string> = {
  Green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Yellow: "bg-amber-50 text-amber-700 ring-amber-200",
  Red: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function ScheduleStatusBadge({ status }: { status: string }) {
  const tone = toneClass[status] ?? "bg-slate-50 text-slate-700 ring-slate-200";
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", tone)}>
      {scheduleStatusLabel(status)}
    </span>
  );
}
