import type { Edge, Node } from "@xyflow/react";

export const MAX_HISTORY = 100;
export const PASTE_OFFSET = 40;
export const AUTO_SAVE_MS = 15_000;

export const PROTECTED_NODE_IDS = new Set(["start", "end"]);

export type WorkflowViewport = {
  x: number;
  y: number;
  zoom: number;
};

export type WorkflowSnapshot = {
  nodes: Node[];
  edges: Edge[];
  viewport: WorkflowViewport;
};

export type WorkflowClipboardNode = {
  data: Node["data"];
  relativePosition: { x: number; y: number };
};

export type WorkflowClipboard = {
  nodes: WorkflowClipboardNode[];
  edges: Array<{ sourceIndex: number; targetIndex: number; label?: string }>;
};

export type WorkflowEditorActions = {
  undo: () => void;
  redo: () => void;
  save: () => void;
  deleteSelection: () => void;
  copySelection: () => void;
  paste: () => void;
  duplicateSelection: () => void;
  selectAll: () => void;
  clearSelection: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
};
