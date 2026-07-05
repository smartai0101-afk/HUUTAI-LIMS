import { exportAnalysisSummaryCsv, exportDeliverySummaryCsv, exportReceptionExcelCsv } from "@/lib/services/lims-export";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "reception";

  let csv = "";
  let filename = "export.csv";

  if (type === "analysis") {
    if (!hasPermission(user.role, user.extraPermissions ?? [], "analysis_results", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    csv = await exportAnalysisSummaryCsv();
    filename = "analysis-summary.csv";
  } else if (type === "delivery") {
    if (!hasPermission(user.role, user.extraPermissions ?? [], "delivery_reports", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    csv = await exportDeliverySummaryCsv();
    filename = "delivery-summary.csv";
  } else {
    if (!hasPermission(user.role, user.extraPermissions ?? [], "samples_list", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    csv = await exportReceptionExcelCsv();
    filename = "reception-report.csv";
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
