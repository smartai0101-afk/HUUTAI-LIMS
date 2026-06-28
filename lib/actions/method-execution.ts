"use server";

import { revalidatePath } from "next/cache";
import { requireSessionCanApprove, requireSessionCanEdit } from "@/lib/auth/guards";
import { getCurrentMethodVersionId, isMethodVersionEditable } from "@/lib/services/analytical-methods/methods";
import {
  calculateReagentRequirements,
  deleteMethodReagent,
  listMethodReagents,
  saveMethodReagent,
} from "@/lib/services/analytical-methods/method-reagents";
import {
  checkMethodEquipmentWarnings,
  deleteMethodEquipment,
  listMethodEquipment,
  saveMethodEquipment,
} from "@/lib/services/analytical-methods/method-equipment-check";
import {
  deleteMethodAcceptanceCriteria,
  deleteMethodQCRequirement,
  deleteMethodSafetyNote,
  listMethodAcceptanceCriteria,
  listMethodQCRequirements,
  listMethodSafetyNotes,
  runMethodSafetyChecks,
  saveMethodAcceptanceCriteria,
  saveMethodQCRequirement,
  saveMethodSafetyNote,
} from "@/lib/services/analytical-methods/method-safety-check";
import { listMethodApprovals } from "@/lib/services/analytical-methods/method-approval";
import {
  abortMethodExecution,
  completeMethodExecution,
  createMethodExecution,
  getMethodExecution,
  updateMethodExecutionStep,
} from "@/lib/services/analytical-methods/method-execution";
import type { MethodExecutionStepStatus } from "@prisma/client";

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function actorName(auth: Awaited<ReturnType<typeof requireSessionCanEdit>>) {
  if ("error" in auth) return "";
  return auth.user.name || auth.user.email;
}

export async function fetchMethodReagents(methodId: string) {
  await requireSessionCanEdit();
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return [];
  return listMethodReagents(versionId);
}

export async function saveMethodReagentAction(methodId: string, fd: FormData) {
  await requireSessionCanEdit();
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return { error: "Không tìm thấy phiên bản" };
  if (!(await isMethodVersionEditable(versionId))) {
    return { error: "Phiên bản đã phê duyệt — tạo phiên bản mới để sửa" };
  }

  await saveMethodReagent({
    id: str(fd, "id") || undefined,
    methodVersionId: versionId,
    workflowNodeKey: str(fd, "workflowNodeKey"),
    chemicalId: str(fd, "chemicalId") || null,
    standardId: str(fd, "standardId") || null,
    nameFreeText: str(fd, "nameFreeText"),
    casNumber: str(fd, "casNumber"),
    amountPerSample: Number(str(fd, "amountPerSample")) || 0,
    unit: str(fd, "unit"),
    isConsumable: str(fd, "isConsumable") === "true",
  });
  revalidatePath(`/analytical-methods/${methodId}/reagents`);
  return { ok: true };
}

export async function deleteMethodReagentAction(methodId: string, id: string) {
  await requireSessionCanEdit();
  await deleteMethodReagent(id);
  revalidatePath(`/analytical-methods/${methodId}/reagents`);
  return { ok: true };
}

export async function calculateReagentsAction(methodId: string, sampleCount: number) {
  await requireSessionCanEdit();
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return [];
  return calculateReagentRequirements(versionId, sampleCount);
}

export async function fetchMethodEquipment(methodId: string) {
  await requireSessionCanEdit();
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return [];
  return listMethodEquipment(versionId);
}

export async function fetchEquipmentWarnings(methodId: string) {
  await requireSessionCanEdit();
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return [];
  return checkMethodEquipmentWarnings(versionId);
}

export async function saveMethodEquipmentAction(methodId: string, fd: FormData) {
  await requireSessionCanEdit();
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return { error: "Không tìm thấy phiên bản" };
  if (!(await isMethodVersionEditable(versionId))) {
    return { error: "Phiên bản đã phê duyệt — tạo phiên bản mới để sửa" };
  }

  const equipmentId = str(fd, "equipmentId");
  if (!equipmentId) return { error: "Chọn thiết bị" };

  await saveMethodEquipment({
    id: str(fd, "id") || undefined,
    methodVersionId: versionId,
    workflowNodeKey: str(fd, "workflowNodeKey"),
    equipmentId,
    role: str(fd, "role"),
  });
  revalidatePath(`/analytical-methods/${methodId}/equipment`);
  return { ok: true };
}

