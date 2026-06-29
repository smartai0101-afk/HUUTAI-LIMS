import { notFound } from "next/navigation";
import { TestReportDocument } from "@/components/results-delivery/TestReportDocument";
import { getReport } from "@/lib/services/results-delivery/test-report";

export const dynamic = "force-dynamic";

export default async function ReportPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  return <TestReportDocument report={report} mode="print" />;
}
