import { db } from "@/lib/db";
import { exportSampleReceptionReport } from "@/lib/services/samples/sample-storage";

export async function exportReceptionExcelCsv() {
  const rows = await exportSampleReceptionReport();
  const header =
    "Mã mẫu,Tên mẫu,Loại mẫu,Ngày tiếp nhận,Người tiếp nhận,Tình trạng,Trạng thái,Mã PP,Tên PP,Mã yêu cầu,Phòng ban,Hạn trả";
  const lines = rows.map((r) =>
    [
      r.sampleCode,
      r.sampleName,
      r.sampleType,
      r.receivedAt.slice(0, 10),
      r.receivedBy,
      r.conditionOnReceipt,
      r.status,
      r.methodCode,
      r.methodName,
      r.requestCode,
      r.assignedTo,
      r.dueDate ? r.dueDate.slice(0, 10) : "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header, ...lines].join("\n");
}

export async function exportAnalysisSummaryCsv() {
  const tasks = await db.analysisTask.findMany({
    where: { status: { not: "cancelled" } },
    include: { testResults: true },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const header =
    "Mã mẫu,Nhóm chỉ tiêu,Trạng thái task,Analyst,Số kết quả,QC pass";
  const lines = tasks.map((t) => {
    const qcPass = t.testResults.every((r) => r.status === "qc_passed" || r.status === "approved");
    return [
      t.sampleCode,
      t.parameterGroup,
      t.status,
      t.analystName,
      t.testResults.length,
      qcPass ? "Yes" : "No",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });
  return [header, ...lines].join("\n");
}

export async function exportDeliverySummaryCsv() {
  const reports = await db.testReport.findMany({
    include: { sample: { select: { sampleCode: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  const header = "Mã phiếu,Mã mẫu,Trạng thái,Phiên bản,Lần phát hành,Ngày phát hành";
  const lines = reports.map((r) =>
    [
      r.reportCode,
      r.sample?.sampleCode ?? "",
      r.status,
      r.reportVersion,
      r.issueNumber,
      r.issueDate?.toISOString().slice(0, 10) ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header, ...lines].join("\n");
}
