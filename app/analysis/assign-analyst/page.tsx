import { AssignAnalystClient } from "@/components/analysis/AssignAnalystClient";
import {
  listDepartmentAnalysts,
  listTasksForAnalystAssign,
} from "@/lib/services/analysis/analyst-assignment";
import { listLabDepartmentsForFilter } from "@/lib/services/analysis/analysis-inbox";

export const dynamic = "force-dynamic";

export default async function AssignAnalystPage() {
  const [tasks, analysts, departments] = await Promise.all([
    listTasksForAnalystAssign(),
    listDepartmentAnalysts(),
    listLabDepartmentsForFilter(),
  ]);
  return <AssignAnalystClient tasks={tasks} analysts={analysts} departments={departments} />;
}
