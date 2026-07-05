"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, QrCode } from "lucide-react";
import {
  transitionSampleStatusAction,
  transferCustodyAction,
  updateSampleCodeAction,
} from "@/lib/actions/samples";
import { SampleAuditTrail } from "@/components/samples/SampleAuditTrail";
import { SamplePrintLabelDialog } from "@/components/samples/SamplePrintLabelDialog";
import { WorkflowTimeline } from "@/components/samples/WorkflowTimeline";
import { SampleStatusBadge } from "@/components/samples/SampleStatusBadge";
import { useSession } from "@/components/SessionProvider";
import {
  ANALYSIS_ASSIGNMENT_STATUS_LABELS,
  SAMPLE_CONDITION_LABELS,
  SAMPLE_STATUS_LABELS,
} from "@/lib/sample-labels";
import { SAMPLE_TRANSITIONS } from "@/lib/services/samples/sample-workflow";
import type { SampleAuditEntry, SampleCustodyEntry, SampleDetailView } from "@/types/samples";

type Props = {
  sample: SampleDetailView;
  auditLogs: SampleAuditEntry[];
  custodyEvents: SampleCustodyEntry[];
  isoTimeline: Array<{
    id: string;
    source: "workflow" | "audit" | "report" | "custody";
    action: string;
    performedBy: string;
    performedAt: Date | string;
    reason: string;
    fromStatus?: string;
    toStatus?: string;
  }>;
};

