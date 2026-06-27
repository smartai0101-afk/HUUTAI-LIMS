"use server";

import {
  InventoryItemStatus,
  PreparedStandardComponentSourceType,
  PreparedStandardLevel,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import { requireSessionCanEdit } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  findActivePreparedChemicalByCode,
  findActivePreparedStandardByCode,
  findActivePreparedStrainByCode,
  releaseSoftDeletedPreparedChemicalCode,
  releaseSoftDeletedPreparedStandardCode,
  releaseSoftDeletedPreparedStrainCode,
} from "@/lib/prepared-code-guard";
import { inferPreparedBatchFields } from "@/lib/prepared-batch-code";
import { parseQuantityWithUnit } from "@/lib/excel-import-utils";
import { isValidFormDate, parseFormDate, statusFromLabel } from "@/lib/modules/shared";
import { computePreparedChemicalStatus } from "@/lib/prepared-chemical-status";
import {
  detectCodeDuplicatesInFile,
  detectPreparedStandardGroupDuplicates,
  groupPreparedStandardImportRows,
  levelLabelFromImport,
} from "@/lib/prepared-excel";
import { PREPARED_STANDARD_LEVEL_LABELS } from "@/lib/prepared-standards-fields";
import { computePreparedStandardStatus } from "@/lib/prepared-standard-status";

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function parseRows(formData: FormData): Record<string, string>[] | { error: string } {
  const raw = str(formData, "rows");
  if (!raw) return { error: "Không có dữ liệu nhập" };
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { error: "Dữ liệu nhập phải là mảng JSON" };
    return parsed as Record<string, string>[];
  } catch {
    return { error: "JSON không hợp lệ" };
  }
}

