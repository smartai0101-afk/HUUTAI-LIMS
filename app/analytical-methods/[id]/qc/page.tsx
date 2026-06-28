import { notFound } from "next/navigation";
import { MethodDetailTabs } from "@/components/analytical-methods/MethodDetailTabs";
import { QcRequirementsForm } from "@/components/analytical-methods/QcRequirementsForm";
import { getAnalyticalMethodDetail, getCurrentMethodVersionId, isMethodVersionEditable } from "@/lib/services/analytical-methods/methods";
import {
  listMethodAcceptanceCriteria,
  listMethodQCRequirements,
  listMethodSafetyNotes,
  runMethodSafetyChecks,
} from "@/lib/services/analytical-methods/method-safety-check";

export const dynamic = "force-dynamic";

export default async function MethodQcPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const method = await getAnalyticalMethodDetail(id);
  if (!method) notFound();
  const versionId = await getCurrentMethodVersionId(id);
  const editable = versionId ? await isMethodVersionEditable(versionId) : true;
  const [qc, acceptance, safety, safetyChecks] = versionId
    ? await Promise.all([
        listMethodQCRequirements(versionId),
        listMethodAcceptanceCriteria(versionId),
        listMethodSafetyNotes(versionId),
        runMethodSafetyChecks(versionId),
      ])
    : [[], [], [], []];

  return (
    <MethodDetailTabs method={method}>
      <QcRequirementsForm
        methodId={id}
        qc={qc}
        acceptance={acceptance}
        safety={safety}
        editable={editable}
        safetyChecks={safetyChecks}
      />
    </MethodDetailTabs>
  );
}
