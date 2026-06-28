"use client";

import type { Node } from "@xyflow/react";
import type { WorkflowNodeType } from "@prisma/client";

type Props = {
  nodes: Node[];
  editable: boolean;
  onUpdateNode: (nodeId: string, field: "label" | "description" | "nodeType", value: string) => void;
  onCommitPropertyEdit: () => void;
};

export function WorkflowPropertiesPanel({
  nodes,
  editable,
  onUpdateNode,
  onCommitPropertyEdit,
}: Props) {
  const selected = nodes.filter((n) => n.selected);
  const selectedNode = selected.length === 1 ? selected[0]! : null;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="font-semibold text-slate-900">Thuộc tính bước</h3>
      {selected.length > 1 ? (
        <p className="text-sm text-slate-600">Đã chọn {selected.length} bước. Có thể di chuyển, xóa, copy hoặc duplicate.</p>
      ) : null}
      {selectedNode ? (
        <>
          <label className="block text-sm">
            Tên
            <input
              className="mt-1 w-full rounded-lg border px-2 py-1"
              value={String(selectedNode.data.label ?? "")}
              disabled={!editable}
              onChange={(e) => onUpdateNode(selectedNode.id, "label", e.target.value)}
              onBlur={onCommitPropertyEdit}
            />
          </label>
          <label className="block text-sm">
            Mô tả
            <textarea
              className="mt-1 w-full rounded-lg border px-2 py-1"
              rows={4}
              value={String(selectedNode.data.description ?? "")}
              disabled={!editable}
              onChange={(e) => onUpdateNode(selectedNode.id, "description", e.target.value)}
              onBlur={onCommitPropertyEdit}
            />
          </label>
          <label className="block text-sm">
            Loại node
            <select
              className="mt-1 w-full rounded-lg border px-2 py-1"
              value={String(selectedNode.data.nodeType ?? "Step")}
              disabled={!editable || selectedNode.id === "start" || selectedNode.id === "end"}
              onChange={(e) => {
                onUpdateNode(selectedNode.id, "nodeType", e.target.value);
                onCommitPropertyEdit();
              }}
            >
              {(["Start", "Step", "Condition", "Qc", "Equipment", "Reagent", "End"] as const).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : selected.length === 0 ? (
        <p className="text-sm text-slate-500">Chọn một bước trên flowchart</p>
      ) : null}
    </div>
  );
}
