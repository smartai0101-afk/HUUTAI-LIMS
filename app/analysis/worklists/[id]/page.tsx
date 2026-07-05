import { notFound } from "next/navigation";
import { WorklistDetailClient } from "@/components/analysis/WorklistDetailClient";
import { getWorklist } from "@/lib/services/analysis/worklist";

export const dynamic = "force-dynamic";

export default async function WorklistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wl = await getWorklist(id);
  if (!wl) notFound();

  return <WorklistDetailClient worklist={wl} />;
}
