"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  forkMethodVersionAction,
  transitionMethodStatusAction,
} from "@/lib/actions/analytical-methods";
import { createMethodExecutionAction } from "@/lib/actions/method-execution";
import { METHOD_VERSION_STATUS_LABELS } from "@/lib/analytical-methods-labels";
import type { MethodApprovalView, MethodVersionView } from "@/types/analytical-methods";
import type { MethodVersionStatus } from "@prisma/client";

type Props = {
  methodId: string;
  currentVersion: MethodVersionView | null;
  approvals: MethodApprovalView[];
};

export function MethodApprovalPanel({ methodId, currentVersion, approvals }: Props) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [changeLog, setChangeLog] = useState("");
  const [sampleCount, setSampleCount] = useState(1);
  const [msg, setMsg] = useState("");

  async function transition(to: MethodVersionStatus) {
    const result = await transitionMethodStatusAction(methodId, to, comment);
    if (result.error) setMsg(result.error);
    else {
      setMsg(`Đã chuyển sang ${METHOD_VERSION_STATUS_LABELS[to]}`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-4">
        <h2 className="font-semibold">Phiên bản hiện tại</h2>
        {currentVersion ? (
          <p className="mt-2 text-sm text-slate-600">
            v{currentVersion.version} · {METHOD_VERSION_STATUS_LABELS[currentVersion.status]}
            {currentVersion.approvedAt ? ` · Duyệt: ${currentVersion.approvedAt}` : ""}
          </p>
        ) : (
          <p className="text-sm text-slate-500">Không có phiên bản</p>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-4 space-y-3">
        <h2 className="font-semibold">Phê duyệt</h2>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ghi chú phê duyệt"
          className="w-full rounded-lg border px-2 py-1 text-sm"
          rows={2}
        />
        <div className="flex flex-wrap gap-2">
          {currentVersion?.status === "Draft" ? (
            <button type="button" onClick={() => transition("Review")} className="rounded-lg bg-amber-600 px-3 py-1 text-sm text-white">
              Gửi duyệt
            </button>
          ) : null}
          {currentVersion?.status === "Review" ? (
            <>
              <button type="button" onClick={() => transition("Approved")} className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white">
                Phê duyệt
              </button>
              <button type="button" onClick={() => transition("Draft")} className="rounded-lg border px-3 py-1 text-sm">
                Trả về nháp
              </button>
            </>
          ) : null}
          {currentVersion?.status === "Approved" ? (
            <button type="button" onClick={() => transition("Obsolete")} className="rounded-lg border px-3 py-1 text-sm">
              Ngừng sử dụng
            </button>
          ) : null}
        </div>
        {msg ? <p className="text-sm text-slate-600">{msg}</p> : null}
      </div>

      {currentVersion?.status === "Approved" ? (
        <div className="rounded-2xl border bg-white p-4 space-y-3">
          <h2 className="font-semibold">Tạo phiên bản mới</h2>
          <input
            value={changeLog}
            onChange={(e) => setChangeLog(e.target.value)}
            placeholder="Mô tả thay đổi"
            className="w-full rounded-lg border px-2 py-1 text-sm"
          />
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-3 py-1 text-sm text-white"
            onClick={async () => {
              const r = await forkMethodVersionAction(methodId, changeLog);
              if (r.error) setMsg(r.error);
              else router.refresh();
            }}
          >
            Fork phiên bản mới
          </button>
        </div>
      ) : null}

      {currentVersion?.status === "Approved" ? (
        <div className="rounded-2xl border bg-white p-4 space-y-3">
          <h2 className="font-semibold">Bắt đầu thực hiện</h2>
          <input
            type="number"
            min={1}
            value={sampleCount}
            onChange={(e) => setSampleCount(Number(e.target.value) || 1)}
            className="w-24 rounded-lg border px-2 py-1"
          />
          <button
            type="button"
            className="rounded-lg bg-cyan-600 px-3 py-1 text-sm text-white"
            onClick={async () => {
              const r = await createMethodExecutionAction(methodId, sampleCount);
              if (r.error) setMsg(r.error);
              else if (r.executionId) router.push(`/method-executions/${r.executionId}`);
            }}
          >
            Tạo execution
          </button>
        </div>
      ) : (
        <p className="text-sm text-amber-700">Chỉ phương pháp đã phê duyệt mới được dùng trong workflow chính thức.</p>
      )}

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="mb-3 font-semibold">Lịch sử phê duyệt</h2>
        <ul className="space-y-2 text-sm">
          {approvals.map((a) => (
            <li key={a.id}>
              {a.performedAt} — {a.action} ({a.performedBy}){a.comment ? `: ${a.comment}` : ""}
            </li>
          ))}
          {approvals.length === 0 ? <li className="text-slate-500">Chưa có lịch sử</li> : null}
        </ul>
      </div>
    </div>
  );
}
