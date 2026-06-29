import Link from "next/link";
import { notFound } from "next/navigation";
import { WORKSHEET_STATUS_LABELS } from "@/lib/analysis-labels";
import { getWorksheet } from "@/lib/services/analysis/worksheet";

export const dynamic = "force-dynamic";

export default async function WorksheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ws = await getWorksheet(id);
  if (!ws) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{ws.worksheetCode}</h1>
      <p className="text-sm text-slate-500">{WORKSHEET_STATUS_LABELS[ws.status]}</p>
      <section className="rounded-2xl border bg-white p-4 text-sm shadow-sm">
        <p>Worklist: {ws.worklistCode}</p>
        <p>PP: {ws.methodName || "—"}</p>
        <p>TB: {ws.equipmentName || "—"}</p>
        <p>Analyst: {ws.analystName}</p>
        <p>Điều kiện: {ws.conditionNote || "—"}</p>
        <p>HC: {ws.chemicalIds.length} · Chuẩn: {ws.standardIds.length} · CRM: {ws.crmIds.length}</p>
      </section>
      <Link href="/analysis/worksheets" className="text-sm text-cyan-700 hover:underline">
        ← Quay lại
      </Link>
    </div>
  );
}
