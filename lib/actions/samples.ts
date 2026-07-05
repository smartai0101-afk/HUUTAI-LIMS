"use server";

import type { SampleStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logActivity, writeAuditLog } from "@/lib/audit";
import {
  requirePermission,
  requireSessionCanApprove,
  requireSessionCanEdit,
  requireSessionCanManage,
} from "@/lib/auth/guards";
import { assignAnalysisGroups } from "@/lib/services/samples/analysis-assignment";
import {
  getSampleDetail,
  transitionSampleStatus,
} from "@/lib/services/samples/sample-detail";
import {
  createSample,
  updateSample,
  updateSampleCode,
} from "@/lib/services/samples/sample-receive";
import {
  cancelSampleRequest,
  createSampleRequest,
  reviewSampleRequest,
  submitSampleRequest,
  updateSampleRequest,
} from "@/lib/services/samples/sample-requests";
import { disposeSample, storeSample } from "@/lib/services/samples/sample-storage";
import { transferSampleCustody } from "@/lib/services/samples/sample-custody";
import {
  sampleAssignSchema,
  sampleDisposeSchema,
  sampleReceiveSchema,
  sampleRequestSchema,
  sampleStorageSchema,
} from "@/lib/validators/samples";

const SAMPLE_PATHS = [
  "/samples",
  "/samples/receive",
  "/samples/assign",
  "/samples/tracking",
  "/samples/storage",
  "/samples/requests",
  "/samples/requests/review",
  "/samples/reception-log",
];