export function SampleDetailClient({ sample, auditLogs, custodyEvents, isoTimeline }: Props) {
  const { canApprove } = useSession();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [printOpen, setPrintOpen] = useState(false);

  const nextStatuses = SAMPLE_TRANSITIONS[sample.status] ?? [];

  function handleTransition(toStatus: typeof sample.status) {
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await transitionSampleStatusAction(sample.id, toStatus);
      if (result.error) setError(result.error);
      else setMessage(`Đã chuyển sang "${SAMPLE_STATUS_LABELS[toStatus]}"`);
    });
  }

  function handleCodeChange() {
    const newCode = window.prompt("Nhập mã mẫu mới (chỉ Admin/QA):", sample.sampleCode);
    if (!newCode || newCode === sample.sampleCode) return;
    startTransition(async () => {
      const result = await updateSampleCodeAction(sample.id, newCode);
      if (result.error) setError(result.error);
      else setMessage("Đã cập nhật mã mẫu");
    });
  }

  function handleCustodyTransfer() {
    const toPerson = window.prompt("Người nhận bàn giao:");
    if (!toPerson) return;
    const location = window.prompt("Vị trí:", sample.storageLocation) ?? "";
    startTransition(async () => {
      const result = await transferCustodyAction(
        sample.id,
        sample.receivedBy,
        toPerson,
        location,
        "Chain of custody",
      );
      if (result.error) setError(result.error);
      else setMessage("Đã ghi nhận chuyển giao mẫu");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{sample.sampleCode}</h1>
            <SampleStatusBadge status={sample.status} />
            {sample.isOverdue ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                Quá hạn
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-500">{sample.sampleName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPrintOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <QrCode className="h-4 w-4" />
            In tem / QR
          </button>
          {canApprove ? (
            <button
              type="button"
              onClick={handleCodeChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              Sửa mã mẫu
            </button>
          ) : null}
          <Link
            href={`/samples/${sample.id}/edit`}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            Sửa mẫu
          </Link>
          <Link
            href={`/samples/assign?sampleId=${sample.id}`}
            className="rounded-xl bg-cyan-600 px-3 py-2 text-sm font-medium text-white"
          >
            Phân công
          </Link>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Thông tin mẫu</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Loại mẫu</dt><dd>{sample.sampleType}</dd></div>
            <div><dt className="text-slate-500">Mã KH</dt><dd>{sample.customerSampleCode || "—"}</dd></div>
            <div><dt className="text-slate-500">Tiếp nhận</dt><dd>{new Date(sample.receivedAt).toLocaleString("vi-VN")}</dd></div>
            <div><dt className="text-slate-500">Người nhận</dt><dd>{sample.receivedBy}</dd></div>
            <div><dt className="text-slate-500">Người giao</dt><dd>{sample.deliveredBy || "—"}</dd></div>
            <div><dt className="text-slate-500">Số lượng</dt><dd>{sample.quantity} {sample.unit}</dd></div>
            <div><dt className="text-slate-500">Điều kiện nhận</dt><dd>{SAMPLE_CONDITION_LABELS[sample.conditionOnReceipt]}</dd></div>
            <div><dt className="text-slate-500">Quản lý phòng phụ trách</dt><dd>{sample.assignedTo || "—"}</dd></div>
            <div><dt className="text-slate-500">Deadline</dt><dd>{sample.dueDate ? new Date(sample.dueDate).toLocaleDateString("vi-VN") : "—"}</dd></div>
            <div><dt className="text-slate-500">Phiếu YC</dt><dd>{sample.requestCode || "—"}</dd></div>
          </dl>
          {sample.conditionNote ? (
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{sample.conditionNote}</p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Phương pháp & hóa học</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Phương pháp chính</dt>
              <dd>
                {sample.needsMethodAssignment ? (
                  <span className="text-amber-600">Cần chỉ định phương pháp</span>
                ) : (
                  `${sample.primaryMethodCode ?? ""} — ${sample.primaryMethodName ?? ""}${
                    sample.primaryMethodVersion ? ` (v${sample.primaryMethodVersion})` : ""
                  }`
                )}
              </dd>
            </div>
            {sample.chemicalReferenceName ? (
              <div>
                <dt className="text-slate-500">Thông tin hóa học</dt>
                <dd>
                  <Link href={`/chem-info/chemicals/${sample.chemicalReferenceId}`} className="text-cyan-700 hover:underline">
                    {sample.chemicalReferenceName} ({sample.chemicalReferenceCas})
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Phân công phòng ban</h2>
        <div className="space-y-3">
          {sample.analysisAssignments.map((assignment) => (
            <div key={assignment.id} className="rounded-xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-900">{assignment.parameterGroup}</p>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800">
                  {ANALYSIS_ASSIGNMENT_STATUS_LABELS[assignment.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {assignment.parameters.join(" · ")}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {assignment.departmentName} · {assignment.managerName}
                {assignment.managerTitle ? ` (${assignment.managerTitle})` : ""}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Deadline: {new Date(assignment.dueDate).toLocaleDateString("vi-VN")}
                {assignment.note ? ` · ${assignment.note}` : ""}
              </p>
            </div>
          ))}
          {sample.analysisAssignments.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa phân công phòng ban.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Phép thử phân tích</h2>
        <div className="space-y-3">
          {sample.tests.map((test) => (
            <div key={test.id} className="rounded-xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-900">{test.parameterName}</p>
                <span className="text-xs text-slate-500">{test.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {test.methodCode ? `${test.methodCode} — ${test.methodName}` : "Chưa có phương pháp"}
                {test.equipmentCode ? ` · TB: ${test.equipmentCode}` : ""}
                {test.assignedTo ? ` · ${test.assignedTo}` : ""}
              </p>
              {test.warnings.map((w) => (
                <p key={w} className="mt-2 text-sm text-amber-700">{w}</p>
              ))}
            </div>
          ))}
          {sample.tests.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có phép thử nào.</p>
          ) : null}
        </div>
      </section>

      {nextStatuses.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Chuyển trạng thái</h2>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((status) => (
              <button
                key={status}
                type="button"
                disabled={pending}
                onClick={() => handleTransition(status)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
              >
                → {SAMPLE_STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Chain of custody</h2>
          <button
            type="button"
            onClick={handleCustodyTransfer}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            Ghi nhận chuyển giao
          </button>
        </div>
        <div className="space-y-2">
          {custodyEvents.map((e) => (
            <div key={e.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="font-medium">{e.action}</p>
              <p className="text-slate-600">
                {e.fromPerson} → {e.toPerson} · {e.location}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(e.performedAt).toLocaleString("vi-VN")} · {e.performedBy}
              </p>
            </div>
          ))}
          {custodyEvents.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có sự kiện chuyển giao.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Nhật ký ISO (thống nhất)</h2>
        <WorkflowTimeline entries={isoTimeline} />
      </section>

      <SampleAuditTrail logs={auditLogs} />

      <SamplePrintLabelDialog
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        sampleCode={sample.sampleCode}
        sampleName={sample.sampleName}
        sampleId={sample.id}
      />
    </div>
  );
}
