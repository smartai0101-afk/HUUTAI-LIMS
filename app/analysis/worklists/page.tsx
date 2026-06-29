import { WorklistsClient } from "@/components/analysis/WorklistsClient";
import { listDepartmentAnalysts } from "@/lib/services/analysis/analyst-assignment";
import { listLabDepartmentsForFilter } from "@/lib/services/analysis/analysis-inbox";
import {
  listEquipmentOptions,
  listMethodOptions,
  listWorklists,
} from "@/lib/services/analysis/worklist";
import { mapAnalysisTaskView } from "@/lib/mappers/analysis";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function WorklistsPage() {
  const departments = await listLabDepartmentsForFilter();
  const [worklists, methods, equipment, analysts, taskRows] = await Promise.all([
    listWorklists(),
    listMethodOptions(),
    listEquipmentOptions(),
    listDepartmentAnalysts(),
    db.analysisTask.findMany({ where: { status: "analyst_assigned" } }),
  ]);

  return (
    <WorklistsClient
      worklists={worklists}
      departments={departments}
      methods={methods.map((m) => ({
        id: m.id,
        methodCode: m.methodCode,
        methodName: m.methodName,
        versionId: m.currentVersion?.id ?? null,
      }))}
      equipment={equipment}
      analysts={analysts}
      availableTasks={taskRows.map(mapAnalysisTaskView)}
    />
  );
}
