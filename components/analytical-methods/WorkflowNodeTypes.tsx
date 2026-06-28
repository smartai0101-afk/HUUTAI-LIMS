"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { WORKFLOW_NODE_TYPE_LABELS } from "@/lib/analytical-methods-labels";

const baseClass =
  "min-w-[140px] rounded-xl border-2 px-3 py-2 text-xs shadow-sm bg-white";

const typeColors: Record<string, string> = {
  Start: "border-emerald-400",
  Step: "border-slate-300",
  Condition: "border-amber-400",
  Qc: "border-violet-400",
  Equipment: "border-blue-400",
  Reagent: "border-orange-400",
  End: "border-rose-400",
};

function WorkflowNodeComponent({ data, selected }: NodeProps) {
  const type = String(data.nodeType ?? "Step");
  const label = String(data.label ?? "");
  const description = String(data.description ?? "");

  return (
    <div className={`${baseClass} ${typeColors[type] ?? "border-slate-300"} ${selected ? "ring-2 ring-cyan-400" : ""}`}>
      {type !== "Start" ? <Handle type="target" position={Position.Left} className="!bg-cyan-500" /> : null}
      <p className="font-semibold text-slate-800">{label}</p>
      <p className="text-[10px] uppercase text-slate-400">{WORKFLOW_NODE_TYPE_LABELS[type] ?? type}</p>
      {description ? <p className="mt-1 line-clamp-2 text-slate-500">{description}</p> : null}
      {type !== "End" ? <Handle type="source" position={Position.Right} className="!bg-cyan-500" /> : null}
    </div>
  );
}

export const workflowNodeTypes = {
  workflowNode: memo(WorkflowNodeComponent),
};

export const WORKFLOW_NODE_TYPE_OPTIONS = [
  "Step",
  "Condition",
  "Qc",
  "Equipment",
  "Reagent",
] as const;
