import { notFound } from "next/navigation";
import { MethodDetailTabs } from "@/components/analytical-methods/MethodDetailTabs";
import { ChecklistPreview } from "@/components/analytical-methods/ChecklistPreview";
import { getAnalyticalMethodDetail, getCurrentMethodVersionId } from "@/lib/services/analytical-methods/methods";
import { generateChecklistFromWorkflow } from "@/lib/services/analytical-methods/method-workflow";

export const dynamic = "force-dynamic";

export default async function MethodChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const method = await getAnalyticalMethodDetail(id);
  if (!method) notFound();
  const versionId = await getCurrentMethodVersionId(id);
  const items = versionId ? await generateChecklistFromWorkflow(versionId) : [];

  return (
    <MethodDetailTabs method={method}>
      <ChecklistPreview items={items} />
    </MethodDetailTabs>
  );
}
