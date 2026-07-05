"use client";

import Link from "next/link";
import { WorkflowTimeline } from "@/components/samples/WorkflowTimeline";

type Props = {
  events: Awaited<ReturnType<typeof import("@/lib/services/workflow-orchestrator").listReceptionLogEvents>>;
  timeline: Awaited<ReturnType<typeof import("@/lib/services/workflow-orchestrator").listUnifiedIsoTimeline>>;
  sampleId?: string;
};

export function ReceptionLogClient({ events, timeline, sampleId }: Props) {
  const merged = sampleId
    ? timeline
    : events.map((e) => ({
        id: e.id,
        source: "workflow" as const,
        action: e.action,
        performedBy: e.performedBy,
        performedAt: e.performedAt,
        reason: e.reason,
        fromStatus: e.fromStatus || undefined,
        toStatus: e.toStatus || undefined,
      }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Nhật ký tiếp nhận</h1>
        <p className="text-sm text-slate-500">Audit trail tiếp nhận mẫu và phiếu yêu cầu (ISO 17025)</p>
      </div>
      <WorkflowTimeline entries={merged} />
      {!sampleId ? (
        <p className="text-sm text-slate-500">
          Xem chi tiết trên{" "}
          <Link href="/samples" className="text-cyan-700 hover:underline">
            danh sách mẫu
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
