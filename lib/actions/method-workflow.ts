"use server";

import { revalidatePath } from "next/cache";
import type { WorkflowNodeType } from "@prisma/client";
import { requireSessionCanEdit } from "@/lib/auth/guards";
import { getCurrentMethodVersionId, isMethodVersionEditable } from "@/lib/services/analytical-methods/methods";
import {
  generateChecklistFromWorkflow,
  getMethodWorkflow,
  saveMethodWorkflow,
  type WorkflowSavePayload,
} from "@/lib/services/analytical-methods/method-workflow";

export async function fetchMethodWorkflow(methodId: string) {
  await requireSessionCanEdit();
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return null;
  return getMethodWorkflow(versionId);
}

export async function saveMethodWorkflowAction(methodId: string, payload: WorkflowSavePayload) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return { error: "Không tìm thấy phiên bản" };

  const editable = await isMethodVersionEditable(versionId);
  if (!editable) {
    return { error: "Phiên bản đã phê duyệt — tạo phiên bản mới để chỉnh sửa workflow" };
  }

  try {
    await saveMethodWorkflow(versionId, payload);
    revalidatePath(`/analytical-methods/${methodId}/workflow`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể lưu workflow" };
  }
}

export async function fetchMethodChecklist(methodId: string) {
  await requireSessionCanEdit();
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return [];
  return generateChecklistFromWorkflow(versionId);
}

export type { WorkflowSavePayload, WorkflowNodeType };
