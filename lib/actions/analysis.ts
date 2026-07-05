"use server";

import { revalidatePath } from "next/cache";
import {
  requirePermission,
  requireSessionCanApprove,
  requireSessionCanManage,
} from "@/lib/auth/guards";
import {
  acceptAssignment,
  rejectAssignment,
} from "@/lib/services/analysis/analysis-inbox";
import { assignAnalystToTask } from "@/lib/services/analysis/analyst-assignment";
import { createWorklist, completeWorklist, startWorklist } from "@/lib/services/analysis/worklist";
import { closeDeviation, createCapaAction, verifyCapaAction } from "@/lib/services/analysis/deviation";
import { listSamplePrepTasks, getSamplePrepChecklist } from "@/lib/services/analysis/sample-prep";
import { uploadLimsAttachment, linkRawDataToResult } from "@/lib/services/lims-attachment";
import {
  completeWorksheet,
  createWorksheet,
  startWorksheet,
} from "@/lib/services/analysis/worksheet";
import { saveTestResult, submitResultsForQc } from "@/lib/services/analysis/test-results";
import { saveQcCheck, overrideQcFail } from "@/lib/services/analysis/qc-check";
import {
  approveTask,
  rejectTask,
  requestRerun,
  submitForReview,
} from "@/lib/services/analysis/review";
import {
  assignAnalystSchema,
  createWorklistSchema,
  createWorksheetSchema,
  qcCheckSchema,
  rejectAssignmentSchema,
  saveTestResultSchema,
} from "@/lib/validators/analysis";

const ANALYSIS_PATHS = [
  "/analysis/inbox",
  "/analysis/assign-analyst",
  "/analysis/worklists",
  "/analysis/worksheets",
  "/analysis/sample-prep",
  "/analysis/results",
  "/analysis/qc",
  "/analysis/deviations",
  "/analysis/review",
];

function revalidateAnalysis() {
  ANALYSIS_PATHS.forEach((p) => revalidatePath(p));
  revalidatePath("/analysis", "layout");
  revalidatePath("/samples");
}

function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