function parseQuantity(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function rowStr(row: Record<string, string>, key: string) {
  return String(row[key] ?? "").trim();
}

function levelFromComponentLabel(label: string): PreparedStandardLevel | null {
  const trimmed = label.trim();
  if (!trimmed) return null;
  const entry = Object.entries(PREPARED_STANDARD_LEVEL_LABELS).find(([, v]) => v === trimmed);
  return entry ? (entry[0] as PreparedStandardLevel) : null;
}

async function buildComponentFromImportRow(row: Record<string, string>) {
  const sourceTypeLabel = rowStr(row, "componentSourceType");
  const standardCode = rowStr(row, "componentStandardCode");
  const quantityRaw = rowStr(row, "componentQuantityUsed");
  const { quantity, unit } = parseQuantityWithUnit(quantityRaw);

  if (!standardCode && !quantityRaw) return null;

  const isPreparedSource = sourceTypeLabel === "Chuẩn pha chế";
  let standardId: string | null = null;
  let sourcePreparedStandardId: string | null = null;

  if (isPreparedSource && standardCode) {
    const source = await db.preparedStandard.findUnique({ where: { code: standardCode } });
    if (source) sourcePreparedStandardId = source.id;
  } else if (standardCode) {
    const standard = await db.standard.findUnique({ where: { code: standardCode } });
    if (standard) standardId = standard.id;
  }

  const levelSnapshot = levelFromComponentLabel(rowStr(row, "componentLevelLabel"));
  const preparedDateStr = rowStr(row, "componentPreparedDate");
  const expiryDateStr = rowStr(row, "componentExpiryDate");

  return {
    sourceType: (isPreparedSource ? "PreparedStandard" : "Standard") as PreparedStandardComponentSourceType,
    standardId,
    sourcePreparedStandardId,
    stockLotId: null as string | null,
    standardCodeSnapshot: standardCode || rowStr(row, "componentStandardName"),
    standardNameSnapshot: rowStr(row, "componentStandardName") || standardCode,
    manufacturerSnapshot: rowStr(row, "componentManufacturer"),
    productCodeSnapshot: rowStr(row, "componentProductCode"),
    lotNumberSnapshot: rowStr(row, "componentLotNumber"),
    puritySnapshot: rowStr(row, "componentPurity"),
    concentrationSnapshot: rowStr(row, "componentConcentration"),
    concentrationUnitSnapshot: rowStr(row, "componentConcentrationUnit"),
    levelSnapshot,
    preparedDateSnapshot: preparedDateStr ? parseFormDate(preparedDateStr) : null,
    expiryDateSnapshot: expiryDateStr ? parseFormDate(expiryDateStr) : null,
    quantityUsed: quantity > 0 ? quantity : 0,
    unit,
  };
}

async function buildSolventFromImportRow(row: Record<string, string>) {
  const chemicalCode = rowStr(row, "solventChemicalCode");
  const quantityRaw = rowStr(row, "solventQuantityUsed");
  const { quantity, unit } = parseQuantityWithUnit(quantityRaw);

  if (!chemicalCode && !quantityRaw) return null;

  const chemical = chemicalCode
    ? await db.chemical.findUnique({ where: { code: chemicalCode } })
    : null;

  if (chemicalCode && !chemical) {
    return { error: `Không tìm thấy hóa chất gốc ${chemicalCode}` as const };
  }
  if (!chemical) return null;

  return {
    chemicalId: chemical.id,
    stockLotId: null as string | null,
    chemicalCodeSnapshot: chemical.code,
    chemicalNameSnapshot: rowStr(row, "solventChemicalName") || chemical.name,
    casProductCodeSnapshot: rowStr(row, "solventCasProductCode"),
    lotNumberSnapshot: rowStr(row, "solventLotNumber"),
    quantityUsed: quantity > 0 ? quantity : 0,
    unit: unit || chemical.unit,
  };
}

/** Import header rows — no ingredient inventory deduction. */
export async function bulkImportPreparedChemicals(formData: FormData) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || auth.user.name || "System";

  const rows = parseRows(formData);
  if ("error" in rows) return rows;

  const fileDup = detectCodeDuplicatesInFile(rows, "code");
  const errors: string[] = [...fileDup.errors];
  let count = 0;

  for (let i = 0; i < rows.length; i++) {
    if (fileDup.skipIndices.has(i)) continue;

    const row = rows[i]!;
    const line = i + 2;
    const code = rowStr(row, "code");
    const name = rowStr(row, "name");
    const preparedDateStr = rowStr(row, "preparedDate");
    const expiryDateStr = rowStr(row, "expiryDate");

    if (!code && !name) continue;
    if (!code || !name) {
      errors.push(`Dòng ${line}: thiếu mã hoặc tên`);
      continue;
    }
    if (!isValidFormDate(preparedDateStr) || !isValidFormDate(expiryDateStr)) {
      errors.push(`Dòng ${line} (${code}): ngày pha/hết hạn không hợp lệ`);
      continue;
    }

    await releaseSoftDeletedPreparedChemicalCode(code);
    const exists = await findActivePreparedChemicalByCode(code);
    if (exists) {
      errors.push(`Dòng ${line}: mã ${code} đã tồn tại`);
      continue;
    }

    const preparedQuantity = parseQuantity(rowStr(row, "preparedQuantity") || "1");
    const unit = rowStr(row, "unit") || "mL";
    const preparedDate = parseFormDate(preparedDateStr)!;
    const expiryDate = parseFormDate(expiryDateStr)!;
    const batchFields = inferPreparedBatchFields(code);

    await db.preparedChemical.create({
      data: {
        parentCode: batchFields.parentCode,
        batchNumber: batchFields.batchNumber,
        code,
        name,
        concentration: rowStr(row, "concentration"),
        concentrationUnit: rowStr(row, "concentrationUnit"),
        preparedQuantity: preparedQuantity > 0 ? preparedQuantity : 1,
        unit,
        preparedDate,
        expiryDate,
        preparedBy: rowStr(row, "preparedBy"),
        storageLocation: rowStr(row, "storageLocation"),
        storageCondition: rowStr(row, "storageCondition"),
        notes: rowStr(row, "notes"),
        status: computePreparedChemicalStatus(expiryDate),
      },
    });
    count++;
  }

  if (count === 0) {
    return { error: errors.length ? errors.slice(0, 5).join("; ") : "Không có dòng hợp lệ để import" };
  }

  await logActivity({
    user,
    action: "Imported",
    entityType: "PreparedChemical",
    entityId: "bulk-excel",
    object: `${count} hóa chất pha`,
  });
  revalidatePath("/prepared-chemicals");
  revalidatePath("/");
  return { success: true, count, errors: errors.length ? errors : undefined };
}

