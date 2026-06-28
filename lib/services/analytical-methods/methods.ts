import type { MethodVersionStatus, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import {
  buildPrismaOrderBy,
  getSkipTake,
  parseListQueryParams,
  type ListQueryParams,
  type PaginatedResult,
  type SearchParamsInput,
  type SortFieldMap,
} from "@/lib/list-query";
import {
  mapMethodDetail,
  mapMethodListItem,
} from "@/lib/mappers/analytical-methods";
import type {
  AnalyticalMethodDetail,
  AnalyticalMethodListItem,
  MethodDashboardStats,
} from "@/types/analytical-methods";

export const METHOD_SORT_ALLOWLIST = [
  "methodCode",
  "methodName",
  "matrix",
  "analyte",
  "technique",
  "standardRef",
  "updatedAt",
] as const;

const METHOD_SORT_MAP: SortFieldMap = {
  methodCode: "methodCode",
  methodName: "methodName",
  matrix: "matrix",
  analyte: "analyte",
  technique: "technique",
  standardRef: "standardRef",
  updatedAt: "updatedAt",
};

const DEFAULT_METHOD_ORDER = [{ updatedAt: "desc" as const }];

const versionInclude = {
  select: {
    id: true,
    methodId: true,
    version: true,
    status: true,
    effectiveDate: true,
    reviewDate: true,
    changeLog: true,
    createdBy: true,
    reviewerId: true,
    approverId: true,
    approvedAt: true,
    estimatedDurationMinutes: true,
  },
  orderBy: { version: "desc" as const },
};

export type MethodListParams = ListQueryParams & { status?: MethodVersionStatus | "All" };

export function parseMethodListParams(searchParams: SearchParamsInput): MethodListParams {
  const base = parseListQueryParams(
    searchParams,
    { sortBy: "updatedAt", sortOrder: "desc", page: 1, limit: 50 },
    METHOD_SORT_ALLOWLIST,
  );
  const statusRaw = Array.isArray(searchParams.status)
    ? searchParams.status[0]
    : searchParams.status;
  const status =
    statusRaw && statusRaw !== "All" ? (statusRaw as MethodVersionStatus) : "All";
  return { ...base, status };
}

function buildMethodWhere(q: string, status: MethodListParams["status"]): Prisma.AnalyticalMethodWhereInput {
  const where: Prisma.AnalyticalMethodWhereInput = {};
  if (q) {
    where.OR = [
      { methodCode: { contains: q } },
      { methodName: { contains: q } },
      { matrix: { contains: q } },
      { analyte: { contains: q } },
      { technique: { contains: q } },
      { standardRef: { contains: q } },
    ];
  }
  if (status && status !== "All") {
    where.currentVersion = { status };
  }
  return where;
}

export async function listAnalyticalMethods(
  params: MethodListParams,
): Promise<PaginatedResult<AnalyticalMethodListItem>> {
  const where = buildMethodWhere(params.q, params.status);
  const orderBy = buildPrismaOrderBy(params.sortBy, params.sortOrder, METHOD_SORT_MAP, DEFAULT_METHOD_ORDER);
  const { skip, take } = getSkipTake(params.page, params.limit);

  const [total, rows] = await Promise.all([
    db.analyticalMethod.count({ where }),
    db.analyticalMethod.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { currentVersion: { select: { version: true, status: true } } },
    }),
  ]);

  return {
    items: rows.map(mapMethodListItem),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}

export async function getAnalyticalMethodDetail(id: string): Promise<AnalyticalMethodDetail | null> {
  const row = await db.analyticalMethod.findUnique({
    where: { id },
    include: {
      currentVersion: { select: versionInclude.select },
      versions: versionInclude,
    },
  });
  if (!row) return null;
  return mapMethodDetail({
    ...row,
    currentVersion: row.currentVersion,
    versions: row.versions,
  });
}

