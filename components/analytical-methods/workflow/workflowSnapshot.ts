import type { Edge, Node } from "@xyflow/react";
import type { WorkflowNodeType } from "@prisma/client";
import type { MethodWorkflowView } from "@/types/analytical-methods";
import type { WorkflowSavePayload } from "@/lib/services/analytical-methods/method-workflow";
import type { WorkflowSnapshot, WorkflowViewport } from "./types";

export const DEFAULT_VIEWPORT: WorkflowViewport = { x: 0, y: 0, zoom: 1 };

export function parseViewport(layoutJson: string): WorkflowViewport {
  try {
    const parsed = JSON.parse(layoutJson) as Partial<WorkflowViewport>;
    return {
      x: typeof parsed.x === "number" ? parsed.x : 0,
      y: typeof parsed.y === "number" ? parsed.y : 0,
      zoom: typeof parsed.zoom === "number" ? parsed.zoom : 1,
    };
  } catch {
    return DEFAULT_VIEWPORT;
  }
}

export function toFlowNodes(workflow: MethodWorkflowView): Node[] {
  return workflow.nodes.map((n) => ({
    id: n.nodeKey,
    type: "workflowNode",
    position: { x: n.positionX, y: n.positionY },
    data: { label: n.label, description: n.description, nodeType: n.type },
  }));
}

export function toFlowEdges(workflow: MethodWorkflowView): Edge[] {
  return workflow.edges.map((e) => ({
    id: `${e.sourceNodeKey}-${e.targetNodeKey}`,
    source: e.sourceNodeKey,
    target: e.targetNodeKey,
    label: e.label || undefined,
  }));
}

export function workflowToSnapshot(workflow: MethodWorkflowView): WorkflowSnapshot {
  return {
    nodes: toFlowNodes(workflow),
    edges: toFlowEdges(workflow),
    viewport: parseViewport(workflow.layoutJson),
  };
}

export function cloneSnapshot(snapshot: WorkflowSnapshot): WorkflowSnapshot {
  return structuredClone(snapshot);
}

function stripSelection(nodes: Node[], edges: Edge[]) {
  return {
    nodes: nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
    edges: edges.map(({ id, source, target, label }) => ({ id, source, target, label: label ?? "" })),
  };
}

export function serializeForCompare(snapshot: WorkflowSnapshot): string {
  const stripped = stripSelection(snapshot.nodes, snapshot.edges);
  return JSON.stringify({ ...stripped, viewport: snapshot.viewport });
}

export function buildSavePayload(snapshot: WorkflowSnapshot): WorkflowSavePayload {
  return {
    layoutJson: JSON.stringify(snapshot.viewport),
    nodes: snapshot.nodes.map((n) => ({
      nodeKey: n.id,
      type: (n.data.nodeType as WorkflowNodeType) ?? "Step",
      label: String(n.data.label ?? ""),
      description: String(n.data.description ?? ""),
      positionX: n.position.x,
      positionY: n.position.y,
      configJson: "{}",
    })),
    edges: snapshot.edges.map((e) => ({
      sourceNodeKey: e.source,
      targetNodeKey: e.target,
      label: String(e.label ?? ""),
      conditionJson: "{}",
    })),
  };
}

export function mergeSnapshot(
  base: WorkflowSnapshot,
  partial: Partial<Pick<WorkflowSnapshot, "nodes" | "edges" | "viewport">>,
): WorkflowSnapshot {
  return {
    nodes: partial.nodes ?? base.nodes,
    edges: partial.edges ?? base.edges,
    viewport: partial.viewport ?? base.viewport,
  };
}