/** Import grouped multi-row export — metadata + components/solvents, no inventory deduction. */
export async function bulkImportPreparedStandards(formData: FormData) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || auth.user.name || "System";

  const rows = parseRows(formData);
  if ("error" in rows) return rows;

  const groupDup = detectPreparedStandardGroupDuplicates(rows);
  const groups = groupPreparedStandardImportRows(rows);
  const errors: string[] = [...groupDup.errors];
  let count = 0;

  for (const group of groups) {
    const code = rowStr(group.header, "code");
    if (!code || groupDup.duplicateCodes.has(code)) continue;

    const firstLine = group.lines[0] ?? 2;
    const name = rowStr(group.header, "name");
    const level = levelLabelFromImport(rowStr(group.header, "level"));
    const preparedDateStr = rowStr(group.header, "preparedDate");
    const expiryDateStr = rowStr(group.header, "expiryDate");

    if (!name) {
      errors.push(`Dòng ${firstLine} (${code}): thiếu tên`);
      continue;
    }
    if (!level) {
      errors.push(`Dòng ${firstLine} (${code}): cấp chuẩn không hợp lệ`);
      continue;
    }
    if (!isValidFormDate(preparedDateStr) || !isValidFormDate(expiryDateStr)) {
      errors.push(`Dòng ${firstLine} (${code}): ngày pha/hết hạn không hợp lệ`);
      continue;
    }

    await releaseSoftDeletedPreparedStandardCode(code);
    const exists = await findActivePreparedStandardByCode(code);
    if (exists) {
      errors.push(`Dòng ${firstLine}: mã ${code} đã tồn tại`);
      continue;
    }

    const allRows = [group.header, ...group.componentRows];
    const componentCreates = [];
    const solventCreates = [];
    let rowError: string | null = null;

    for (const importRow of allRows) {
      const comp = await buildComponentFromImportRow(importRow);
      if (comp) componentCreates.push(comp);

      const sol = await buildSolventFromImportRow(importRow);
      if (sol && "error" in sol) {
        rowError = sol.error ?? "Không tìm thấy hóa chất gốc";
        break;
      }
      if (sol) solventCreates.push(sol);
    }

    if (rowError) {
      errors.push(`Dòng ${firstLine} (${code}): ${rowError}`);
      continue;
    }

    const solventVolume = parseQuantity(rowStr(group.header, "solventVolume") || "0");
    const solventUnit = rowStr(group.header, "solventUnit") || "mL";
    const preparedDate = parseFormDate(preparedDateStr)!;
    const expiryDate = parseFormDate(expiryDateStr)!;
    const batchFields = inferPreparedBatchFields(code);

    await db.preparedStandard.create({
      data: {
        parentCode: batchFields.parentCode,
        batchNumber: batchFields.batchNumber,
        code,
        name,
        level,
        concentration: rowStr(group.header, "concentration"),
        concentrationUnit: rowStr(group.header, "concentrationUnit"),
        solventVolume,
        solventUnit,
        quantity: solventVolume,
        unit: solventUnit,
        preparedDate,
        expiryDate,
        preparedBy: rowStr(group.header, "preparedBy"),
        storageLocation: rowStr(group.header, "storageLocation"),
        storageCondition: rowStr(group.header, "storageCondition"),
        notes: rowStr(group.header, "notes"),
        status: computePreparedStandardStatus(expiryDate),
        components: componentCreates.length
          ? {
              create: componentCreates.map((c) => ({
                sourceType: c.sourceType,
                standard: c.standardId ? { connect: { id: c.standardId } } : undefined,
                sourcePreparedStandard: c.sourcePreparedStandardId
                  ? { connect: { id: c.sourcePreparedStandardId } }
                  : undefined,
                stockLotId: c.stockLotId,
                standardCodeSnapshot: c.standardCodeSnapshot,
                standardNameSnapshot: c.standardNameSnapshot,
                manufacturerSnapshot: c.manufacturerSnapshot,
                productCodeSnapshot: c.productCodeSnapshot,
                lotNumberSnapshot: c.lotNumberSnapshot,
                puritySnapshot: c.puritySnapshot,
                concentrationSnapshot: c.concentrationSnapshot,
                concentrationUnitSnapshot: c.concentrationUnitSnapshot,
                levelSnapshot: c.levelSnapshot,
                preparedDateSnapshot: c.preparedDateSnapshot,
                expiryDateSnapshot: c.expiryDateSnapshot,
                quantityUsed: c.quantityUsed,
                unit: c.unit,
              })),
            }
          : undefined,
        solvents: solventCreates.length
          ? {
              create: solventCreates.map((s) => ({
                chemical: { connect: { id: s.chemicalId } },
                stockLotId: s.stockLotId,
                chemicalCodeSnapshot: s.chemicalCodeSnapshot,
                chemicalNameSnapshot: s.chemicalNameSnapshot,
                casProductCodeSnapshot: s.casProductCodeSnapshot,
                lotNumberSnapshot: s.lotNumberSnapshot,
                quantityUsed: s.quantityUsed,
                unit: s.unit,
              })),
            }
          : undefined,
      },
    });
    count++;
  }

  if (count === 0) {
    return { error: errors.length ? errors.slice(0, 5).join("; ") : "Không có dòng hợp lệ để import" };
  }

  await logActivity({
    user,
    action: "Imported",
    entityType: "PreparedStandard",
    entityId: "bulk-excel",
    object: `${count} chuẩn pha`,
  });
  revalidatePath("/prepared-standards");
  revalidatePath("/");
  return { success: true, count, errors: errors.length ? errors : undefined };
}

