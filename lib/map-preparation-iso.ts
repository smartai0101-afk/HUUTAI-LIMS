export function mapPreparationIsoFields(row: {
  formula: string;
  originalConcentration: string;
  finalConcentration: string;
  equipmentUsed: string;
  preparationCondition: string;
  attachmentUrl: string;
  equipmentId?: string | null;
  equipment?: { code: string; name: string } | null;
}) {
  return {
    formula: row.formula,
    originalConcentration: row.originalConcentration,
    finalConcentration: row.finalConcentration,
    equipmentUsed: row.equipmentUsed,
    preparationCondition: row.preparationCondition,
    attachmentUrl: row.attachmentUrl,
    equipmentId: row.equipmentId ?? null,
    equipmentCode: row.equipment?.code ?? "",
    equipmentName: row.equipment?.name ?? "",
  };
}

export function preparationIsoFormData(fd: FormData, str: (fd: FormData, key: string) => string) {
  return {
    formula: str(fd, "formula"),
    originalConcentration: str(fd, "originalConcentration"),
    finalConcentration: str(fd, "finalConcentration"),
    equipmentUsed: str(fd, "equipmentUsed"),
    preparationCondition: str(fd, "preparationCondition"),
    equipmentId: str(fd, "equipmentId") || null,
  };
}
