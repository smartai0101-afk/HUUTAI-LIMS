"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { SampleStatusBadge } from "@/components/samples/SampleStatusBadge";
import { SAMPLE_STATUS_LABELS } from "@/lib/sample-labels";
import type { SampleListItem } from "@/types/samples";
import type { SampleStatus } from "@prisma/client";

const TRACKING_COLUMNS: SampleStatus[] = [
  "Received",
  "WaitingAssignment",
  "Assigned",
  "InAnalysis",
  "WaitingReview",
  "Completed",
  "ResultIssued",
];

type Props = {
  samples: SampleListItem[];
};

export function SampleTrackingClient({ samples }: Props) {
  const grouped = TRACKING_COLUMNS.map((status) => ({
    status,
    label: SAMPLE_STATUS_LABELS[status],
    items: samples.filter((s) => s.status === status),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Theo dõi trạng thái</h1>
        <p className="text-sm text-slate-500">Kanban theo luồng xử lý mẫu ISO/IEC 17025</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-7">
        {grouped.map((col) => (
          <div key={col.status} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">{col.label}</h2>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                {col.items.length}
              </span>
            </div>
            <div className="space-y-2">
              {col.items.map((sample) => (
                <Link
                  key={sample.id}
                  href={`/samples/${sample.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:border-cyan-200"
                >
                  <p className="font-medium text-slate-900">{sample.sampleCode}</p>
                  <p className="mt-1 text-xs text-slate-600">{sample.sampleName}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <SampleStatusBadge status={sample.status} />
                    {sample.isOverdue ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
