import { db } from "@/lib/db";
import { toJsonArray } from "@/lib/analysis-code";
import { mapInboxRow } from "@/lib/mappers/analysis";
import { appendSampleAuditLog } from "@/lib/services/samples/sample-audit";
import { ensureTestResultsForTask, syncSampleStatusFromTasks } from "./analysis-workflow";
import type { AnalysisInboxRow } from "@/types/analysis";

export async function listInboxAssignments(departmentId?: string): Promise<AnalysisInboxRow[]> {
  const rows = await db.analysisAssignment.findMany({
    where: {
      status: "assigned",
      ...(departmentId ? { departmentId } : {}),
    },
    include: {
      sample: {
        include: { request: { select: { requestCode: true } } },
      },
    },
    orderBy: { dueDate: "asc" },
  });
  return rows.map(mapInboxRow);
}

export async function acceptAssignment(assignmentId: string, changedBy: string) {
  const assignment = await db.analysisAssignment.findUnique({
    where: { id: assignmentId },
    include: { sample: true, task: true },
  });
  if (!assignment) throw new Error("Không tìm thấy phân công");
  if (assignment.status !== "assigned") {
    throw new Error("Chỉ tiếp nhận phân công ở trạng thái đã phân công");
  }
  if (assignment.task) throw new Error("Phân công đã được tiếp nhận");

  return db.$transaction(async (tx) => {
    await tx.analysisAssignment.update({
      where: { id: assignmentId },
      data: { status: "department_received" },
    });

    await tx.analysisTask.create({
      data: {
        assignmentId,
        sampleId: assignment.sampleId,
        sampleCode: assignment.sample.sampleCode,
        sampleName: assignment.sample.sampleName,
        parameterGroup: assignment.parameterGroup,
        parametersJson: assignment.parametersJson,
        departmentId: assignment.departmentId,
        departmentName: assignment.departmentName,
        managerId: assignment.managerId,
        managerName: assignment.managerName,
        assignedBy: changedBy,
        status: "lab_accepted",
        note: assignment.note,
      },
    });

    await appendSampleAuditLog(tx, {
      entityType: "sample",
      entityId: assignment.sampleId,
      action: "LabAccepted",
      before: { assignmentId, status: assignment.status },
      after: { assignmentId, status: "department_received" },
      changedBy,
    });

    return { success: true };
  }).then(async () => {
    await syncSampleStatusFromTasks(assignment.sampleId);
    return { success: true };
  });
}

export async function rejectAssignment(
  assignmentId: string,
  rejectionReason: string,
  changedBy: string,
) {
  const assignment = await db.analysisAssignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new Error("Không tìm thấy phân công");
  if (assignment.status !== "assigned") {
    throw new Error("Chỉ từ chối phân công ở trạng thái đã phân công");
  }

  return db.$transaction(async (tx) => {
    await tx.analysisAssignment.update({
      where: { id: assignmentId },
      data: { status: "cancelled", rejectionReason: rejectionReason.trim() },
    });

    await appendSampleAuditLog(tx, {
      entityType: "sample",
      entityId: assignment.sampleId,
      action: "LabRejected",
      before: { assignmentId, status: assignment.status },
      after: { assignmentId, status: "cancelled", rejectionReason },
      changedBy,
    });

    return { success: true };
  });
}

export async function listLabDepartmentsForFilter() {
  return db.labDepartment.findMany({ orderBy: { sortOrder: "asc" } });
}
