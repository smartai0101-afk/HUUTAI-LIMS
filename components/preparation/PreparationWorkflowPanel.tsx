"use client";

import { useMemo, useState, useTransition } from "react";
import type { PreparationWorkflowStatus } from "@prisma/client";
import { ModalShell } from "@/components/ModalShell";
import { transitionPreparationWorkflow } from "@/lib/actions/preparation-workflow";
import {
  transitionActionLabel,
  staffRoleForTransition,
  PREPARATION_WORKFLOW_STATUS_LABELS,
} from "@/lib/preparation-workflow-labels";
import { WORKFLOW_TRANSITIONS } from "@/lib/services/preparation-workflow";
import type { PreparationRecordType } from "@/lib/services/preparation-workflow";
import type { StaffView } from "@/lib/services/staff";
import { WorkflowStatusBadge } from "@/components/preparation/WorkflowStatusBadge";

type Props = {
  preparationType: PreparationRecordType;
  recordId: string;
  workflowStatus: string;
  version: number;
  staff: StaffView[];
  canEdit: boolean;
  role: string;
  onChanged: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
};

export function PreparationWorkflowPanel({
  preparationType,
  recordId,
  workflowStatus,
  version,
  staff,
  canEdit,
  role,
  onChanged,
  onError,
  onSuccess,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [staffId, setStaffId] = useState("");

  const status = workflowStatus as PreparationWorkflowStatus;
  const nextStates = WORKFLOW_TRANSITIONS[status] ?? [];
  const staffRequiredFor = useMemo(
    () => nextStates.filter((to) => staffRoleForTransition(to) !== null && to !== "Cancelled"),
    [nextStates],
  );

  const runTransition = (to: PreparationWorkflowStatus, reason = "") => {
    const roleField = staffRoleForTransition(to);
    if (roleField && !staffId) {
      onError("Chọn nhân sự phụ trách bước này");
      return;
    }
    const fd = new FormData();
    fd.set("user", role);
    fd.set("preparationType", preparationType);
    fd.set("id", recordId);
    fd.set("toStatus", to);
    if (staffId) fd.set("staffId", staffId);
    if (reason) fd.set("reason", reason);

    startTransition(async () => {
      const result = await transitionPreparationWorkflow(fd);
      if (result.error) {
        onError(result.error);
        return;
      }
      onSuccess(`Đã chuyển sang ${PREPARATION_WORKFLOW_STATUS_LABELS[to]}`);
      setCancelOpen(false);
      setRejectOpen(false);
      setCancelReason("");
      setRejectReason("");
      setStaffId("");
      onChanged();
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="text-xs text-slate-500">Quy trình ISO</p>
          <WorkflowStatusBadge status={workflowStatus} />
        </div>
        <div>
          <p className="text-xs text-slate-500">Phiên bản</p>
          <p className="text-sm font-medium">v{version}</p>
        </div>
      </div>

      {canEdit && nextStates.length > 0 ? (
        <div className="space-y-2">
          {staffRequiredFor.length > 0 ? (
            <div>
              <label className="mb-1 block text-xs text-slate-600">Nhân sự phụ trách</label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="h-10 w-full max-w-sm rounded-xl border border-slate-200 px-3 text-sm"
              >
                <option value="">Chọn nhân viên</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {nextStates.map((to) =>
              to === "Cancelled" ? (
                <button
                  key={to}
                  type="button"
                  disabled={pending}
                  onClick={() => setCancelOpen(true)}
                  className="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                >
                  {transitionActionLabel(status, to)}
                </button>
              ) : to === "Rejected" ? (
                <button
                  key={to}
                  type="button"
                  disabled={pending}
                  onClick={() => setRejectOpen(true)}
                  className="rounded-xl border border-orange-200 px-3 py-2 text-sm text-orange-800 hover:bg-orange-50 disabled:opacity-60"
                >
                  {transitionActionLabel(status, to)}
                </button>
              ) : (
                <button
                  key={to}
                  type="button"
                  disabled={pending}
                  onClick={() => runTransition(to)}
                  className="rounded-xl bg-cyan-700 px-3 py-2 text-sm text-white hover:bg-cyan-800 disabled:opacity-60"
                >
                  {transitionActionLabel(status, to)}
                </button>
              ),
            )}
          </div>
        </div>
      ) : null}

      <ModalShell
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        className="max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold">Hủy phiếu pha chế</h3>
        <p className="mt-2 text-sm text-slate-600">Bắt buộc nhập lý do hủy.</p>
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          rows={3}
          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Lý do hủy..."
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setCancelOpen(false)} className="rounded-xl border px-4 py-2 text-sm">
            Đóng
          </button>
          <button
            type="button"
            disabled={pending || !cancelReason.trim()}
            onClick={() => runTransition("Cancelled", cancelReason)}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {pending ? "Đang xử lý..." : "Xác nhận hủy"}
          </button>
        </div>
      </ModalShell>

      <ModalShell
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        className="max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold">Từ chối lô pha (pha sai)</h3>
        <p className="mt-2 text-sm text-slate-600">
          Nguyên liệu đã trừ tồn sẽ không được hoàn lại. Bắt buộc nhập lý do.
        </p>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Lý do từ chối..."
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setRejectOpen(false)} className="rounded-xl border px-4 py-2 text-sm">
            Đóng
          </button>
          <button
            type="button"
            disabled={pending || !rejectReason.trim()}
            onClick={() => runTransition("Rejected", rejectReason)}
            className="rounded-xl bg-orange-600 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {pending ? "Đang xử lý..." : "Xác nhận từ chối"}
          </button>
        </div>
      </ModalShell>
    </div>
  );
}
