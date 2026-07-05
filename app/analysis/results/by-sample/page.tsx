import { ResultsBySampleClient } from "@/components/analysis/ResultsBySampleClient";
import { listResultsBySample } from "@/lib/services/analysis/test-results";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ResultsBySamplePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sampleId = typeof params.sampleId === "string" ? params.sampleId : undefined;
  const sample = sampleId
    ? await db.sample.findUnique({
        where: { id: sampleId },
        select: { id: true, sampleCode: true, sampleName: true },
      })
    : await db.sample.findFirst({
        orderBy: { receivedAt: "desc" },
        select: { id: true, sampleCode: true, sampleName: true },
      });

  if (!sample) {
    return <p className="text-sm text-slate-500">Chưa có mẫu nào.</p>;
  }

  const results = await listResultsBySample(sample.id);

  return (
    <ResultsBySampleClient
      sampleId={sample.id}
      sampleCode={sample.sampleCode}
      sampleName={sample.sampleName}
      results={results}
    />
  );
}
