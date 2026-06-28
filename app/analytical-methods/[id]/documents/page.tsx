import { notFound } from "next/navigation";
import { MethodDetailTabs } from "@/components/analytical-methods/MethodDetailTabs";
import { SopUploadPanel } from "@/components/analytical-methods/SopUploadPanel";
import { getAnalyticalMethodDetail, getCurrentMethodVersionId, isMethodVersionEditable } from "@/lib/services/analytical-methods/methods";
import { listMethodDocuments } from "@/lib/services/analytical-methods/method-documents";

export const dynamic = "force-dynamic";

export default async function MethodDocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const method = await getAnalyticalMethodDetail(id);
  if (!method) notFound();
  const versionId = await getCurrentMethodVersionId(id);
  const documents = versionId ? await listMethodDocuments(versionId) : [];
  const editable = versionId ? await isMethodVersionEditable(versionId) : true;

  return (
    <MethodDetailTabs method={method}>
      <SopUploadPanel methodId={id} documents={documents} editable={editable} />
    </MethodDetailTabs>
  );
}
