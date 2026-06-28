import { z } from "zod";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import type { AiExtractionResult } from "@/types/analytical-methods";
import { AI_WARNING } from "@/lib/analytical-methods-labels";

export const aiExtractionSchema = z.object({
  nodes: z.array(
    z.object({
      nodeKey: z.string(),
      type: z.enum(["Start", "Step", "Condition", "Qc", "Equipment", "Reagent", "End"]),
      label: z.string(),
      description: z.string().default(""),
      positionX: z.number().default(0),
      positionY: z.number().default(0),
      configJson: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
  edges: z.array(
    z.object({
      sourceNodeKey: z.string(),
      targetNodeKey: z.string(),
      label: z.string().optional(),
      conditionJson: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
  reagents: z.array(
    z.object({
      nameFreeText: z.string(),
      casNumber: z.string().optional(),
      amountPerSample: z.number(),
      unit: z.string(),
      isConsumable: z.boolean().optional(),
    }),
  ),
  equipment: z.array(
    z.object({
      nameFreeText: z.string(),
      role: z.string().optional(),
    }),
  ),
  qcRequirements: z.array(
    z.object({
      qcType: z.string(),
      frequency: z.string(),
      frequencyUnit: z.string(),
      limitsJson: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
  acceptanceCriteria: z.array(
    z.object({
      analyte: z.string(),
      criteriaJson: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
  safetyNotes: z.array(
    z.object({
      noteType: z.string(),
      content: z.string(),
    }),
  ),
});

export type AiExtractionSchema = z.infer<typeof aiExtractionSchema>;

/** Phase 3 stub — AI provider chưa được cấu hình. */
export async function extractSopStub(params: {
  methodVersionId: string;
  documentId: string;
  requestedBy: string;
}): Promise<{ logId: string; message: string }> {
  const logId = randomUUID();

  await db.methodAIExtractionLog.create({
    data: {
      id: logId,
      methodVersionId: params.methodVersionId,
      documentId: params.documentId,
      status: "Failed",
      provider: "none",
      model: "none",
      promptVersion: "0",
      errorMessage:
        "AI extraction chưa được kích hoạt. Vui lòng tạo flowchart thủ công hoặc cấu hình LLM provider.",
      rawResponseJson: "{}",
      parsedJson: "{}",
    },
  });

  return {
    logId,
    message: AI_WARNING,
  };
}

export function validateAiExtractionPayload(payload: unknown): AiExtractionResult {
  return aiExtractionSchema.parse(payload);
}

export async function applyAiExtractionDraft(params: {
  methodVersionId: string;
  payload: AiExtractionResult;
}) {
  const workflow = await db.methodWorkflow.findUnique({
    where: { methodVersionId: params.methodVersionId },
    select: { id: true },
  });
  if (!workflow) throw new Error("Workflow không tồn tại");

  const { saveMethodWorkflow } = await import("./method-workflow");
  await saveMethodWorkflow(params.methodVersionId, {
    layoutJson: JSON.stringify({ x: 0, y: 0, zoom: 1 }),
    nodes: params.payload.nodes.map((n) => ({
      nodeKey: n.nodeKey,
      type: n.type,
      label: n.label,
      description: n.description,
      positionX: n.positionX,
      positionY: n.positionY,
      configJson: JSON.stringify(n.configJson ?? {}),
    })),
    edges: params.payload.edges.map((e) => ({
      sourceNodeKey: e.sourceNodeKey,
      targetNodeKey: e.targetNodeKey,
      label: e.label,
      conditionJson: JSON.stringify(e.conditionJson ?? {}),
    })),
  });

  await db.methodWorkflow.update({
    where: { id: workflow.id },
    data: { sourceType: "AI", isDraft: true },
  });
}
