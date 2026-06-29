import type { AnalysisAssignmentStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { appendSampleAuditLog } from "@/lib/services/samples/sample-audit";
import type { SampleAssignInput } from "@/lib/validators/samples";
import type {
  AnalysisAssignmentView,
  LabDepartmentView,
  SampleAssignmentContext,
} from "@/types/samples";

function parseDate(value: string): Date {
  if (value.includes("T")) return new Date(value);
  return new Date(`${value}T00:00:00.000Z`);
}

function parseParameters(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === "string") : [];
  } catch {
    return [];
  }
}

export function mapAnalysisAssignmentView(
  row: {
    id: string;
    sampleId: string;
    parameterGroup: string;
    parametersJson: string;
    departmentId: string;
    departmentName: string;
    managerId: string;
    managerName: string;
    managerTitle: string;
    assignedBy: string;
    assignedAt: Date;
    dueDate: Date;
    status: AnalysisAssignmentStatus;
    note: string;
    sample?: { sampleCode: string; sampleName: string };
  },
): AnalysisAssignmentView {
  return {
    id: row.id,
    sampleId: row.sampleId,
    sampleCode: row.sample?.sampleCode ?? "",
    sampleName: row.sample?.sampleName ?? "",
    parameterGroup: row.parameterGroup,
    parameters: parseParameters(row.parametersJson),
    departmentId: row.departmentId,
    departmentName: row.departmentName,
    managerId: row.managerId,
    managerName: row.managerName,
    managerTitle: row.managerTitle,
    assignedBy: row.assignedBy,
    assignedAt: row.assignedAt.toISOString(),
    dueDate: row.dueDate.toISOString(),
    status: row.status,
    note: row.note,
  };
}