export async function getMethodDashboardStats(): Promise<MethodDashboardStats> {
  const [totalMethods, versions] = await Promise.all([
    db.analyticalMethod.count(),
    db.methodVersion.groupBy({
      by: ["status"],
      _count: { status: true },
      where: {
        id: {
          in: (
            await db.analyticalMethod.findMany({
              where: { currentVersionId: { not: null } },
              select: { currentVersionId: true },
            })
          )
            .map((m) => m.currentVersionId)
            .filter(Boolean) as string[],
        },
      },
    }),
  ]);

  const counts = Object.fromEntries(versions.map((v) => [v.status, v._count.status]));
  return {
    totalMethods,
    draftCount: counts.Draft ?? 0,
    reviewCount: counts.Review ?? 0,
    approvedCount: counts.Approved ?? 0,
    obsoleteCount: counts.Obsolete ?? 0,
  };
}

export async function createAnalyticalMethodWithVersion(data: {
  methodCode: string;
  methodName: string;
  matrix: string;
  analyte: string;
  technique: string;
  standardRef: string;
  createdBy: string;
}) {
  const methodId = randomUUID();
  const versionId = randomUUID();
  const workflowId = randomUUID();

  return db.$transaction(async (tx) => {
    await tx.analyticalMethod.create({
      data: {
        id: methodId,
        ...data,
      },
    });

    await tx.methodVersion.create({
      data: {
        id: versionId,
        methodId,
        version: 1,
        status: "Draft",
        createdBy: data.createdBy,
        changeLog: "Phiên bản khởi tạo",
      },
    });

    await tx.methodWorkflow.create({
      data: {
        id: workflowId,
        methodVersionId: versionId,
        isDraft: true,
        sourceType: "Manual",
        layoutJson: JSON.stringify({ x: 0, y: 0, zoom: 1 }),
      },
    });

    await tx.workflowNode.createMany({
      data: [
        {
          id: randomUUID(),
          workflowId,
          nodeKey: "start",
          type: "Start",
          label: "Bắt đầu",
          positionX: 100,
          positionY: 100,
        },
        {
          id: randomUUID(),
          workflowId,
          nodeKey: "end",
          type: "End",
          label: "Kết thúc",
          positionX: 400,
          positionY: 100,
        },
      ],
    });

    const method = await tx.analyticalMethod.update({
      where: { id: methodId },
      data: { currentVersionId: versionId },
    });

    return method;
  });
}

export async function updateAnalyticalMethodMetadata(
  id: string,
  data: {
    methodCode: string;
    methodName: string;
    matrix: string;
    analyte: string;
    technique: string;
    standardRef: string;
  },
) {
  return db.analyticalMethod.update({ where: { id }, data });
}

export async function getCurrentMethodVersionId(methodId: string): Promise<string | null> {
  const method = await db.analyticalMethod.findUnique({
    where: { id: methodId },
    select: { currentVersionId: true },
  });
  return method?.currentVersionId ?? null;
}

export async function getMethodVersionById(versionId: string) {
  return db.methodVersion.findUnique({
    where: { id: versionId },
    include: { method: true },
  });
}

export async function isMethodVersionEditable(versionId: string): Promise<boolean> {
  const version = await db.methodVersion.findUnique({
    where: { id: versionId },
    select: { status: true },
  });
  return version?.status === "Draft" || version?.status === "Review";
}

