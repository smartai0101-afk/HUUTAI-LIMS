import { notFound } from "next/navigation";
import { MethodDetailTabs } from "@/components/analytical-methods/MethodDetailTabs";
import { ReagentCalculatorPanel } from "@/components/analytical-methods/ReagentCalculatorPanel";
import { getAnalyticalMethodDetail, getCurrentMethodVersionId, isMethodVersionEditable } from "@/lib/services/analytical-methods/methods";
import { listMethodReagents } from "@/lib/services/analytical-methods/method-reagents";

export const dynamic = "force-dynamic";

export default async function MethodReagentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const method = await getAnalyticalMethodDetail(id);
  if (!method) notFound();
  const versionId = await getCurrentMethodVersionId(id);
  const reagents = versionId ? await listMethodReagents(versionId) : [];
  const editable = versionId ? await isMethodVersionEditable(versionId) : true;

  return (
    <MethodDetailTabs method={method}>
      <ReagentCalculatorPanel methodId={id} reagents={reagents} editable={editable} />
    </MethodDetailTabs>
  );
}
