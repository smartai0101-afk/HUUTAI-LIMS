"use server";

import { revalidatePath } from "next/cache";
import { requireSessionCanApprove, requireSessionCanEdit } from "@/lib/auth/guards";
import { deleteSopFile, saveSopFile } from "@/lib/sop-upload";
import {
  createAnalyticalMethodWithVersion,
  forkMethodVersion,
  getAnalyticalMethodDetail,
  getCurrentMethodVersionId,
  getMethodDashboardStats,
  getMethodVersionById,
  isMethodVersionEditable,
  listAnalyticalMethods,
  parseMethodListParams,
  updateAnalyticalMethodMetadata,
} from "@/lib/services/analytical-methods/methods";
import {
  createMethodDocument,
  deleteMethodDocument,
  listMethodDocuments,
  setPrimaryMethodDocument,
} from "@/lib/services/analytical-methods/method-documents";
import { transitionMethodVersionStatus } from "@/lib/services/analytical-methods/method-approval";
import { extractSopStub } from "@/lib/services/analytical-methods/method-extraction";
import type { MethodVersionStatus } from "@prisma/client";

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function actorName(auth: Awaited<ReturnType<typeof requireSessionCanEdit>>) {
  if ("error" in auth) return "";
  return auth.user.name || auth.user.email;
}

export async function fetchMethodDashboardStats() {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) throw new Error(auth.error);
  return getMethodDashboardStats();
}

export async function fetchAnalyticalMethods(searchParams: Record<string, string | string[] | undefined>) {
  await requireSessionCanEdit();
  return listAnalyticalMethods(parseMethodListParams(searchParams));
}

export async function fetchAnalyticalMethodDetail(id: string) {
  await requireSessionCanEdit();
  return getAnalyticalMethodDetail(id);
}

function matrixIdsFromForm(fd: FormData): string[] {
  return [...new Set(fd.getAll("matrixIds").map((v) => String(v).trim()).filter(Boolean))];
}

function testMethodIdsFromForm(fd: FormData): string[] {
  return [...new Set(fd.getAll("testMethodIds").map((v) => String(v).trim()).filter(Boolean))];
}

export async function createAnalyticalMethodAction(fd: FormData) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };
  const methodCode = str(fd, "methodCode");
  const methodName = str(fd, "methodName");
  if (!methodCode || !methodName) {
    return { error: "Mã và tên phương pháp là bắt buộc" };
  }

  try {
    const method = await createAnalyticalMethodWithVersion({
      methodCode,
      methodName,
      matrixIds: matrixIdsFromForm(fd),
      testMethodIds: testMethodIdsFromForm(fd),
      technique: str(fd, "technique"),
      standardRef: str(fd, "standardRef"),
      createdBy: actorName(auth),
    });
    revalidatePath("/analytical-methods");
    return { id: method.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể tạo phương pháp" };
  }
}

export async function updateAnalyticalMethodAction(id: string, fd: FormData) {
  await requireSessionCanEdit();
  const methodCode = str(fd, "methodCode");
  const methodName = str(fd, "methodName");
  if (!methodCode || !methodName) {
    return { error: "Mã và tên phương pháp là bắt buộc" };
  }

  try {
    await updateAnalyticalMethodMetadata(id, {
      methodCode,
      methodName,
      matrixIds: matrixIdsFromForm(fd),
      testMethodIds: testMethodIdsFromForm(fd),
      technique: str(fd, "technique"),
      standardRef: str(fd, "standardRef"),
    });
    revalidatePath(`/analytical-methods/${id}`);
    revalidatePath("/analytical-methods/list");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể cập nhật" };
  }
}

export async function uploadMethodSopAction(methodId: string, fd: FormData) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return { error: "Không tìm thấy phiên bản" };

  const editable = await isMethodVersionEditable(versionId);
  if (!editable) {
    return { error: "Phiên bản đã phê duyệt — hãy tạo phiên bản mới trước khi upload SOP" };
  }

  const file = fd.get("sop");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Vui lòng chọn file SOP" };
  }

  const saved = await saveSopFile(file);
  if (saved.error) return { error: saved.error };
  if (!saved.path) return { error: "Upload thất bại" };

  const isPrimary = str(fd, "isPrimary") === "true";
  await createMethodDocument({
    methodVersionId: versionId,
    filePath: saved.path,
    fileName: file.name,
    fileType: file.type || file.name.split(".").pop() || "",
    fileSizeBytes: file.size,
    uploadedBy: actorName(auth),
    isPrimary,
  });

  revalidatePath(`/analytical-methods/${methodId}/documents`);
  return { ok: true };
}

export async function deleteMethodSopAction(methodId: string, documentId: string) {
  await requireSessionCanEdit();
  const { getMethodDocument, deleteMethodDocument } = await import(
    "@/lib/services/analytical-methods/method-documents"
  );
  const doc = await getMethodDocument(documentId);
  if (doc?.filePath) await deleteSopFile(doc.filePath);
  await deleteMethodDocument(documentId);
  revalidatePath(`/analytical-methods/${methodId}/documents`);
  return { ok: true };
}

export async function setPrimarySopAction(methodId: string, documentId: string) {
  await requireSessionCanEdit();
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return { error: "Không tìm thấy phiên bản" };
  await setPrimaryMethodDocument(documentId, versionId);
  revalidatePath(`/analytical-methods/${methodId}/documents`);
  return { ok: true };
}

export async function fetchMethodDocuments(methodId: string) {
  await requireSessionCanEdit();
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return [];
  return listMethodDocuments(versionId);
}

export async function forkMethodVersionAction(methodId: string, changeLog: string) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };
  try {
    const version = await getMethodVersionById((await getCurrentMethodVersionId(methodId))!);
    if (version?.status !== "Approved") {
      return { error: "Chỉ fork từ phiên bản đã phê duyệt" };
    }
    const newVersionId = await forkMethodVersion(
      methodId,
      actorName(auth),
      changeLog || "Phiên bản mới từ bản đã phê duyệt",
    );
    revalidatePath(`/analytical-methods/${methodId}`);
    return { versionId: newVersionId };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể tạo phiên bản mới" };
  }
}

export async function transitionMethodStatusAction(
  methodId: string,
  toStatus: MethodVersionStatus,
  comment?: string,
) {
  const auth =
    toStatus === "Approved" ? await requireSessionCanApprove() : await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return { error: "Không tìm thấy phiên bản" };

  try {
    await transitionMethodVersionStatus({
      methodVersionId: versionId,
      toStatus,
      performedBy: actorName(auth),
      comment,
    });
    revalidatePath(`/analytical-methods/${methodId}`);
    revalidatePath(`/analytical-methods/${methodId}/approvals`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể chuyển trạng thái" };
  }
}

export async function extractSopAction(methodId: string, documentId: string) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };
  const versionId = await getCurrentMethodVersionId(methodId);
  if (!versionId) return { error: "Không tìm thấy phiên bản" };

  const result = await extractSopStub({
    methodVersionId: versionId,
    documentId,
    requestedBy: actorName(auth),
  });
  return result;
}
