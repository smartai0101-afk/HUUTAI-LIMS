"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type Viewport,
} from "@xyflow/react";
import { workflowNodeTypes } from "@/components/analytical-methods/WorkflowNodeTypes";
import { isMacPlatform } from "./useWorkflowShortcuts";
import type { WorkflowSnapshot, WorkflowViewport } from "./types";

type Props = {
  editable: boolean;
  snapshot: WorkflowSnapshot;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeDragStop: () => void;
  onViewportChange: (viewport: WorkflowViewport) => void;
  restoreViewport: WorkflowViewport;
};

function ViewportInitializer({ viewport }: { viewport: WorkflowViewport }) {
  const { setViewport } = useReactFlow();
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    void setViewport(viewport);
    applied.current = true;
  }, [viewport, setViewport]);

  return null;
}

export function WorkflowCanvas({
  editable,
  snapshot,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeDragStop,
  onViewportChange,
  restoreViewport,
}: Props) {
  const handleMoveEnd = useCallback(
    (_: unknown, viewport: Viewport) => {
      onViewportChange({ x: viewport.x, y: viewport.y, zoom: viewport.zoom });
    },
    [onViewportChange],
  );

  return (
    <ReactFlow
      nodes={snapshot.nodes}
      edges={snapshot.edges}
      onNodesChange={editable ? onNodesChange : undefined}
      onEdgesChange={editable ? onEdgesChange : undefined}
      onConnect={editable ? onConnect : undefined}
      onNodeDragStop={editable ? onNodeDragStop : undefined}
      onMoveEnd={handleMoveEnd}
      nodeTypes={workflowNodeTypes}
      nodesDraggable={editable}
      nodesConnectable={editable}
      elementsSelectable={editable}
      multiSelectionKeyCode="Shift"
      selectionKeyCode={isMacPlatform() ? "Meta" : "Control"}
      selectionOnDrag={editable}
      deleteKeyCode={null}
      panOnDrag={[1, 2]}
      fitView={false}
    >
      <ViewportInitializer viewport={restoreViewport} />
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}

export { addEdge, applyEdgeChanges, applyNodeChanges };
export type { Connection, Edge, Node, NodeChange, EdgeChange };
