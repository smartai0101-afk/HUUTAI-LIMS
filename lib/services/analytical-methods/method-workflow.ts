import { randomUUID } from "crypto";
import type { WorkflowNodeType } from "@prisma/client";
import { db } from "@/lib/db";
import { mapMethodWorkflow } from "@/lib/mappers/analytical-methods";
import type { MethodWorkflowView } from "@/types/analytical-methods";

export async function getMethodWorkflow(methodVersionId: string): Promise<MethodWorkflowView | null> {
  const row = await db.methodWorkflow.findUnique({
    where: { methodVersionId },
    include: {
      nodes: { orderBy: { positionY: "asc" } },
      edges: true,
    },
  });
  if (!row) return null;
  return mapMethodWorkflow(row);
}

export type WorkflowSavePayload = {
  layoutJson: string;
  nodes: Array<{
    nodeKey: string;
    type: WorkflowNodeType;
    label: string;
    description: string;
    positionX: number;
    positionY: number;
    configJson?: string;
  }>;
  edges: Array<{
    sourceNodeKey: string;
    targetNodeKey: string;
    label?: string;
    conditionJson?: string;
  }>;
};

export async function saveMethodWorkflow(methodVersionId: string, payload: WorkflowSavePayload) {
  const existing = await db.methodWorkflow.findUnique({
    where: { methodVersionId },
    select: { id: true },
  });
  if (!existing) throw new Error("Workflow không tồn tại");

  return db.$transaction(async (tx) => {
    await tx.workflowNode.deleteMany({ where: { workflowId: existing.id } });
    await tx.workflowEdge.deleteMany({ where: { workflowId: existing.id } });

    if (payload.nodes.length > 0) {
      await tx.workflowNode.createMany({
        data: payload.nodes.map((n) => ({
          id: randomUUID(),
          workflowId: existing.id,
          nodeKey: n.nodeKey,
          type: n.type,
          label: n.label,
          description: n.description,
          positionX: n.positionX,
          positionY: n.positionY,
          configJson: n.configJson ?? "{}",
        })),
      });
    }

    if (payload.edges.length > 0) {
      await tx.workflowEdge.createMany({
        data: payload.edges.map((e) => ({
          id: randomUUID(),
          workflowId: existing.id,
          sourceNodeKey: e.sourceNodeKey,
          targetNodeKey: e.targetNodeKey,
          label: e.label ?? "",
          conditionJson: e.conditionJson ?? "{}",
        })),
      });
    }

    await tx.methodWorkflow.update({
      where: { id: existing.id },
      data: {
        layoutJson: payload.layoutJson,
        isDraft: true,
        sourceType: "Manual",
      },
    });
  });
}

export function topologicalSortNodes(
  nodes: Array<{ nodeKey: string; type: WorkflowNodeType; label: string; description: string }>,
  edges: Array<{ sourceNodeKey: string; targetNodeKey: string }>,
): Array<{ nodeKey: string; type: WorkflowNodeType; label: string; description: string }> {
  const nodeMap = new Map(nodes.map((n) => [n.nodeKey, n]));
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree.set(n.nodeKey, 0);
    adj.set(n.nodeKey, []);
  }

  for (const e of edges) {
    if (!nodeMap.has(e.sourceNodeKey) || !nodeMap.has(e.targetNodeKey)) continue;
    adj.get(e.sourceNodeKey)!.push(e.targetNodeKey);
    inDegree.set(e.targetNodeKey, (inDegree.get(e.targetNodeKey) ?? 0) + 1);
  }

  const queue = [...inDegree.entries()]
    .filter(([, deg]) => deg === 0)
    .map(([key]) => key);
  const sorted: typeof nodes = [];

  while (queue.length > 0) {
    const key = queue.shift()!;
    const node = nodeMap.get(key);
    if (node && node.type !== "Start" && node.type !== "End") {
      sorted.push(node);
    } else if (node && (node.type === "Start" || node.type === "End")) {
      // include start/end optionally in checklist - plan says Step, Qc, Equipment
    }
    for (const next of adj.get(key) ?? []) {
      const deg = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, deg);
      if (deg === 0) queue.push(next);
    }
  }

  // Include operational nodes in visit order
  const operational = nodes.filter((n) => n.type === "Step" || n.type === "Qc" || n.type === "Equipment" || n.type === "Reagent");
  if (sorted.length === 0) return operational;

  const sortedKeys = new Set(sorted.map((n) => n.nodeKey));
  const remaining = operational.filter((n) => !sortedKeys.has(n.nodeKey));
  return [...sorted, ...remaining];
}

export async function generateChecklistFromWorkflow(methodVersionId: string) {
  const workflow = await getMethodWorkflow(methodVersionId);
  if (!workflow) return [];

  const sorted = topologicalSortNodes(
    workflow.nodes.map((n) => ({
      nodeKey: n.nodeKey,
      type: n.type,
      label: n.label,
      description: n.description,
    })),
    workflow.edges,
  );

  const checklistTypes = new Set(["Step", "Qc", "Equipment", "Reagent"]);
  const items = workflow.nodes
    .filter((n) => checklistTypes.has(n.type))
    .sort((a, b) => {
      const ai = sorted.findIndex((s) => s.nodeKey === a.nodeKey);
      const bi = sorted.findIndex((s) => s.nodeKey === b.nodeKey);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

  return items.map((n, index) => ({
    stepOrder: index + 1,
    stepName: n.label || n.nodeKey,
    instruction: n.description,
    requiredInput: "",
    expectedResult: "",
    nodeType: n.type,
    workflowNodeKey: n.nodeKey,
  }));
}