function revalidateSamples() {
  SAMPLE_PATHS.forEach((p) => revalidatePath(p));
  revalidatePath("/samples", "layout");
}

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseStringArray(fd: FormData, key: string): string[] {
  const raw = fd.get(key);
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return raw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

function receiveInputFromForm(fd: FormData) {
  return {
    sampleName: str(fd, "sampleName"),
    sampleType: str(fd, "sampleType"),
    receivedAt: str(fd, "receivedAt"),
    receivedBy: str(fd, "receivedBy"),
    conditionOnReceipt: str(fd, "conditionOnReceipt") as "Pass" | "Fail" | "NeedConfirmation" | "Rejected",
    conditionNote: str(fd, "conditionNote"),
    quantity: fd.get("quantity") ? Number(fd.get("quantity")) : null,
    unit: str(fd, "unit"),
    customerSampleCode: str(fd, "customerSampleCode"),
    deliveredBy: str(fd, "deliveredBy"),
    containerType: str(fd, "containerType"),
    preservationCondition: str(fd, "preservationCondition"),
    storageLocation: str(fd, "storageLocation"),
    retentionUntil: str(fd, "retentionUntil"),
    note: str(fd, "note"),
    requestId: str(fd, "requestId"),
    primaryMethodId: str(fd, "primaryMethodId"),
    primaryMethodVersionId: str(fd, "primaryMethodVersionId"),
    chemicalReferenceId: str(fd, "chemicalReferenceId"),
    dueDate: str(fd, "dueDate"),
    parameterNames: parseStringArray(fd, "parameterNames"),
  };
}

export async function createSampleAction(fd: FormData) {
  const auth = await requirePermission("samples_receive", "write");
  if ("error" in auth) return { error: auth.error };

  const parsed = sampleReceiveSchema.safeParse(receiveInputFromForm(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    const sample = await createSample(parsed.data, auth.user.name);
    await writeAuditLog({
      user: auth.user.name,
      action: "Create",
      entityType: "Sample",
      entityId: sample.id,
      object: sample.sampleCode,
      after: parsed.data,
    });
    revalidateSamples();
    return { success: true, id: sample.id, sampleCode: sample.sampleCode };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể tiếp nhận mẫu" };
  }
}

export async function updateSampleAction(id: string, fd: FormData) {
  const auth = await requirePermission("samples_receive", "write");
  if ("error" in auth) return { error: auth.error };

  const parsed = sampleReceiveSchema.safeParse(receiveInputFromForm(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    await updateSample(id, parsed.data, auth.user.name);
    revalidateSamples();
    revalidatePath(`/samples/${id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể cập nhật mẫu" };
  }
}

export async function transitionSampleStatusAction(id: string, toStatus: SampleStatus, reason = "") {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };

  try {
    await transitionSampleStatus(id, toStatus, auth.user.name, reason);
    await logActivity({
      user: auth.user.name,
      action: "StatusChange",
      entityType: "Sample",
      entityId: id,
      object: id,
      after: { status: toStatus, reason },
      actorUserId: auth.user.id,
    });
    revalidateSamples();
    revalidatePath(`/samples/${id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể chuyển trạng thái" };
  }
}

export async function updateSampleCodeAction(id: string, newCode: string) {
  const auth = await requireSessionCanApprove();
  if ("error" in auth) return { error: auth.error };

  try {
    await updateSampleCode(id, newCode, auth.user.name);
    revalidateSamples();
    revalidatePath(`/samples/${id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể đổi mã mẫu" };
  }
}

export async function assignAnalysisGroupsAction(fd: FormData) {
  const auth = await requirePermission("samples_assign", "write");
  if ("error" in auth) return { error: auth.error };
  const manage = await requireSessionCanManage();
  if ("error" in manage) return { error: manage.error };

  const groupsRaw = fd.get("groups");
  let groups: unknown[] = [];
  if (typeof groupsRaw === "string" && groupsRaw.trim()) {
    try {
      groups = JSON.parse(groupsRaw);
    } catch {
      return { error: "Dữ liệu phân công không hợp lệ" };
    }
  }

  const parsed = sampleAssignSchema.safeParse({
    sampleId: str(fd, "sampleId"),
    groups,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    await assignAnalysisGroups(parsed.data, auth.user.name);
    revalidateSamples();
    revalidatePath(`/samples/${parsed.data.sampleId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể phân công" };
  }
}

/** @deprecated Use assignAnalysisGroupsAction */
export async function assignSampleTestsAction(fd: FormData) {
  return assignAnalysisGroupsAction(fd);
}

function requestInputFromForm(fd: FormData) {
  return {
    requestDate: str(fd, "requestDate"),
    requesterName: str(fd, "requesterName"),
    sampleType: str(fd, "sampleType"),
    sampleCount: Number(fd.get("sampleCount") ?? 1),
    customerName: str(fd, "customerName"),
    department: str(fd, "department"),
    purpose: str(fd, "purpose"),
    dueDate: str(fd, "dueDate"),
    note: str(fd, "note"),
    priority: str(fd, "priority") || "normal",
    requestedTests: parseStringArray(fd, "requestedTests"),
    methodIds: parseStringArray(fd, "methodIds"),
  };
}

export async function createSampleRequestAction(fd: FormData) {
  const auth = await requirePermission("samples_requests", "write");
  if ("error" in auth) return { error: auth.error };

  const parsed = sampleRequestSchema.safeParse(requestInputFromForm(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    const request = await createSampleRequest(parsed.data, auth.user.name);
    revalidatePath("/samples/requests");
    return { success: true, id: request.id, requestCode: request.requestCode };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể tạo phiếu yêu cầu" };
  }
}

export async function updateSampleRequestAction(id: string, fd: FormData) {
  const auth = await requirePermission("samples_requests", "write");
  if ("error" in auth) return { error: auth.error };

  const parsed = sampleRequestSchema.safeParse(requestInputFromForm(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    await updateSampleRequest(id, parsed.data, auth.user.name);
    revalidatePath("/samples/requests");
    revalidatePath(`/samples/requests/${id}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể cập nhật phiếu yêu cầu" };
  }
}

export async function submitSampleRequestAction(id: string) {
  const auth = await requirePermission("samples_requests", "write");
  if ("error" in auth) return { error: auth.error };

  try {
    await submitSampleRequest(id, auth.user.name);
    revalidateSamples();
    revalidatePath("/samples/requests/review");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể gửi phiếu yêu cầu" };
  }
}

export async function reviewSampleRequestAction(id: string) {
  const auth = await requirePermission("samples_request_review", "write");
  if ("error" in auth) return { error: auth.error };

  try {
    await reviewSampleRequest(id, auth.user.name);
    revalidateSamples();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể kiểm tra phiếu" };
  }
}

export async function cancelSampleRequestAction(id: string, reason: string) {
  const auth = await requirePermission("samples_requests", "write");
  if ("error" in auth) return { error: auth.error };
  const manage = await requireSessionCanManage();
  if ("error" in manage) return { error: manage.error };

  try {
    await cancelSampleRequest(id, reason, auth.user.name);
    revalidateSamples();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể hủy phiếu" };
  }
}

export async function storeSampleAction(fd: FormData) {
  const auth = await requirePermission("samples_storage", "write");
  if ("error" in auth) return { error: auth.error };

  const parsed = sampleStorageSchema.safeParse({
    sampleId: str(fd, "sampleId"),
    storageLocation: str(fd, "storageLocation"),
    preservationCondition: str(fd, "preservationCondition"),
    retentionUntil: str(fd, "retentionUntil"),
    storedBy: str(fd, "storedBy"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    await storeSample(parsed.data, auth.user.name);
    revalidateSamples();
    revalidatePath(`/samples/${parsed.data.sampleId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể lưu mẫu" };
  }
}

export async function disposeSampleAction(fd: FormData) {
  const auth = await requirePermission("samples_storage", "write");
  if ("error" in auth) return { error: auth.error };
  const approve = await requireSessionCanApprove();
  if ("error" in approve) return { error: approve.error };

  const parsed = sampleDisposeSchema.safeParse({
    sampleId: str(fd, "sampleId"),
    disposeReason: str(fd, "disposeReason"),
    disposedBy: str(fd, "disposedBy"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    await disposeSample(parsed.data, auth.user.name);
    revalidateSamples();
    revalidatePath(`/samples/${parsed.data.sampleId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể hủy mẫu" };
  }
}

export async function transferCustodyAction(
  sampleId: string,
  fromPerson: string,
  toPerson: string,
  location: string,
  note: string,
) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };

  try {
    await transferSampleCustody(sampleId, {
      fromPerson,
      toPerson,
      location,
      note,
      performedBy: auth.user.name,
    });
    revalidatePath(`/samples/${sampleId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể chuyển giao mẫu" };
  }
}

export async function fetchSampleDetail(id: string) {
  const auth = await requirePermission("samples_list", "read");
  if ("error" in auth) return { error: auth.error };
  const detail = await getSampleDetail(id);
  if (!detail) return { error: "Không tìm thấy mẫu" };
  return { detail };
}
