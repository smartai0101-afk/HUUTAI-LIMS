import { topologicalSortNodes } from "@/lib/services/analytical-methods/method-workflow";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const nodes = [
  { nodeKey: "start", type: "Start" as const, label: "Start", description: "" },
  { nodeKey: "a", type: "Step" as const, label: "A", description: "step a" },
  { nodeKey: "b", type: "Qc" as const, label: "B", description: "qc" },
  { nodeKey: "end", type: "End" as const, label: "End", description: "" },
];
const edges = [
  { sourceNodeKey: "start", targetNodeKey: "a" },
  { sourceNodeKey: "a", targetNodeKey: "b" },
  { sourceNodeKey: "b", targetNodeKey: "end" },
];

const sorted = topologicalSortNodes(nodes, edges);
assert(sorted.length >= 2, "should include operational nodes");
assert(sorted[0]?.nodeKey === "a" || sorted.some((n) => n.nodeKey === "a"), "includes step A");

console.log("test-method-workflow.ts OK");
