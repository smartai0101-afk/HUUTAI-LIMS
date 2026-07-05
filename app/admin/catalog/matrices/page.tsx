import { CatalogMatricesClient } from "@/components/admin/CatalogMatricesClient";
import { listSampleMatrixGroups } from "@/lib/services/catalog/sample-matrix-groups";
import { listSampleMatricesWithStats } from "@/lib/services/catalog/sample-matrices";

export const dynamic = "force-dynamic";

export default async function AdminMatricesPage() {
  const [matrices, groups] = await Promise.all([
    listSampleMatricesWithStats(false),
    listSampleMatrixGroups(false),
  ]);
  return <CatalogMatricesClient initial={matrices} groups={groups} />;
}
