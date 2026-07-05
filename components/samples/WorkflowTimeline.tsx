"use client";

type TimelineEntry = {
  id: string;
  source: "workflow" | "audit" | "report" | "custody";
  action: string;
  performedBy: string;
  performedAt: Date | string;
  reason: string;
  fromStatus?: string;
  toStatus?: string;
};

const SOURCE_LABELS: Record<TimelineEntry["source"], string> = {
  workflow: "Workflow",
  audit: "Audit",
  report: "Báo cáo",
  custody: "Custody",
};

export function WorkflowTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có nhật ký ISO.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={`${entry.source}-${entry.id}`}
          className="rounded-xl border border-slate-200 bg-white p-4 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-medium text-slate-900">{entry.action}</div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {SOURCE_LABELS[entry.source]}
            </span>
          </div>
          <div className="mt-1 text-slate-600">
            {entry.performedBy} ·{" "}
            {new Date(entry.performedAt).toLocaleString("vi-VN")}
          </div>
          {entry.fromStatus || entry.toStatus ? (
            <div className="mt-1 text-slate-500">
              {entry.fromStatus ? `${entry.fromStatus} → ` : ""}
              {entry.toStatus}
            </div>
          ) : null}
          {entry.reason ? <div className="mt-1 text-slate-500">{entry.reason}</div> : null}
        </div>
      ))}
    </div>
  );
}