function parseJsonArray(fd: FormData, key: string): string[] {
  const raw = str(fd, key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function acceptAssignmentAction(assignmentId: string) {
  const auth = await requirePermission("analysis_inbox", "write");
  if ("error" in auth) return { error: auth.error };
  const manage = await requireSessionCanManage();
  if ("error" in manage) return { error: manage.error };

  try {
    await acceptAssignment(assignmentId, auth.user.name);
    revalidateAnalysis();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể tiếp nhận" };
  }
}

export async function rejectAssignmentAction(fd: FormData) {
  const auth = await requirePermission("analysis_inbox", "write");
  if ("error" in auth) return { error: auth.error };
  const manage = await requireSessionCanManage();
  if ("error" in manage) return { error: manage.error };

  const parsed = rejectAssignmentSchema.safeParse({
    assignmentId: str(fd, "assignmentId"),
    rejectionReason: str(fd, "rejectionReason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    await rejectAssignment(parsed.data.assignmentId, parsed.data.rejectionReason, auth.user.name);
    revalidateAnalysis();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể từ chối" };
  }
}

export async function assignAnalystAction(fd: FormData) {
  const auth = await requirePermission("analysis_assign_analyst", "write");
  if ("error" in auth) return { error: auth.error };
  const manage = await requireSessionCanManage();
  if ("error" in manage) return { error: manage.error };

  const parsed = assignAnalystSchema.safeParse({
    taskId: str(fd, "taskId"),
    analystId: str(fd, "analystId"),
    internalDueDate: str(fd, "internalDueDate"),
    note: str(fd, "note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    await assignAnalystToTask(parsed.data, auth.user.name);
    revalidateAnalysis();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể phân công analyst" };
  }
}

export async function createWorklistAction(fd: FormData) {
  const auth = await requirePermission("analysis_worklist", "write");
  if ("error" in auth) return { error: auth.error };

  const parsed = createWorklistSchema.safeParse({
    departmentId: str(fd, "departmentId"),
    methodId: str(fd, "methodId"),
    methodVersionId: str(fd, "methodVersionId") || undefined,
    equipmentId: str(fd, "equipmentId"),
    analystId: str(fd, "analystId"),
    taskIds: parseJsonArray(fd, "taskIds"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    const wl = await createWorklist(parsed.data, auth.user.name);
    revalidateAnalysis();
    return { success: true, id: wl.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể tạo worklist" };
  }
}

export async function startWorklistAction(id: string) {
  const auth = await requirePermission("analysis_worklist", "write");
  if ("error" in auth) return { error: auth.error };

  try {
    await startWorklist(id, auth.user.name);
    revalidateAnalysis();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể chạy worklist" };
  }
}

export async function completeWorklistAction(id: string) {
  const auth = await requirePermission("analysis_worklist", "write");
  if ("error" in auth) return { error: auth.error };

  try {
    await completeWorklist(id, auth.user.name);
    revalidateAnalysis();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể hoàn thành worklist" };
  }
}

export async function createWorksheetAction(fd: FormData) {
  const auth = await requirePermission("analysis_worksheet", "write");
  if ("error" in auth) return { error: auth.error };

  const parsed = createWorksheetSchema.safeParse({
    worklistId: str(fd, "worklistId"),
    chemicalIds: parseJsonArray(fd, "chemicalIds"),
    standardIds: parseJsonArray(fd, "standardIds"),
    crmIds: parseJsonArray(fd, "crmIds"),
    conditionNote: str(fd, "conditionNote"),
    qcSamples: parseJsonArray(fd, "qcSamples"),
    note: str(fd, "note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    const ws = await createWorksheet(parsed.data, auth.user.name);
    revalidateAnalysis();
    return { success: true, id: ws.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể tạo worksheet" };
  }
}

export async function startWorksheetAction(id: string) {
  const auth = await requirePermission("analysis_worksheet", "write");
  if ("error" in auth) return { error: auth.error };

  try {
    await startWorksheet(id, auth.user.name);
    revalidateAnalysis();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể bắt đầu worksheet" };
  }
}

export async function completeWorksheetAction(id: string) {
  const auth = await requirePermission("analysis_worksheet", "write");
  if ("error" in auth) return { error: auth.error };

  try {
    await completeWorksheet(id);
    revalidateAnalysis();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể hoàn thành worksheet" };
  }
}

export async function saveTestResultAction(fd: FormData) {
  const auth = await requirePermission("analysis_results", "write");
  if ("error" in auth) return { error: auth.error };

  const parsed = saveTestResultSchema.safeParse({
    resultId: str(fd, "resultId"),
    resultValue: str(fd, "resultValue"),
    unit: str(fd, "unit"),
    lod: str(fd, "lod"),
    loq: str(fd, "loq"),
    limitValue: str(fd, "limitValue"),
    evaluation: str(fd, "evaluation") || undefined,
    note: str(fd, "note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    await saveTestResult(parsed.data, auth.user.name);
    revalidateAnalysis();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể lưu kết quả" };
  }
}

export async function submitResultsForQcAction(taskId: string) {
  const auth = await requirePermission("analysis_results", "write");
  if ("error" in auth) return { error: auth.error };

  try {
    await submitResultsForQc(taskId);
    revalidateAnalysis();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể gửi QC" };
  }
}

export async function uploadRawDataAction(resultId: string, fd: FormData) {
  const auth = await requirePermission("analysis_results", "write");
  if ("error" in auth) return { error: auth.error };

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Vui lòng chọn file raw data" };
  }

  try {
    const attachment = await uploadLimsAttachment("test_result", resultId, file, auth.user.name);
    await linkRawDataToResult(resultId, attachment.id, auth.user.name);
    revalidateAnalysis();
    return { success: true, attachmentId: attachment.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể upload raw data" };
  }
}

export async function closeDeviationAction(deviationId: string, rootCause: string) {
  const auth = await requirePermission("analysis_deviation", "write");
  if ("error" in auth) return { error: auth.error };

  try {
    await closeDeviation(deviationId, rootCause, auth.user.name);
    revalidateAnalysis();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể đóng sai lệch" };
  }
}

export async function createCapaActionAction(
  deviationId: string,
  actionType: string,
  description: string,
  assignedTo: string,
  dueDate?: string,
) {
  const auth = await requirePermission("analysis_deviation", "write");
  if ("error" in auth) return { error: auth.error };

  try {
    await createCapaAction(
      deviationId,
      { actionType, description, assignedTo, dueDate },
      auth.user.name,
    );
    revalidateAnalysis();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể tạo CAPA" };
  }
}

export async function verifyCapaActionAction(capaId: string) {
  const auth = await requirePermission("analysis_deviation", "write");
  if ("error" in auth) return { error: auth.error };
  const approve = await requireSessionCanApprove();
  if ("error" in approve) return { error: approve.error };

  try {
    await verifyCapaAction(capaId, auth.user.name);
    revalidateAnalysis();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể xác nhận CAPA" };
  }
}

export async function fetchSamplePrepChecklistAction(taskId: string) {
  const auth = await requirePermission("analysis_sample_prep", "read");
  if ("error" in auth) return { error: auth.error };

  const checklist = await getSamplePrepChecklist(taskId);
  if (!checklist) return { error: "Không tìm thấy task" };
  return { checklist };
}

export async function saveQcCheckAction(fd: FormData) {
  const auth = await requirePermission("analysis_qc", "write");
  if ("error" in auth) return { error: auth.error };

  const parsed = qcCheckSchema.safeParse({
    taskId: str(fd, "taskId"),
    worksheetId: str(fd, "worksheetId") || undefined,
    checkType: str(fd, "checkType"),
    status: str(fd, "status"),
    expectedValue: str(fd, "expectedValue") || undefined,
    measuredValue: str(fd, "measuredValue") || undefined,
    recoveryPercent: str(fd, "recoveryPercent") || undefined,
    overrideReason: str(fd, "overrideReason") || undefined,
    note: str(fd, "note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    await saveQcCheck(parsed.data, auth.user.name);
    revalidateAnalysis();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể lưu QC" };
  }
}

export async function overrideQcFailAction(taskId: string, overrideReason: string) {
  const auth = await requirePermission("analysis_qc", "write");
  if ("error" in auth) return { error: auth.error };
  const approve = await requireSessionCanApprove();
  if ("error" in approve) return { error: approve.error };

  try {
    await overrideQcFail(taskId, overrideReason, auth.user.name, auth.user.id);
    revalidateAnalysis();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể override QC" };
  }
}

export async function submitForReviewAction(taskId: string, override = false) {
  const auth = await requirePermission("analysis_results", "write");
  if ("error" in auth) return { error: auth.error };
  if (override) {
    const approve = await requireSessionCanApprove();
    if ("error" in approve) return { error: approve.error };
  }

  try {
    await submitForReview(taskId, override);
    revalidateAnalysis();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể gửi duyệt" };
  }
}

export async function approveTaskAction(taskId: string) {
  const auth = await requirePermission("analysis_review", "write");
  if ("error" in auth) return { error: auth.error };
  const approve = await requireSessionCanApprove();
  if ("error" in approve) return { error: approve.error };

  try {
    await approveTask(taskId, auth.user.name, auth.user.id);
    revalidateAnalysis();
    revalidatePath("/results-delivery/pending");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể duyệt" };
  }
}

export async function rejectTaskAction(taskId: string, note: string) {
  const auth = await requirePermission("analysis_review", "write");
  if ("error" in auth) return { error: auth.error };

  try {
    await rejectTask(taskId, note);
    revalidateAnalysis();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể trả về" };
  }
}

export async function requestRerunAction(taskId: string, note: string) {
  const auth = await requirePermission("analysis_review", "write");
  if ("error" in auth) return { error: auth.error };

  try {
    await requestRerun(taskId, note);
    revalidateAnalysis();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể yêu cầu chạy lại" };
  }
}
