import type { Edge, Node } from "@xyflow/react";
import { PASTE_OFFSET, PROTECTED_NODE_IDS, type WorkflowClipboard } from "./types";

function newNodeId(): string {
  return `node-${crypto.randomUUID().slice(0, 8)}`;
}

export function copySelection(nodes: Node[], edges: Edge[]): WorkflowClipboard | null {
  const selected = nodes.filter((n) => n.selected && !PROTECTED_NODE_IDS.has(n.id));
  if (selected.length === 0) return null;

  const ids = new Set(selected.map((n) => n.id));
  const minX = Math.min(...selected.map((n) => n.position.x));
  const minY = Math.min(...selected.map((n) => n.position.y));

  const indexById = new Map(selected.map((n, i) => [n.id, i]));
  const internalEdges = edges.filter((e) => ids.has(e.source) && ids.has(e.target));

  return {
    nodes: selected.map((n) => ({
      data: structuredClone(n.data),
      relativePosition: { x: n.position.x - minX, y: n.position.y - minY },
    })),
    edges: internalEdges.map((e) => ({
      sourceIndex: indexById.get(e.source)!,
      targetIndex: indexById.get(e.target)!,
      label: e.label ? String(e.label) : undefined,
    })),
  };
}

export function pasteFromClipboard(
  clipboard: WorkflowClipboard,
  existingNodes: Node[],
  existingEdges: Edge[],
  offset = PASTE_OFFSET,
): { nodes: Node[]; edges: Edge[]; newNodeIds: string[] } {
  const baseX =
    Math.max(...existingNodes.map((n) => n.position.x), 0) + offset;
  const baseY =
    Math.max(...existingNodes.map((n) => n.position.y), 0) + offset;

  const newNodeIds: string[] = [];
  const newNodes: Node[] = clipboard.nodes.map((item) => {
    const id = newNodeId();
    newNodeIds.push(id);
    return {
      id,
      type: "workflowNode",
      position: {
        x: baseX + item.relativePosition.x,
        y: baseY + item.relativePosition.y,
      },
      data: structuredClone(item.data),
      selected: true,
    };
  });

  const newEdges: Edge[] = clipboard.edges.map((e) => {
    const source = newNodeIds[e.sourceIndex]!;
    const target = newNodeIds[e.targetIndex]!;
    return {
      id: `${source}-${target}`,
      source,
      target,
      label: e.label,
    };
  });

  const clearedNodes = existingNodes.map((n) => ({ ...n, selected: false }));
  const clearedEdges = existingEdges.map((e) => ({ ...e, selected: false }));

  return {
    nodes: [...clearedNodes, ...newNodes],
    edges: [...clearedEdges, ...newEdges],
    newNodeIds,
  };
}

export function duplicateSelection(
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[] } | null {
  const clipboard = copySelection(nodes, edges);
  if (!clipboard) return null;
  return pasteFromClipboard(clipboard, nodes, edges, 24);
}
