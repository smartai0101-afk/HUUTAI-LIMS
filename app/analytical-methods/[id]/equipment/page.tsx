import { notFound } from "next/navigation";
import { MethodDetailTabs } from "@/components/analytical-methods/MethodDetailTabs";
import { EquipmentLinkPanel } from "@/components/analytical-methods/EquipmentLinkPanel";
import { getAnalyticalMethodDetail, getCurrentMethodVersionId, isMethodVersionEditable } from "@/lib/services/analytical-methods/methods";
import {
  checkMethodEquipmentWarnings,
  listMethodEquipment,
} from "@/lib/services/analytical-methods/method-equipment-check";

export const dynamic = "force-dynamic";

export default async function MethodEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const method = await getAnalyticalMethodDetail(id);
  if (!method) notFound();
  const versionId = await getCurrentMethodVersionId(id);
  const editable = versionId ? await isMethodVersionEditable(versionId) : true;
  const [equipment, warnings] = versionId
    ? await Promise.all([listMethodEquipment(versionId), checkMethodEquipmentWarnings(versionId)])
    : [[], []];

  return (
    <MethodDetailTabs method={method}>
      <EquipmentLinkPanel methodId={id} equipment={equipment} warnings={warnings} editable={editable} />
    </MethodDetailTabs>
  );
}
