"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guards";
import {
  batchReceiveSampleLines,
  receiveSampleLine,
} from "@/lib/services/samples/sample-receive";
import {
  bulkApplyTestsToLines,
  copyTestsFromLine,
  duplicateRequestSampleLine,
  getSampleTestMatrixView,
  listRequestSampleLines,
  toggleMatrixCell,
  upsertRequestSampleLines,
  validateRequestForSubmit,
} from "@/lib/services/samples/request-sample-lines";
import {
  bulkAssignSampleTests,
  listSampleTestsForAssignment,
} from "@/lib/services/samples/sample-test-assignment";
import {
  addSampleTestsToWorksheet,
  createWorklistFromSampleTests,
} from "@/lib/services/analysis/sample-test-worklist";
import type { RequestSampleLineInput } from "@/lib/services/samples/request-sample-lines";

export async function fetchRequestSampleLinesAction(requestId: string) {
  await requirePermission("samples_requests", "read");
  return listRequestSampleLines(requestId);
}

export async function fetchSampleTestMatrixAction(requestId: string) {
  await requirePermission("samples_request_matrix", "read");
  return getSampleTestMatrixView(requestId);
}

export async function upsertRequestSampleLinesAction(requestId: string, lines: RequestSampleLineInput[]) {
  const auth = await requirePermission("samples_requests", "write");
  if ("error" in auth) return { error: auth.error };
  try {
    await upsertRequestSampleLines(requestId, lines);
    revalidatePath(`/samples/requests/${requestId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi lưu danh sách mẫu" };
  }
}

export async function bulkApplyTestsAction(
  requestId: string,
  testMethodIds: string[],
  filter?: { matrixId?: string; lineIds?: string[] },
) {
  const auth = await requirePermission("samples_requests", "write");
  if ("error" in auth) return { error: auth.error };
  await bulkApplyTestsToLines(requestId, testMethodIds, filter);
  revalidatePath(`/samples/requests/${requestId}`);
  return { success: true };
}

export async function copyTestsFromSampleAction(sourceLineId: string, targetLineIds: string[]) {
  const auth = await requirePermission("samples_requests", "write");
  if ("error" in auth) return { error: auth.error };
  await copyTestsFromLine(sourceLineId, targetLineIds);
  return { success: true };
}

export async function duplicateSampleLineAction(lineId: string) {
  const auth = await requirePermission("samples_requests", "write");
  if ("error" in auth) return { error: auth.error };
  const line = await duplicateRequestSampleLine(lineId);
  revalidatePath(`/samples/requests/${line.requestId}`);
  return { success: true, lineId: line.id };
}

export async function toggleMatrixCellAction(lineId: string, testMethodId: string, selected: boolean) {
  const auth = await requirePermission("samples_request_matrix", "write");
  if ("error" in auth) return { error: auth.error };
  try {
    await toggleMatrixCell(lineId, testMethodId, selected);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi" };
  }
}

export async function receiveSampleLineAction(
  lineId: string,
  fd: FormData,
) {
  const auth = await requirePermission("samples_receive", "write");
  if ("error" in auth) return { error: auth.error };
  try {
    const sample = await receiveSampleLine(
      lineId,
      {
        receivedBy: String(fd.get("receivedBy") ?? auth.user.name),
        receivedAt: String(fd.get("receivedAt") ?? new Date().toISOString()),
        conditionOnReceipt: String(fd.get("conditionOnReceipt") ?? "Pass") as "Pass",
        conditionNote: String(fd.get("conditionNote") ?? ""),
        deliveredBy: String(fd.get("deliveredBy") ?? ""),
        storageLocation: String(fd.get("storageLocation") ?? ""),
      },
      auth.user.name,
    );
    revalidatePath("/samples");
    revalidatePath("/samples/receive");
    return { success: true, sampleId: sample.id, sampleCode: sample.sampleCode };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể tiếp nhận mẫu" };
  }
}

export async function batchReceiveSampleLinesAction(lineIds: string[], fd: FormData) {
  const auth = await requirePermission("samples_receive", "write");
  if ("error" in auth) return { error: auth.error };
  const results = await batchReceiveSampleLines(
    lineIds,
    {
      receivedBy: String(fd.get("receivedBy") ?? auth.user.name),
      receivedAt: String(fd.get("receivedAt") ?? new Date().toISOString()),
      conditionOnReceipt: String(fd.get("conditionOnReceipt") ?? "Pass") as "Pass",
      conditionNote: String(fd.get("conditionNote") ?? ""),
    },
    auth.user.name,
  );
  revalidatePath("/samples");
  return { success: true, results };
}

export async function fetchSampleTestsAssignmentAction(filters?: {
  sampleId?: string;
  testMethodId?: string;
}) {
  await requirePermission("samples_assign", "read");
  return listSampleTestsForAssignment(filters);
}

export async function assignSampleTestAction(sampleTestId: string, fd: FormData) {
  const auth = await requirePermission("samples_assign", "write");
  if ("error" in auth) return { error: auth.error };
  try {
    await bulkAssignSampleTests([sampleTestId], {
      departmentId: String(fd.get("departmentId") ?? ""),
      managerId: String(fd.get("managerId") ?? ""),
      analystId: String(fd.get("analystId") ?? "").trim() || undefined,
      dueDate: String(fd.get("dueDate") ?? ""),
      assignedBy: auth.user.name,
    });
    revalidatePath("/samples/assign");
    revalidatePath("/analysis/inbox");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Phân công thất bại" };
  }
}

export async function validateRequestSubmitAction(requestId: string) {
  await requirePermission("samples_requests", "read");
  const err = await validateRequestForSubmit(requestId);
  return { valid: !err, error: err };
}

export async function createWorklistFromSampleTestsAction(fd: FormData) {
  const auth = await requirePermission("analysis_worklist", "write");
  if ("error" in auth) return { error: auth.error };
  try {
    const sampleTestIds = JSON.parse(String(fd.get("sampleTestIds") ?? "[]")) as string[];
    const worklist = await createWorklistFromSampleTests(
      {
        departmentId: String(fd.get("departmentId") ?? ""),
        methodId: String(fd.get("methodId") ?? ""),
        methodVersionId: String(fd.get("methodVersionId") ?? "") || undefined,
        equipmentId: String(fd.get("equipmentId") ?? ""),
        analystId: String(fd.get("analystId") ?? ""),
        sampleTestIds,
        matrixId: String(fd.get("matrixId") ?? "") || undefined,
        deadline: String(fd.get("deadline") ?? "") || undefined,
      },
      auth.user.name,
    );
    revalidatePath("/analysis/worklists");
    return { success: true, worklistId: worklist.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể tạo worklist" };
  }
}

export async function addSampleTestsToWorksheetAction(worksheetId: string, sampleTestIds: string[]) {
  const auth = await requirePermission("analysis_worksheet", "write");
  if ("error" in auth) return { error: auth.error };
  try {
    await addSampleTestsToWorksheet(worksheetId, sampleTestIds, auth.user.name);
    revalidatePath(`/analysis/worksheets/${worksheetId}`);
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể thêm chỉ tiêu vào worksheet" };
  }
}
