import { CatalogMatrixGroupsClient } from "@/components/admin/CatalogMatrixGroupsClient";
import { listSampleMatrixGroupsWithStats } from "@/lib/services/catalog/sample-matrix-groups";

export const dynamic = "force-dynamic";

export default async function AdminMatrixGroupsPage() {
  const groups = await listSampleMatrixGroupsWithStats(false);
  return <CatalogMatrixGroupsClient initial={groups} />;
}
