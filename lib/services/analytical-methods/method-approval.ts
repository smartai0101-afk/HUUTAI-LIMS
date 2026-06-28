import type { MethodVersionStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { mapMethodApproval } from "@/lib/mappers/analytical-methods";
import type { MethodApprovalView } from "@/types/analytical-methods";

export const METHOD_STATUS_TRANSITIONS: Record<
  MethodVersionStatus,
  MethodVersionStatus[]
> = {
  Draft: ["Review", "Obsolete"],
  Review: ["Approved", "Draft", "Obsolete"],
  Approved: ["Obsolete"],
  Obsolete: [],
};

export function canTransitionMethodStatus(
  from: MethodVersionStatus,
  to: MethodVersionStatus,
): boolean {
  return METHOD_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertMethodSeparationOfDuties(params: {
  from: MethodVersionStatus;
  to: MethodVersionStatus;
  createdBy: string;
  performedBy: string;
  reviewerId?: string;
  approverId?: string;
}): string | null {
  if (params.to === "Review" && params.performedBy === params.createdBy) {
    return "Người gửi duyệt không được trùng người tạo phiên bản";
  }
  if (params.to === "Approved") {
    if (params.performedBy === params.createdBy) {
      return "Người phê duyệt không được trùng người tạo phiên bản";
    }
    if (params.reviewerId && params.performedBy === params.reviewerId) {
      return "Người phê duyệt nên khác người review (khuyến nghị ISO 17025)";
    }
  }
  return null;
}

export async function listMethodApprovals(methodVersionId: string): Promise<MethodApprovalView[]> {
  const rows = await db.methodApproval.findMany({
    where: { methodVersionId },
    orderBy: { performedAt: "desc" },
  });
  return rows.map(mapMethodApproval);
}

export async function transitionMethodVersionStatus(params: {
  methodVersionId: string;
  toStatus: MethodVersionStatus;
  performedBy: string;
  comment?: string;
}) {
  const version = await db.methodVersion.findUnique({
    where: { id: params.methodVersionId },
  });
  if (!version) throw new Error("Không tìm thấy phiên bản");

  const fromStatus = version.status;
  if (!canTransitionMethodStatus(fromStatus, params.toStatus)) {
    throw new Error(`Không thể chuyển từ ${fromStatus} sang ${params.toStatus}`);
  }

  const sodError = assertMethodSeparationOfDuties({
    from: fromStatus,
    to: params.toStatus,
    createdBy: version.createdBy,
    performedBy: params.performedBy,
    reviewerId: version.reviewerId,
    approverId: version.approverId,
  });
  if (sodError) throw new Error(sodError);

  const updateData: {
    status: MethodVersionStatus;
    reviewerId?: string;
    approverId?: string;
    approvedAt?: Date;
  } = { status: params.toStatus };

  if (params.toStatus === "Review") {
    updateData.reviewerId = params.performedBy;
  }
  if (params.toStatus === "Approved") {
    updateData.approverId = params.performedBy;
    updateData.approvedAt = new Date();
  }

  await db.$transaction(async (tx) => {
    await tx.methodVersion.update({
      where: { id: params.methodVersionId },
      data: updateData,
    });

    if (params.toStatus === "Approved") {
      await tx.methodWorkflow.updateMany({
        where: { methodVersionId: params.methodVersionId },
        data: { isDraft: false },
      });
    }

    await tx.methodApproval.create({
      data: {
        id: randomUUID(),
        methodVersionId: params.methodVersionId,
        action: `Chuyển trạng thái ${fromStatus} → ${params.toStatus}`,
        fromStatus,
        toStatus: params.toStatus,
        performedBy: params.performedBy,
        comment: params.comment ?? "",
      },
    });
  });
}

export async function isMethodVersionApproved(versionId: string): Promise<boolean> {
  const version = await db.methodVersion.findUnique({
    where: { id: versionId },
    select: { status: true },
  });
  return version?.status === "Approved";
}
