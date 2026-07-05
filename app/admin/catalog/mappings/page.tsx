import { CatalogMappingsClient } from "@/components/admin/CatalogMappingsClient";
import { listSampleMatrices } from "@/lib/services/catalog/sample-matrices";
import { listTestMethods } from "@/lib/services/catalog/test-methods";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminMappingsPage() {
  const matrices = await listSampleMatrices(false);
  const firstId = matrices[0]?.id;
  const [availableTests, mappedRows] = await Promise.all([
    firstId ? listTestMethods() : Promise.resolve([]),
    firstId
      ? db.matrixTestMapping.findMany({
          where: { matrixId: firstId },
          select: { testMethodId: true },
        })
      : Promise.resolve([]),
  ]);
  const mappedIds = mappedRows.map((m) => m.testMethodId);

  return (
    <CatalogMappingsClient
      matrices={matrices}
      initialMatrixId={firstId ?? ""}
      mappedIds={mappedIds}
      availableTests={availableTests}
    />
  );
}