export async function forkMethodVersion(methodId: string, createdBy: string, changeLog: string) {
  const method = await db.analyticalMethod.findUnique({
    where: { id: methodId },
    include: {
      currentVersion: {
        include: {
          documents: true,
          workflow: { include: { nodes: true, edges: true } },
          reagents: true,
          equipmentLinks: true,
          qcRequirements: true,
          acceptanceCriteria: true,
          safetyNotes: true,
        },
      },
    },
  });
  if (!method?.currentVersion) throw new Error("Không tìm thấy phiên bản hiện tại");

  const src = method.currentVersion;
  const newVersionId = randomUUID();
  const newVersionNumber = src.version + 1;
  const newWorkflowId = randomUUID();

  return db.$transaction(async (tx) => {
    await tx.methodVersion.create({
      data: {
        id: newVersionId,
        methodId,
        version: newVersionNumber,
        status: "Draft",
        createdBy,
        changeLog,
        effectiveDate: src.effectiveDate,
        reviewDate: src.reviewDate,
        estimatedDurationMinutes: src.estimatedDurationMinutes,
      },
    });

    await tx.methodWorkflow.create({
      data: {
        id: newWorkflowId,
        methodVersionId: newVersionId,
        layoutJson: src.workflow?.layoutJson ?? "{}",
        sourceType: src.workflow?.sourceType ?? "Manual",
        isDraft: true,
      },
    });

    if (src.workflow) {
      for (const node of src.workflow.nodes) {
        await tx.workflowNode.create({
          data: {
            id: randomUUID(),
            workflowId: newWorkflowId,
            nodeKey: node.nodeKey,
            type: node.type,
            label: node.label,
            description: node.description,
            positionX: node.positionX,
            positionY: node.positionY,
            configJson: node.configJson,
          },
        });
      }
      for (const edge of src.workflow.edges) {
        await tx.workflowEdge.create({
          data: {
            id: randomUUID(),
            workflowId: newWorkflowId,
            sourceNodeKey: edge.sourceNodeKey,
            targetNodeKey: edge.targetNodeKey,
            label: edge.label,
            conditionJson: edge.conditionJson,
          },
        });
      }
    }

    for (const doc of src.documents) {
      await tx.methodDocument.create({
        data: {
          id: randomUUID(),
          methodVersionId: newVersionId,
          filePath: doc.filePath,
          fileName: doc.fileName,
          fileType: doc.fileType,
          fileSizeBytes: doc.fileSizeBytes,
          uploadedBy: doc.uploadedBy,
          isPrimary: doc.isPrimary,
        },
      });
    }

    for (const r of src.reagents) {
      await tx.methodReagent.create({
        data: {
          id: randomUUID(),
          methodVersionId: newVersionId,
          workflowNodeKey: r.workflowNodeKey,
          chemicalId: r.chemicalId,
          standardId: r.standardId,
          nameFreeText: r.nameFreeText,
          casNumber: r.casNumber,
          amountPerSample: r.amountPerSample,
          unit: r.unit,
          isConsumable: r.isConsumable,
        },
      });
    }

    for (const e of src.equipmentLinks) {
      await tx.methodEquipment.create({
        data: {
          id: randomUUID(),
          methodVersionId: newVersionId,
          workflowNodeKey: e.workflowNodeKey,
          equipmentId: e.equipmentId,
          role: e.role,
        },
      });
    }

    for (const q of src.qcRequirements) {
      await tx.methodQCRequirement.create({
        data: {
          id: randomUUID(),
          methodVersionId: newVersionId,
          qcType: q.qcType,
          frequency: q.frequency,
          frequencyUnit: q.frequencyUnit,
          limitsJson: q.limitsJson,
        },
      });
    }

    for (const a of src.acceptanceCriteria) {
      await tx.methodAcceptanceCriteria.create({
        data: {
          id: randomUUID(),
          methodVersionId: newVersionId,
          analyte: a.analyte,
          criteriaJson: a.criteriaJson,
        },
      });
    }

    for (const s of src.safetyNotes) {
      await tx.methodSafetyNote.create({
        data: {
          id: randomUUID(),
          methodVersionId: newVersionId,
          noteType: s.noteType,
          content: s.content,
          chemicalReferenceId: s.chemicalReferenceId,
        },
      });
    }

    await tx.analyticalMethod.update({
      where: { id: methodId },
      data: { currentVersionId: newVersionId },
    });

    return newVersionId;
  });
}
