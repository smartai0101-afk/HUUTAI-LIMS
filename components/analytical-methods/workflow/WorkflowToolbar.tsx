"use client";

import type { WorkflowNodeType } from "@prisma/client";
import { WORKFLOW_NODE_TYPE_OPTIONS } from "@/components/analytical-methods/WorkflowNodeTypes";
import { isMacPlatform } from "./useWorkflowShortcuts";

type Props = {
  editable: boolean;
  newType: WorkflowNodeType;
  onNewTypeChange: (type: WorkflowNodeType) => void;
  onAddNode: () => void;
  onDelete: () => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onShowShortcuts: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  saving: boolean;
  autoSaving?: boolean;
  saveMsg: string;
};

const mod = isMacPlatform() ? "⌘" : "Ctrl";

export function WorkflowToolbar({
  editable,
  newType,
  onNewTypeChange,
  onAddNode,
  onDelete,
  onSave,
  onUndo,
  onRedo,
  onShowShortcuts,
  canUndo,
  canRedo,
  isDirty,
  saving,
  autoSaving,
  saveMsg,
}: Props) {
  if (!editable) {
    return saveMsg ? <span className="text-sm text-slate-600">{saveMsg}</span> : null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        title={`Hoàn tác (${mod}+Z)`}
        className="rounded-lg border border-slate-200 px-3 py-1 text-sm disabled:opacity-40"
      >
        Hoàn tác
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        title={`Làm lại (${mod}+Shift+Z)`}
        className="rounded-lg border border-slate-200 px-3 py-1 text-sm disabled:opacity-40"
      >
        Làm lại
      </button>

      <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />

      <select
        value={newType}
        onChange={(e) => onNewTypeChange(e.target.value as WorkflowNodeType)}
        className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
      >
        {WORKFLOW_NODE_TYPE_OPTIONS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <button type="button" onClick={onAddNode} className="rounded-lg bg-slate-900 px-3 py-1 text-sm text-white">
        Thêm bước
      </button>
      <button type="button" onClick={onDelete} className="rounded-lg border px-3 py-1 text-sm">
        Xóa
      </button>

      <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden />

      <button
        type="button"
        onClick={onSave}
        disabled={saving || autoSaving}
        title={`Lưu (${mod}+S)`}
        className="relative rounded-lg bg-cyan-600 px-3 py-1 text-sm text-white disabled:opacity-50"
      >
        {saving || autoSaving ? "Đang lưu..." : "Lưu workflow"}
        {isDirty && !saving && !autoSaving ? (
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-rose-500" title="Chưa lưu" />
        ) : null}
      </button>

      <button
        type="button"
        onClick={onShowShortcuts}
        className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600"
        title="Phím tắt"
      >
        ? Phím tắt
      </button>

      {saveMsg ? <span className="text-sm text-slate-600">{saveMsg}</span> : null}
      {isDirty && !saving && !autoSaving ? (
        <span className="text-xs text-amber-700">Chưa lưu thay đổi</span>
      ) : null}
    </div>
  );
}
