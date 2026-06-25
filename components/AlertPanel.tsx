import Link from "next/link";
import { AlertTriangle, FlaskConical, PackageX, ShieldAlert } from "lucide-react";
import { AlertItem } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const icons = {
  Expiry: AlertTriangle,
  "Low Stock": PackageX,
  "Missing COA": FlaskConical,
  "Missing SDS": ShieldAlert,
  "Pending Disposal": AlertTriangle,
};

interface AlertPanelProps {
  alerts: AlertItem[];
  showActions?: boolean;
  onMarkReviewed?: (id: string) => void;
}

export function AlertPanel({ alerts, showActions = false, onMarkReviewed }: AlertPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900">Alert panel</h3>
        <span className="text-sm text-slate-500">{alerts.length} items</span>
      </div>
      <div className="divide-y divide-slate-200">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Không có cảnh báo</div>
        ) : (
          alerts.map((alert) => {
            const Icon = icons[alert.type as keyof typeof icons] || AlertTriangle;
            return (
              <div
                key={alert.id}
                className={cn(
                  "flex gap-3 p-4",
                  alert.reviewed && "bg-slate-50 opacity-75",
                )}
              >
                <div className="mt-0.5 rounded-xl bg-rose-50 p-2 text-rose-600">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{alert.title}</p>
                    <div className="flex items-center gap-2">
                      {alert.reviewed ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Reviewed
                        </span>
                      ) : null}
                      <StatusBadge status={alert.severity} />
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{alert.description}</p>
                  <p className="mt-2 text-xs text-slate-400">{formatDate(alert.date)}</p>
                  {showActions ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {alert.itemRoute && alert.itemCode ? (
                        <Link
                          href={`${alert.itemRoute}?code=${encodeURIComponent(alert.itemCode)}`}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-cyan-700 hover:bg-cyan-50"
                        >
                          View item
                        </Link>
                      ) : null}
                      {!alert.reviewed && onMarkReviewed ? (
                        <button
                          type="button"
                          onClick={() => onMarkReviewed(alert.id)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Mark reviewed
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
