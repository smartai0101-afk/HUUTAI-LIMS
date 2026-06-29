"use server";

import { revalidatePath } from "next/cache";
import {
  requirePermission,
  requireSessionCanApprove,
  requireSessionCanManage,
} from "@/lib/auth/guards";
import {
  approveReport,
  createReport,
  issueReport,
  qaApproveReport,
  reissueReport,
} from "@/lib/services/results-delivery/test-report";
import {
  approveReportSchema,
  createReportSchema,
  issueReportSchema,
  qaApproveReportSchema,
  reissueReportSchema,
} from "@/lib/validators/result-delivery";

const DELIVERY_PATHS = [
  "/results-delivery/pending",
  "/results-delivery/reports",
  "/results-delivery/history",
  "/results-delivery/issued",
];

function revalidateDelivery() {
  DELIVERY_PATHS.forEach((p) => revalidatePath(p));
  revalidatePath("/results-delivery", "layout");
  revalidatePath("/samples/storage");
  revalidatePath("/samples");
  revalidatePath("/samples/tracking");
}

export async function createReportAction(sampleId: string) {
  const auth = await requirePermission("delivery_reports", "write");
  if ("error" in auth) return { error: auth.error };
  const manage = await requireSessionCanManage();
  if ("error" in manage) return { error: manage.error };

  const parsed = createReportSchema.safeParse({ sampleId });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  try {
    const report = await createReport(parsed.data.sampleId, auth.user.name);
    revalidateDelivery();
    return { success: true, reportId: report.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể tạo phiếu kết quả" };
  }
}

export async function approveReportAction(reportId: string, labManagerName?: string) {
  const auth = await requirePermission("delivery_reports", "write");
  if ("error" in auth) return { error: auth.error };
  const manage = await requireSessionCanManage();
  if ("error" in manage) return { error: manage.error };

  const parsed = approveReportSchema.safeParse({ reportId, labManagerName });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  try {
    await approveReport(parsed.data.reportId, auth.user.name, parsed.data.labManagerName);
    revalidateDelivery();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể duyệt phiếu" };
  }
}

export async function qaApproveReportAction(reportId: string, qaName?: string) {
  const auth = await requirePermission("delivery_reports", "write");
  if ("error" in auth) return { error: auth.error };
  const approve = await requireSessionCanApprove();
  if ("error" in approve) return { error: approve.error };

  const parsed = qaApproveReportSchema.safeParse({ reportId, qaName });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  try {
    await qaApproveReport(parsed.data.reportId, auth.user.name, parsed.data.qaName);
    revalidateDelivery();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể phê duyệt QA" };
  }
}

export async function issueReportAction(reportId: string, note?: string) {
  const auth = await requirePermission("delivery_pending", "write");
  if ("error" in auth) return { error: auth.error };
  const manage = await requireSessionCanManage();
  if ("error" in manage) return { error: manage.error };

  const parsed = issueReportSchema.safeParse({ reportId, note });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  try {
    await issueReport(parsed.data.reportId, auth.user.name, parsed.data.note);
    revalidateDelivery();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể phát hành" };
  }
}

export async function reissueReportAction(reportId: string, reason: string) {
  const auth = await requirePermission("delivery_reports", "write");
  if ("error" in auth) return { error: auth.error };
  const manage = await requireSessionCanManage();
  if ("error" in manage) return { error: manage.error };

  const parsed = reissueReportSchema.safeParse({ reportId, reason });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };

  try {
    await reissueReport(parsed.data.reportId, auth.user.name, parsed.data.reason);
    revalidateDelivery();
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể phát hành lại" };
  }
}
