import type { Edge, Node } from "@xyflow/react";
import { copySelection, duplicateSelection, pasteFromClipboard } from "../components/analytical-methods/workflow/workflowClipboard";
import { historyCommit, historyRedo, historyUndo } from "../components/analytical-methods/workflow/workflowHistory";
import { cloneSnapshot, serializeForCompare } from "../components/analytical-methods/workflow/workflowSnapshot";
import type { WorkflowSnapshot } from "../components/analytical-methods/workflow/types";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function sampleSnapshot(extraNode = false): WorkflowSnapshot {
  const nodes: Node[] = [
    { id: "start", type: "workflowNode", position: { x: 0, y: 0 }, data: { label: "Start", nodeType: "Start" } },
    { id: "a", type: "workflowNode", position: { x: 100, y: 0 }, data: { label: "A", nodeType: "Step" }, selected: true },
    { id: "end", type: "workflowNode", position: { x: 200, y: 0 }, data: { label: "End", nodeType: "End" } },
  ];
  if (extraNode) {
    nodes.splice(2, 0, {
      id: "b",
      type: "workflowNode",
      position: { x: 150, y: 0 },
      data: { label: "B", nodeType: "Step" },
    });
  }
  const edges: Edge[] = [
    { id: "start-a", source: "start", target: "a" },
    { id: "a-end", source: "a", target: "end" },
  ];
  return { nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } };
}

let state = {
  past: [] as WorkflowSnapshot[],
  present: sampleSnapshot(),
  future: [] as WorkflowSnapshot[],
};

for (let i = 0; i < 105; i++) {
  const snap = cloneSnapshot(state.present);
  snap.nodes.push({
    id: `n-${i}`,
    type: "workflowNode",
    position: { x: i * 10, y: 0 },
    data: { label: `N${i}`, nodeType: "Step" },
  });
  state = historyCommit(state, snap);
}
assert(state.past.length === 100, "history capped at 100");

const countBeforeUndo = state.present.nodes.length;
state = historyUndo(state);
assert(state.present.nodes.length === countBeforeUndo - 1, "undo removes last committed node");

state = historyRedo(state);
assert(state.future.length === 0, "redo clears future tail");

const clipboard = copySelection(state.present.nodes, state.present.edges);
assert(clipboard !== null, "copy selection works");
assert(clipboard!.nodes.length === 1, "copies one selected node");

const pasted = pasteFromClipboard(clipboard!, state.present.nodes, state.present.edges);
const newIds = pasted.nodes.filter((n) => !state.present.nodes.some((o) => o.id === n.id)).map((n) => n.id);
assert(newIds.length === 1, "paste creates one new node");
assert(new Set(pasted.nodes.map((n) => n.id)).size === pasted.nodes.length, "paste node IDs unique");

const duplicated = duplicateSelection(
  pasted.nodes.map((n) => ({ ...n, selected: n.id === "a" })),
  pasted.edges,
);
assert(duplicated !== null, "duplicate works");

const snapA = sampleSnapshot();
const snapB = cloneSnapshot(snapA);
snapB.nodes[1]!.data = { label: "Changed", nodeType: "Step" };
assert(serializeForCompare(snapA) !== serializeForCompare(snapB), "clone is independent");

console.log("test-workflow-history.ts OK");
