import { notFound } from "next/navigation";
import { SampleDetailClient } from "@/components/samples/SampleDetailClient";
import { listSampleAuditLogsForSample } from "@/lib/services/samples/sample-audit";
import { listSampleCustodyEvents } from "@/lib/services/samples/sample-custody";
import { getSampleDetail } from "@/lib/services/samples/sample-detail";
import { listUnifiedIsoTimeline } from "@/lib/services/workflow-orchestrator";

export const dynamic = "force-dynamic";

export default async function SampleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sample = await getSampleDetail(id);
  if (!sample) notFound();

  const [auditLogs, custodyEvents, isoTimeline] = await Promise.all([
    listSampleAuditLogsForSample(id),
    listSampleCustodyEvents(id),
    listUnifiedIsoTimeline(id),
  ]);

  return (
    <SampleDetailClient
      sample={sample}
      auditLogs={auditLogs}
      custodyEvents={custodyEvents}
      isoTimeline={isoTimeline}
    />
  );
}
