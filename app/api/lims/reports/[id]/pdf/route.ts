import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getReport } from "@/lib/services/results-delivery/test-report";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, user.extraPermissions ?? [], "delivery_reports", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const report = await getReport(id);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    reportId: report.id,
    reportCode: report.reportCode,
    pdfUrl: report.pdfUrl || `/results-delivery/reports/${report.id}/print`,
    printUrl: `/results-delivery/reports/${report.id}/print`,
    status: report.status,
  });
}
