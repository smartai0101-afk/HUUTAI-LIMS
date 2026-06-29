import Link from "next/link";
import { notFound } from "next/navigation";
import { WORKLIST_STATUS_LABELS } from "@/lib/analysis-labels";
import { getWorklist } from "@/lib/services/analysis/worklist";

export const dynamic = "force-dynamic";

export default async function WorklistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wl = await getWorklist(id);
  if (!wl) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{wl.worklistCode}</h1>
        <p className="text-sm text-slate-500">{WORKLIST_STATUS_LABELS[wl.status]}</p>
      </div>
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-sm">Phòng: {wl.departmentName}</p>
        <p className="text-sm">PP: {wl.methodName || "—"}</p>
        <p className="text-sm">TB: {wl.equipmentName || "—"}</p>
        <p className="text-sm">Analyst: {wl.analystName}</p>
      </section>
      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium">Danh sách mẫu/chỉ tiêu</h2>
        <ul className="space-y-2 text-sm">
          {wl.tasks.map((t) => (
            <li key={t.id}>
              {t.sampleCode} — {t.parameterGroup} ({t.parameters.join(", ")})
            </li>
          ))}
        </ul>
      </section>
      <Link href="/analysis/worklists" className="text-sm text-cyan-700 hover:underline">
        ← Quay lại
      </Link>
    </div>
  );
}