export async function deleteMethodEquipmentAction(methodId: string, id: string) {
  await requireSessionCanEdit();
  await deleteMethodEquipment(id);
  revalidatePath(`/analytical-methods/${methodId}/equipment`);
  return { ok: true };
}

export async function fetchMethodQC(methodId: string) {
  await requireSessionCanEdit();
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return { qc: [], acceptance: [], safety: [] };
  const [qc, acceptance, safety] = await Promise.all([
    listMethodQCRequirements(versionId),
    listMethodAcceptanceCriteria(versionId),
    listMethodSafetyNotes(versionId),
  ]);
  return { qc, acceptance, safety };
}

export async function saveMethodQCAction(methodId: string, fd: FormData) {
  await requireSessionCanEdit();
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return { error: "Không tìm thấy phiên bản" };
  if (!(await isMethodVersionEditable(versionId))) {
    return { error: "Phiên bản đã phê duyệt — tạo phiên bản mới để sửa" };
  }

  await saveMethodQCRequirement({
    id: str(fd, "id") || undefined,
    methodVersionId: versionId,
    qcType: str(fd, "qcType"),
    frequency: str(fd, "frequency"),
    frequencyUnit: str(fd, "frequencyUnit"),
    limitsJson: str(fd, "limitsJson") || "{}",
  });
  revalidatePath(`/analytical-methods/${methodId}/qc`);
  return { ok: true };
}

export async function saveMethodAcceptanceAction(methodId: string, fd: FormData) {
  await requireSessionCanEdit();
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return { error: "Không tìm thấy phiên bản" };

  await saveMethodAcceptanceCriteria({
    id: str(fd, "id") || undefined,
    methodVersionId: versionId,
    analyte: str(fd, "analyte"),
    criteriaJson: str(fd, "criteriaJson") || "{}",
  });
  revalidatePath(`/analytical-methods/${methodId}/qc`);
  return { ok: true };
}

export async function deleteMethodQCAction(methodId: string, id: string) {
  await requireSessionCanEdit();
  await deleteMethodQCRequirement(id);
  revalidatePath(`/analytical-methods/${methodId}/qc`);
  return { ok: true };
}

export async function deleteMethodAcceptanceAction(methodId: string, id: string) {
  await requireSessionCanEdit();
  await deleteMethodAcceptanceCriteria(id);
  revalidatePath(`/analytical-methods/${methodId}/qc`);
  return { ok: true };
}

export async function runSafetyChecksAction(methodId: string) {
  await requireSessionCanEdit();
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return [];
  return runMethodSafetyChecks(versionId);
}

export async function fetchMethodApprovals(methodId: string) {
  await requireSessionCanEdit();
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return [];
  return listMethodApprovals(versionId);
}

export async function createMethodExecutionAction(methodId: string, sampleCount: number) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return { error: "Không tìm thấy phiên bản" };

  try {
    const executionId = await createMethodExecution({
      methodVersionId: versionId,
      sampleCount,
      startedBy: actorName(auth),
    });
    return { executionId };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể tạo thực hiện" };
  }
}

export async function fetchMethodExecution(executionId: string) {
  await requireSessionCanEdit();
  return getMethodExecution(executionId);
}

export async function updateExecutionStepAction(
  stepId: string,
  status: MethodExecutionStepStatus,
  comment?: string,
) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };
  await updateMethodExecutionStep({
    stepId,
    status,
    operator: actorName(auth),
    comment,
  });
  return { ok: true };
}

export async function completeExecutionAction(executionId: string) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };
  await completeMethodExecution(executionId, actorName(auth));
  return { ok: true };
}

export async function abortExecutionAction(executionId: string, reason: string) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };
  await abortMethodExecution(executionId, actorName(auth), reason);
  return { ok: true };
}
