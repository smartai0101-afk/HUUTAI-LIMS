"use client";

import type { SampleAuditEntry } from "@/types/samples";

export function SampleAuditTrail({ logs }: { logs: SampleAuditEntry[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Chưa có lịch sử thay đổi.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900">Audit trail</h3>
      </div>
      <div className="max-h-96 space-y-3 overflow-y-auto p-4">
        {logs.map((log) => (
          <div key={log.id} className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-slate-900">{log.action}</p>
              <span className="text-xs text-slate-500">
                {new Date(log.changedAt).toLocaleString("vi-VN")}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{log.changedBy}</p>
            {(log.before !== null && log.before !== undefined) ||
            (log.after !== null && log.after !== undefined) ? (
              <pre className="mt-2 overflow-x-auto rounded-lg bg-white p-2 text-xs text-slate-500">
                {JSON.stringify({ before: log.before, after: log.after }, null, 2)}
              </pre>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
