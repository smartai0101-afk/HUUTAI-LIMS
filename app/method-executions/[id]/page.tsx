import { notFound } from "next/navigation";
import { AnalyticalMethodsAppShell } from "@/components/analytical-methods/AnalyticalMethodsAppShell";
import { MethodExecutionClient } from "@/components/analytical-methods/MethodExecutionClient";
import { getMethodExecution } from "@/lib/services/analytical-methods/method-execution";

export const dynamic = "force-dynamic";

export default async function MethodExecutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const execution = await getMethodExecution(id);
  if (!execution) notFound();

  return (
    <AnalyticalMethodsAppShell>
      <MethodExecutionClient execution={execution} />
    </AnalyticalMethodsAppShell>
  );
}
