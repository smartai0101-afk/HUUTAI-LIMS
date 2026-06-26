"use client";

import { useEffect, useState, useTransition } from "react";
import { fetchPreparationHistory } from "@/lib/actions/preparation-workflow";
import type { PreparationHistoryEntryView } from "@/lib/services/preparation-history";
import type { PreparationRecordType } from "@/lib/services/preparation-workflow";
import { formatDate } from "@/lib/utils";

type Props = {
  preparationType: PreparationRecordType;
  preparationId: string;
  role: string;
};

export function PreparationHistoryTimeline({ preparationType, preparationId, role }: Props) {
  const [entries, setEntries] = useState<PreparationHistoryEntryView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const fd = new FormData();
    fd.set("preparationType", preparationType);
    fd.set("id", preparationId);
    fd.set("user", role);
    startTransition(async () => {
      const result = await fetchPreparationHistory(fd);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("entries" in result && result.entries) {
        setEntries(result.entries);
      }
    });
  }, [preparationType, preparationId, role]);

  if (pending && !entries.length) {
    return <p className="text-sm text-slate-500">Đang tải lịch sử...</p>;
  }
  if (error) {
    return <p className="text-sm text-rose-600">{error}</p>;
  }
  if (!entries.length) {
    return <p className="text-sm text-slate-500">Chưa có lịch sử pha chế.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="rounded-xl border border-slate-200 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-900">
              v{entry.version} · {entry.event}
            </p>
            <p className="text-xs text-slate-500">{formatDate(entry.performedAt.slice(0, 10))}</p>
          </div>
          <p className="mt-1 text-xs text-slate-600">Người thực hiện: {entry.performedBy}</p>
          {entry.reason ? (
            <p className="mt-2 text-sm text-amber-800 bg-amber-50 rounded-lg px-2 py-1">
              Lý do: {entry.reason}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