export async function bulkImportPreparedStrains(formData: FormData) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };
  const user = str(formData, "user") || auth.user.name || "System";

  const rows = parseRows(formData);
  if ("error" in rows) return rows;

  const fileDup = detectCodeDuplicatesInFile(rows, "code");
  const errors: string[] = [...fileDup.errors];
  let count = 0;

  for (let i = 0; i < rows.length; i++) {
    if (fileDup.skipIndices.has(i)) continue;

    const row = rows[i]!;
    const line = i + 2;
    const code = rowStr(row, "code");
    const name = rowStr(row, "name");
    const sourceCode = rowStr(row, "sourceCode");
    const preparedDateStr = rowStr(row, "preparedDate");
    const expiryDateStr = rowStr(row, "expiryDate");

    if (!code && !name) continue;
    if (!code || !name) {
      errors.push(`Dòng ${line}: thiếu mã hoặc tên`);
      continue;
    }
    if (!sourceCode) {
      errors.push(`Dòng ${line} (${code}): thiếu mã chủng gốc (Nguồn gốc)`);
      continue;
    }
    if (!isValidFormDate(preparedDateStr) || !isValidFormDate(expiryDateStr)) {
      errors.push(`Dòng ${line} (${code}): ngày pha/hết hạn không hợp lệ`);
      continue;
    }

    await releaseSoftDeletedPreparedStrainCode(code);
    const exists = await findActivePreparedStrainByCode(code);
    if (exists) {
      errors.push(`Dòng ${line}: mã ${code} đã tồn tại`);
      continue;
    }

    const sourceStrain = await db.microbialStrain.findFirst({
      where: { code: sourceCode },
    });
    if (!sourceStrain) {
      errors.push(`Dòng ${line} (${code}): không tìm thấy chủng gốc ${sourceCode}`);
      continue;
    }

    const preparedDate = parseFormDate(preparedDateStr)!;
    const expiryDate = parseFormDate(expiryDateStr)!;
    const batchFields = inferPreparedBatchFields(code);

    await db.preparedStrain.create({
      data: {
        parentCode: batchFields.parentCode,
        batchNumber: batchFields.batchNumber,
        code,
        name,
        sourceStrainId: sourceStrain.id,
        sourceStockLotId: null,
        sourceLotNumberSnapshot: rowStr(row, "sourceLotNumber"),
        formula: rowStr(row, "formula"),
        concentration: rowStr(row, "concentration"),
        lot: rowStr(row, "lot"),
        preparedDate,
        preparedBy: rowStr(row, "preparedBy"),
        checkedBy: rowStr(row, "checkedBy"),
        expiryDate,
        passage: parseQuantity(rowStr(row, "passage") || "0"),
        storageCondition: rowStr(row, "storageCondition"),
        status: statusFromLabel(rowStr(row, "status") || "Available") as InventoryItemStatus,
        responsiblePerson: rowStr(row, "responsiblePerson"),
        notes: rowStr(row, "notes"),
      },
    });
    count++;
  }

  if (count === 0) {
    return { error: errors.length ? errors.slice(0, 5).join("; ") : "Không có dòng hợp lệ để import" };
  }

  await logActivity({
    user,
    action: "Imported",
    entityType: "PreparedStrain",
    entityId: "bulk-excel",
    object: `${count} chủng pha`,
  });
  revalidatePath("/prepared-strains");
  revalidatePath("/microbial-strains");
  return { success: true, count, errors: errors.length ? errors : undefined };
}
