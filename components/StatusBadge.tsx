import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  Ready: "bg-emerald-100 text-emerald-700",
  Available: "bg-emerald-100 text-emerald-700",
  "Expiring Soon": "bg-amber-100 text-amber-700",
  "Low Stock": "bg-amber-100 text-amber-700",
  Expired: "bg-rose-100 text-rose-700",
  "Pending Disposal": "bg-violet-100 text-violet-700",
  Approved: "bg-emerald-100 text-emerald-700",
  "Pending Review": "bg-amber-100 text-amber-700",
  "In Use": "bg-sky-100 text-sky-700",
  New: "bg-sky-100 text-sky-700",
  "Pending Approval": "bg-amber-100 text-amber-700",
  Cancelled: "bg-slate-200 text-slate-700",
  Matched: "bg-emerald-100 text-emerald-700",
  Missing: "bg-rose-100 text-rose-700",
  Over: "bg-amber-100 text-amber-700",
  "Wrong Location": "bg-orange-100 text-orange-700",
  Critical: "bg-rose-100 text-rose-700",
  Warning: "bg-amber-100 text-amber-700",
  Info: "bg-sky-100 text-sky-700",
  CRM: "bg-cyan-100 text-cyan-700",
  RM: "bg-indigo-100 text-indigo-700",
  Working: "bg-violet-100 text-violet-700",
  IN: "bg-emerald-100 text-emerald-700",
  OUT: "bg-amber-100 text-amber-700",
  USE: "bg-sky-100 text-sky-700",
  DISPOSE: "bg-rose-100 text-rose-700",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        statusStyles[status] ?? "bg-slate-100 text-slate-700",
        className,
      )}
    >
      {status}
    </span>
  );
}
