import type { AuditLogView } from "@/types";

export function AuditTrail({ logs }: { logs: AuditLogView[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900">Audit trail</h3>
      </div>
      <div className="space-y-3 p-4">
        {logs.map((log) => (
          <div key={log.id} className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-slate-900">{log.action}</p>
              <span className="text-xs text-slate-500">{log.time}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{log.user} · {log.object}</p>
            <p className="mt-1 text-xs text-slate-500">
              {log.before} → {log.after}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
