import { notFound } from "next/navigation";
import { WorksheetDetailClient } from "@/components/analysis/WorksheetDetailClient";
import { getWorksheet } from "@/lib/services/analysis/worksheet";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function WorksheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ws = await getWorksheet(id);
  if (!ws) notFound();

  const [sampleTestLinks, qcChecks] = await Promise.all([
    db.worksheetSampleTest.findMany({
      where: { worksheetId: id },
      include: {
        sampleTest: {
          include: { sample: { select: { sampleCode: true, sampleName: true } } },
        },
      },
      orderBy: { runOrder: "asc" },
    }),
    db.qcCheck.findMany({ where: { worksheetId: id }, orderBy: { checkedAt: "desc" } }),
  ]);

  return (
    <WorksheetDetailClient
      worksheet={ws}
      sampleTests={sampleTestLinks.map((l) => ({
        id: l.sampleTestId,
        sampleCode: l.sampleTest.sample.sampleCode,
        sampleName: l.sampleTest.sample.sampleName,
        parameterName: l.sampleTest.parameterName,
        runOrder: l.runOrder,
      }))}
      qcChecks={qcChecks.map((q) => ({
        id: q.id,
        checkType: q.checkType,
        status: q.status,
        expectedValue: q.expectedValue,
        measuredValue: q.measuredValue,
        recoveryPercent: q.recoveryPercent,
        note: q.note,
      }))}
    />
  );
}
