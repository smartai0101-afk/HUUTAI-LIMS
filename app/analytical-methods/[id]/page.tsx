import { notFound } from "next/navigation";
import { MethodDetailTabs } from "@/components/analytical-methods/MethodDetailTabs";
import { MethodOverviewClient } from "@/components/analytical-methods/MethodOverviewClient";
import { getAnalyticalMethodDetail, isMethodVersionEditable } from "@/lib/services/analytical-methods/methods";

export const dynamic = "force-dynamic";

export default async function MethodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const method = await getAnalyticalMethodDetail(id);
  if (!method) notFound();
  const editable = method.currentVersion
    ? await isMethodVersionEditable(method.currentVersion.id)
    : true;

  return (
    <MethodDetailTabs method={method}>
      <MethodOverviewClient method={method} editable={editable} />
    </MethodDetailTabs>
  );
}
