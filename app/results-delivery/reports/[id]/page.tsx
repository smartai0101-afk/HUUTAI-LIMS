import { notFound } from "next/navigation";
import { ReportDetailClient } from "@/components/results-delivery/ReportDetailClient";
import { getReport } from "@/lib/services/results-delivery/test-report";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();
  return <ReportDetailClient report={report} />;
}
