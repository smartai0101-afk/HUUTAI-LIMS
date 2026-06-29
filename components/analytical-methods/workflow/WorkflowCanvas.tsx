"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { cn } from "@/lib/utils";
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
  const [shiftHeld, setShiftHeld] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftHeld(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setShiftHeld(false);
    };
    const onBlur = () => setShiftHeld(false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const panOnDrag = !editable ? true : shiftHeld ? [1, 2] : true;
  const selectionOnDrag = editable && shiftHeld;

  const handleMoveEnd = useCallback(
    (_: unknown, viewport: Viewport) => {
      onViewportChange({ x: viewport.x, y: viewport.y, zoom: viewport.zoom });
    },
    [onViewportChange],
  );

  return (
    <ReactFlow
      className={cn(
        editable && shiftHeld && "cursor-crosshair",
        (!editable || !shiftHeld) &&
          "cursor-grab [&_.react-flow__pane:active]:cursor-grabbing",
      )}
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
      selectionOnDrag={selectionOnDrag}
      deleteKeyCode={null}
      panOnDrag={panOnDrag}
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
