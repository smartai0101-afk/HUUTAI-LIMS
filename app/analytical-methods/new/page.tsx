import { MethodFormClient } from "@/components/analytical-methods/MethodFormClient";
import { listSampleMatrices } from "@/lib/services/catalog/sample-matrices";
import { listTestMethods } from "@/lib/services/catalog/test-methods";

export const dynamic = "force-dynamic";

export default async function NewAnalyticalMethodPage() {
  const [matrices, testMethods] = await Promise.all([
    listSampleMatrices(),
    listTestMethods(),
  ]);
  return <MethodFormClient matrices={matrices} testMethods={testMethods} />;
}
