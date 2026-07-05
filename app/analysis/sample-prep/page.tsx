import { SamplePrepClient } from "@/components/analysis/SamplePrepClient";
import { listSamplePrepTasks } from "@/lib/services/analysis/sample-prep";

export const dynamic = "force-dynamic";

export default async function SamplePrepPage() {
  const tasks = await listSamplePrepTasks();
  return <SamplePrepClient tasks={tasks} />;
}
