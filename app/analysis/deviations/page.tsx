import { DeviationsClient } from "@/components/analysis/DeviationsClient";
import { listDeviations } from "@/lib/services/analysis/deviation";

export const dynamic = "force-dynamic";

export default async function DeviationsPage() {
  const deviations = await listDeviations();
  return <DeviationsClient deviations={deviations} />;
}
