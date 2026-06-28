import { notFound } from "next/navigation";
import { MethodDetailTabs } from "@/components/analytical-methods/MethodDetailTabs";
import { WorkflowEditor } from "@/components/analytical-methods/WorkflowEditor";
import { getAnalyticalMethodDetail, getCurrentMethodVersionId, isMethodVersionEditable } from "@/lib/services/analytical-methods/methods";
import { getMethodWorkflow } from "@/lib/services/analytical-methods/method-workflow";

export const dynamic = "force-dynamic";

export default async function MethodWorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const method = await getAnalyticalMethodDetail(id);
  if (!method) notFound();
  const versionId = await getCurrentMethodVersionId(id);
  const workflow = versionId ? await getMethodWorkflow(versionId) : null;
  const editable = versionId ? await isMethodVersionEditable(versionId) : true;

  if (!workflow) {
    return (
      <MethodDetailTabs method={method}>
        <p className="text-sm text-slate-500">Chưa có workflow</p>
      </MethodDetailTabs>
    );
  }

  return (
    <MethodDetailTabs method={method}>
      <WorkflowEditor methodId={id} workflow={workflow} editable={editable} />
    </MethodDetailTabs>
  );
}
