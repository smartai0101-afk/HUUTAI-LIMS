import { db } from "@/lib/db";
import { mapMethodReagent } from "@/lib/mappers/analytical-methods";
import type { MethodReagentView, ReagentCalculationRow } from "@/types/analytical-methods";

export async function listMethodReagents(methodVersionId: string): Promise<MethodReagentView[]> {
  const rows = await db.methodReagent.findMany({
    where: { methodVersionId },
    include: {
      chemical: { select: { code: true, name: true } },
      standard: { select: { code: true, name: true } },
    },
    orderBy: { nameFreeText: "asc" },
  });
  return rows.map(mapMethodReagent);
}

export async function saveMethodReagent(data: {
  id?: string;
  methodVersionId: string;
  workflowNodeKey?: string;
  chemicalId?: string | null;
  standardId?: string | null;
  nameFreeText: string;
  casNumber?: string;
  amountPerSample: number;
  unit: string;
  isConsumable?: boolean;
}) {
  const payload = {
    methodVersionId: data.methodVersionId,
    workflowNodeKey: data.workflowNodeKey ?? "",
    chemicalId: data.chemicalId || null,
    standardId: data.standardId || null,
    nameFreeText: data.nameFreeText,
    casNumber: data.casNumber ?? "",
    amountPerSample: data.amountPerSample,
    unit: data.unit,
    isConsumable: data.isConsumable ?? false,
  };

  if (data.id) {
    return db.methodReagent.update({ where: { id: data.id }, data: payload });
  }
  return db.methodReagent.create({ data: payload });
}

export async function deleteMethodReagent(id: string) {
  return db.methodReagent.delete({ where: { id } });
}

export async function calculateReagentRequirements(
  methodVersionId: string,
  sampleCount: number,
): Promise<ReagentCalculationRow[]> {
  const reagents = await listMethodReagents(methodVersionId);
  const rows: ReagentCalculationRow[] = [];

  for (const r of reagents) {
    const totalAmount = r.amountPerSample * sampleCount;
    let stockAvailable: number | null = null;
    let stockUnit: string | null = null;
    let sufficient: boolean | null = null;
    let warning: string | null = null;

    if (r.chemicalId) {
      const chemical = await db.chemical.findUnique({
        where: { id: r.chemicalId },
        select: { quantity: true, unit: true, name: true },
      });
      if (chemical) {
        stockAvailable = chemical.quantity;
        stockUnit = chemical.unit;
        sufficient = chemical.quantity >= totalAmount;
        if (!sufficient) {
          warning = `Tồn kho ${chemical.name} không đủ (cần ${totalAmount} ${r.unit}, có ${chemical.quantity} ${chemical.unit})`;
        } else if (chemical.quantity <= 5) {
          warning = `Tồn kho thấp (${chemical.quantity} ${chemical.unit})`;
        }
      }
    }

    rows.push({
      id: r.id,
      name: r.chemicalName || r.standardName || r.nameFreeText,
      amountPerSample: r.amountPerSample,
      unit: r.unit,
      totalAmount,
      stockAvailable,
      stockUnit,
      sufficient,
      warning,
    });
  }

  return rows;
}