export async function listLabDepartments(): Promise<LabDepartmentView[]> {
  const rows = await db.labDepartment.findMany({
    include: { managers: { orderBy: { name: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
    managers: row.managers.map((m) => ({
      id: m.id,
      name: m.name,
      title: m.title,
      isDefault: m.isDefault,
    })),
  }));
}

async function collectParameterPool(sampleId: string): Promise<string[]> {
  const sample = await db.sample.findUnique({
    where: { id: sampleId },
    include: {
      tests: { select: { parameterName: true }, orderBy: { createdAt: "asc" } },
      request: {
        include: {
          requestedTests: { select: { parameterName: true }, orderBy: { id: "asc" } },
        },
      },
    },
  });
  if (!sample) return [];

  const pool = new Set<string>();
  for (const test of sample.tests) {
    if (test.parameterName.trim()) pool.add(test.parameterName.trim());
  }
  for (const reqTest of sample.request?.requestedTests ?? []) {
    if (reqTest.parameterName.trim()) pool.add(reqTest.parameterName.trim());
  }
  return Array.from(pool);
}

export async function getSampleAssignmentContext(
  sampleId: string,
): Promise<SampleAssignmentContext | null> {
  const sample = await db.sample.findUnique({
    where: { id: sampleId },
    include: {
      analysisAssignments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!sample) return null;

  const parameterPool = await collectParameterPool(sampleId);

  return {
    sampleId: sample.id,
    sampleCode: sample.sampleCode,
    sampleName: sample.sampleName,
    parameterPool,
    assignments: sample.analysisAssignments.map((row) =>
      mapAnalysisAssignmentView({
        ...row,
        sample: { sampleCode: sample.sampleCode, sampleName: sample.sampleName },
      }),
    ),
  };
}

function buildManagerSummary(names: string[]): string {
  const unique = [...new Set(names.filter(Boolean))];
  if (unique.length === 0) return "";
  if (unique.length <= 2) return unique.join(", ");
  return `${unique.slice(0, 2).join(", ")} +${unique.length - 2}`;
}

function validateGroupParameters(
  groups: SampleAssignInput["groups"],
  parameterPool: string[],
): string | null {
  const poolSet = new Set(parameterPool);
  const used = new Set<string>();

  for (const group of groups) {
    for (const param of group.parameters) {
      const trimmed = param.trim();
      if (!poolSet.has(trimmed)) {
        return `Chỉ tiêu "${trimmed}" không thuộc danh sách mẫu`;
      }
      if (used.has(trimmed)) {
        return `Chỉ tiêu "${trimmed}" bị trùng giữa các nhóm`;
      }
      used.add(trimmed);
    }
  }

  return null;
}

export async function assignAnalysisGroups(input: SampleAssignInput, changedBy: string) {
  const sample = await db.sample.findUnique({ where: { id: input.sampleId } });
  if (!sample) throw new Error("Không tìm thấy mẫu");

  const parameterPool = await collectParameterPool(input.sampleId);
  const paramError = validateGroupParameters(input.groups, parameterPool);
  if (paramError) throw new Error(paramError);

  const departmentIds = [...new Set(input.groups.map((g) => g.departmentId))];
  const managerIds = [...new Set(input.groups.map((g) => g.managerId))];

  const [departments, managers] = await Promise.all([
    db.labDepartment.findMany({
      where: { id: { in: departmentIds } },
      include: { managers: true },
    }),
    db.departmentManager.findMany({ where: { id: { in: managerIds } } }),
  ]);

  const deptById = new Map(departments.map((d) => [d.id, d]));
  const mgrById = new Map(managers.map((m) => [m.id, m]));

  for (const group of input.groups) {
    const dept = deptById.get(group.departmentId);
    if (!dept) throw new Error("Phòng ban không hợp lệ");
    const mgr = mgrById.get(group.managerId);
    if (!mgr || mgr.departmentId !== group.departmentId) {
      throw new Error("Quản lý phòng không thuộc phòng ban đã chọn");
    }
  }

  return db.$transaction(async (tx) => {
    const existingIds = input.groups.map((g) => g.id).filter(Boolean) as string[];
    if (existingIds.length > 0) {
      await tx.analysisAssignment.deleteMany({
        where: {
          sampleId: input.sampleId,
          id: { notIn: existingIds },
        },
      });
    } else {
      await tx.analysisAssignment.deleteMany({ where: { sampleId: input.sampleId } });
    }

    const managerNames: string[] = [];
    const now = new Date();

    for (const group of input.groups) {
      const dept = deptById.get(group.departmentId)!;
      const mgr = mgrById.get(group.managerId)!;
      managerNames.push(mgr.name);

      const payload = {
        parameterGroup: group.parameterGroup.trim(),
        parametersJson: JSON.stringify(group.parameters.map((p) => p.trim())),
        departmentId: dept.id,
        departmentName: dept.name,
        managerId: mgr.id,
        managerName: mgr.name,
        managerTitle: mgr.title,
        dueDate: parseDate(group.dueDate),
        status: (group.status ?? "assigned") as AnalysisAssignmentStatus,
        note: group.note?.trim() ?? "",
      };

      if (group.id) {
        await tx.analysisAssignment.update({
          where: { id: group.id },
          data: payload,
        });
      } else {
        await tx.analysisAssignment.create({
          data: {
            sampleId: input.sampleId,
            ...payload,
            assignedBy: changedBy,
            assignedAt: now,
          },
        });
      }
    }

    const assignedTo = buildManagerSummary(managerNames);
    const nextStatus =
      sample.status === "Received" || sample.status === "WaitingAssignment"
        ? ("Assigned" as const)
        : sample.status;

    const earliestDue = input.groups.reduce(
      (earliest, g) => (!earliest || g.dueDate < earliest ? g.dueDate : earliest),
      "",
    );

    const updatedSample = await tx.sample.update({
      where: { id: input.sampleId },
      data: {
        assignedTo,
        status: nextStatus,
        dueDate: parseDate(earliestDue),
      },
    });

    await appendSampleAuditLog(tx, {
      entityType: "sample",
      entityId: input.sampleId,
      action: "DepartmentAssigned",
      before: { assignedTo: sample.assignedTo, status: sample.status },
      after: {
        assignedTo,
        status: updatedSample.status,
        groupCount: input.groups.length,
      },
      changedBy,
    });

    return updatedSample;
  });
}
