import { notFound } from "next/navigation";
import { MethodDetailTabs } from "@/components/analytical-methods/MethodDetailTabs";
import { MethodOverviewClient } from "@/components/analytical-methods/MethodOverviewClient";
import { listSampleMatrices } from "@/lib/services/catalog/sample-matrices";
import { listTestMethods } from "@/lib/services/catalog/test-methods";
import { getAnalyticalMethodDetail, isMethodVersionEditable } from "@/lib/services/analytical-methods/methods";

export const dynamic = "force-dynamic";

export default async function MethodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [method, matrices, testMethods] = await Promise.all([
    getAnalyticalMethodDetail(id),
    listSampleMatrices(),
    listTestMethods(),
  ]);
  if (!method) notFound();
  const editable = method.currentVersion
    ? await isMethodVersionEditable(method.currentVersion.id)
    : true;

  return (
    <MethodDetailTabs method={method}>
      <MethodOverviewClient
        method={method}
        matrices={matrices}
        testMethods={testMethods}
        editable={editable}
      />
    </MethodDetailTabs>
  );
}
