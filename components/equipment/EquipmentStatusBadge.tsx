import { equipmentStatusLabel } from "@/lib/equipment-fields";
import { cn } from "@/lib/utils";

const toneClass: Record<string, string> = {
  InUse: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Đang dùng": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Maintenance: "bg-amber-50 text-amber-700 ring-amber-200",
  "Bảo trì": "bg-amber-50 text-amber-700 ring-amber-200",
  Broken: "bg-rose-50 text-rose-700 ring-rose-200",
  "Hỏng": "bg-rose-50 text-rose-700 ring-rose-200",
  Disposed: "bg-slate-100 text-slate-600 ring-slate-200",
  "Thanh lý": "bg-slate-100 text-slate-600 ring-slate-200",
};

export function EquipmentStatusBadge({ status }: { status: string }) {
  const label = equipmentStatusLabel(status);
  const tone = toneClass[status] ?? toneClass[label] ?? "bg-slate-50 text-slate-700 ring-slate-200";
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", tone)}>
      {label}
    </span>
  );
}
