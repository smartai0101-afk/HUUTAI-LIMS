import { notFound } from "next/navigation";
import { MethodDetailTabs } from "@/components/analytical-methods/MethodDetailTabs";
import { MethodApprovalPanel } from "@/components/analytical-methods/MethodApprovalPanel";
import { getAnalyticalMethodDetail, getCurrentMethodVersionId } from "@/lib/services/analytical-methods/methods";
import { listMethodApprovals } from "@/lib/services/analytical-methods/method-approval";

export const dynamic = "force-dynamic";

export default async function MethodApprovalsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const method = await getAnalyticalMethodDetail(id);
  if (!method) notFound();
  const versionId = await getCurrentMethodVersionId(id);
  const approvals = versionId ? await listMethodApprovals(versionId) : [];

  return (
    <MethodDetailTabs method={method}>
      <MethodApprovalPanel methodId={id} currentVersion={method.currentVersion} approvals={approvals} />
    </MethodDetailTabs>
  );
}
