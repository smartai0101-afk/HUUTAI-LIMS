import { db } from "@/lib/db";

export async function listSamplePrepTasks(departmentId?: string) {
  return db.analysisTask.findMany({
    where: {
      status: { in: ["analyst_assigned", "in_worklist"] },
      ...(departmentId ? { departmentId } : {}),
    },
    include: {
      sample: {
        select: {
          sampleCode: true,
          sampleName: true,
          preservationCondition: true,
          containerType: true,
        },
      },
      worklistLinks: {
        include: {
          worklist: {
            select: {
              worklistCode: true,
              methodName: true,
              status: true,
            },
          },
        },
      },
    },
    orderBy: { internalDueDate: "asc" },
    take: 100,
  });
}

export async function getSamplePrepChecklist(taskId: string) {
  const task = await db.analysisTask.findUnique({
    where: { id: taskId },
    include: { sample: true },
  });
  if (!task) return null;

  const worklistLink = await db.analysisWorklistTask.findFirst({
    where: { taskId },
    include: { worklist: { select: { methodVersionId: true, methodName: true } } },
  });

  let prepSteps: string[] = [];
  const methodVersionId = worklistLink?.worklist.methodVersionId;
  if (methodVersionId) {
    const workflow = await db.methodWorkflow.findUnique({
      where: { methodVersionId },
      include: { nodes: true },
    });
    prepSteps =
      workflow?.nodes
        .filter((n) => n.type === "Step" || n.type === "Condition")
        .map((n) => n.label)
        .filter(Boolean) ?? [];
  }

  if (prepSteps.length === 0) {
    prepSteps = [
      "Kiểm tra tình trạng mẫu nhận",
      "Ghi nhận điều kiện bảo quản",
      "Chuẩn bị dụng cụ / thiết bị",
      "Tiến hành xử lý mẫu theo SOP",
    ];
  }

  return {
    taskId: task.id,
    sampleCode: task.sampleCode,
    sampleName: task.sampleName,
    parameterGroup: task.parameterGroup,
    methodName: worklistLink?.worklist.methodName ?? "—",
    preservationCondition: task.sample.preservationCondition,
    containerType: task.sample.containerType,
    prepSteps,
  };
}
