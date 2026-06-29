import { QcClient } from "@/components/analysis/QcClient";
import { listTasksForQc } from "@/lib/services/analysis/qc-check";

export const dynamic = "force-dynamic";

export default async function QcPage() {
  const tasks = await listTasksForQc();
  return (
    <QcClient
      tasks={tasks.map((t) => ({
        id: t.id,
        sampleCode: t.sampleCode,
        parameterGroup: t.parameterGroup,
        departmentName: t.departmentName,
        status: t.status,
      }))}
    />
  );
}
