import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "danger";
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  tone = "default",
}: StatCardProps) {
  const toneClass = {
    default: "bg-sky-50 text-sky-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-rose-50 text-rose-700",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-semibold text-slate-900">{value}</h3>
        </div>
        <div className={cn("rounded-2xl p-3", toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {change ? (
        <p className="mt-3 inline-flex rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">{change}</p>
      ) : null}
    </div>
  );
}
