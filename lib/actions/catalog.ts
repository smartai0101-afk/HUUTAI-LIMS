"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guards";
import {
  hardDeleteSampleMatrixGroup,
  importMatrixCatalog,
  listSampleMatrixGroups,
  reindexMatrixGroups,
  softDeleteSampleMatrixGroup,
  upsertSampleMatrixGroup,
  type MatrixImportRow,
} from "@/lib/services/catalog/sample-matrix-groups";
import {
  hardDeleteSampleMatrix,
  listSampleMatrices,
  softDeleteSampleMatrix,
  upsertSampleMatrix,
} from "@/lib/services/catalog/sample-matrices";
import { listTestCategories, upsertTestCategory } from "@/lib/services/catalog/test-categories";
import {
  importTestMethodCatalog,
  type TestMethodImportRow,
} from "@/lib/services/catalog/test-method-import";
import {
  bulkHardDeleteTestMethods,
  bulkSoftDeleteTestMethods,
  bulkUpdateTestMethods,
  hardDeleteTestMethod,
  listTestMethods,
  listTestMethodsForMatrix,
  setMatrixTestMappings,
  softDeleteTestMethod,
  type TestMethodBulkPatch,
  upsertTestMethod,
} from "@/lib/services/catalog/test-methods";
import { listTestPackages } from "@/lib/services/catalog/test-packages";
import { db } from "@/lib/db";
import * as XLSX from "xlsx";

export async function fetchSampleMatrixGroupsAction() {
  await requirePermission("catalog_matrices", "read");
  return listSampleMatrixGroups();
}

export async function fetchSampleMatricesAction(groupId?: string) {
  await requirePermission("catalog_matrices", "read");
  return listSampleMatrices(true, groupId);
}

export async function fetchSampleMatricesActionLegacy() {
  await requirePermission("catalog_matrices", "read");
  return listSampleMatrices();
}

export async function fetchTestCategoriesAction() {
  await requirePermission("catalog_test_methods", "read");
  return listTestCategories();
}

export async function fetchTestMethodsAction(matrixId?: string) {
  await requirePermission("catalog_test_methods", "read");
  if (matrixId) return listTestMethodsForMatrix(matrixId);
  return listTestMethods();
}

export async function fetchMatrixMappingEditorAction(matrixId: string) {
  await requirePermission("catalog_test_methods", "read");
  const [tests, mappings] = await Promise.all([
    listTestMethods(),
    db.matrixTestMapping.findMany({
      where: { matrixId },
      select: { testMethodId: true },
    }),
  ]);
  return {
    tests,
    mappedIds: mappings.map((m) => m.testMethodId),
  };
}

export async function fetchTestPackagesAction(matrixId?: string) {
  await requirePermission("catalog_test_methods", "read");
  return listTestPackages(matrixId);
}

export async function saveSampleMatrixGroupAction(formData: FormData) {
  await requirePermission("catalog_matrices", "write");
  const id = String(formData.get("id") ?? "").trim() || undefined;
  const sortOrderRaw = String(formData.get("sortOrder") ?? "").trim();
  await upsertSampleMatrixGroup({
    id,
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    sortOrder: sortOrderRaw ? Number(sortOrderRaw) : undefined,
    active: formData.get("active") !== "false",
  });
  revalidatePath("/admin/catalog/matrix-groups");
  revalidatePath("/admin/catalog/matrices");
  revalidatePath("/samples/requests/new");
  return { ok: true };
}

export async function deleteSampleMatrixGroupAction(id: string) {
  await requirePermission("catalog_matrices", "write");
  await softDeleteSampleMatrixGroup(id);
  revalidatePath("/admin/catalog/matrix-groups");
  revalidatePath("/admin/catalog/matrices");
  revalidatePath("/samples/requests/new");
  return { ok: true };
}

export async function hardDeleteSampleMatrixGroupAction(id: string) {
  await requirePermission("catalog_matrices", "write");
  await hardDeleteSampleMatrixGroup(id);
  revalidatePath("/admin/catalog/matrix-groups");
  revalidatePath("/admin/catalog/matrices");
  revalidatePath("/samples/requests/new");
  return { ok: true };
}

export async function reindexMatrixGroupsAction() {
  await requirePermission("catalog_matrices", "write");
  const count = await reindexMatrixGroups();
  revalidatePath("/admin/catalog/matrix-groups");
  revalidatePath("/samples/requests/new");
  return { ok: true, count };
}

export async function saveSampleMatrixAction(formData: FormData) {
  await requirePermission("catalog_matrices", "write");
  const id = String(formData.get("id") ?? "").trim() || undefined;
  const groupId = String(formData.get("groupId") ?? "").trim() || null;
  await upsertSampleMatrix({
    id,
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    groupId,
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    active: formData.get("active") !== "false",
  });
  revalidatePath("/admin/catalog/matrices");
  revalidatePath("/samples/requests/new");
  return { ok: true };
}

export async function deleteSampleMatrixAction(id: string) {
  await requirePermission("catalog_matrices", "write");
  await softDeleteSampleMatrix(id);
  revalidatePath("/admin/catalog/matrices");
  revalidatePath("/samples/requests/new");
  return { ok: true };
}

export async function hardDeleteSampleMatrixAction(id: string) {
  await requirePermission("catalog_matrices", "write");
  await hardDeleteSampleMatrix(id);
  revalidatePath("/admin/catalog/matrices");
  revalidatePath("/admin/catalog/mappings");
  revalidatePath("/samples/requests/new");
  return { ok: true };
}

export async function saveTestMethodAction(formData: FormData) {
  await requirePermission("catalog_test_methods", "write");
  const id = String(formData.get("id") ?? "").trim() || undefined;
  const methodLinksRaw = String(formData.get("methodLinks") ?? "").trim();
  let methodLinks: import("@/lib/services/catalog/test-methods").TestMethodMethodLinkInput[] | undefined;
  if (methodLinksRaw) {
    try {
      methodLinks = JSON.parse(methodLinksRaw) as import("@/lib/services/catalog/test-methods").TestMethodMethodLinkInput[];
    } catch {
      return { error: "Dữ liệu phương pháp thử không hợp lệ" };
    }
  }

  const row = await upsertTestMethod({
    id,
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    defaultUnit: String(formData.get("defaultUnit") ?? ""),
    resultType: String(formData.get("resultType") ?? "numeric") as import("@prisma/client").TestResultType,
    lod: String(formData.get("lod") ?? ""),
    loq: String(formData.get("loq") ?? ""),
    estimatedMinutes: formData.get("estimatedMinutes")
      ? Number(formData.get("estimatedMinutes"))
      : null,
    responsibleDeptId: String(formData.get("responsibleDeptId") ?? "").trim() || null,
    methodLinks,
  });

  const matrixIdsRaw = String(formData.get("matrixIds") ?? "[]");
  try {
    const matrixIds = JSON.parse(matrixIdsRaw) as string[];
    for (const matrixId of matrixIds) {
      await setMatrixTestMappings(matrixId, [
        ...(await import("@/lib/db").then(async ({ db }) => {
          const existing = await db.matrixTestMapping.findMany({
            where: { matrixId },
            select: { testMethodId: true },
          });
          return existing.map((e) => e.testMethodId);
        })),
        row.id,
      ].filter((v, i, a) => a.indexOf(v) === i));
    }
  } catch {
    /* ignore parse */
  }

  revalidatePath("/admin/catalog/test-methods");
  revalidatePath("/admin/catalog/mappings");
  revalidatePath("/samples/requests/new");
  return { ok: true, id: row.id };
}

export async function deleteTestMethodAction(id: string) {
  await requirePermission("catalog_test_methods", "write");
  await softDeleteTestMethod(id);
  revalidatePath("/admin/catalog/test-methods");
  revalidatePath("/admin/catalog/mappings");
  revalidatePath("/samples/requests/new");
  return { ok: true };
}

export async function hardDeleteTestMethodAction(id: string) {
  await requirePermission("catalog_test_methods", "write");
  await hardDeleteTestMethod(id);
  revalidatePath("/admin/catalog/test-methods");
  revalidatePath("/admin/catalog/mappings");
  revalidatePath("/samples/requests/new");
  return { ok: true };
}

function revalidateTestMethodCatalogPaths() {
  revalidatePath("/admin/catalog/test-methods");
  revalidatePath("/admin/catalog/mappings");
  revalidatePath("/samples/requests/new");
}

export async function bulkHideTestMethodsAction(ids: string[]) {
  await requirePermission("catalog_test_methods", "write");
  const result = await bulkSoftDeleteTestMethods(ids);
  revalidateTestMethodCatalogPaths();
  return { ok: true as const, ...result };
}

export async function bulkHardDeleteTestMethodsAction(ids: string[]) {
  await requirePermission("catalog_test_methods", "write");
  const result = await bulkHardDeleteTestMethods(ids);
  revalidateTestMethodCatalogPaths();
  return { ok: true as const, ...result };
}

export async function bulkUpdateTestMethodsAction(ids: string[], patch: TestMethodBulkPatch) {
  await requirePermission("catalog_test_methods", "write");
  const result = await bulkUpdateTestMethods(ids, patch);
  revalidateTestMethodCatalogPaths();
  return { ok: true as const, ...result };
}

export async function saveTestCategoryAction(formData: FormData) {
  await requirePermission("catalog_test_methods", "write");
  await upsertTestCategory({
    id: String(formData.get("id") ?? "").trim() || undefined,
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  });
  revalidatePath("/admin/catalog/test-methods");
  return { ok: true };
}

export async function saveMatrixMappingsAction(matrixId: string, testMethodIds: string[]) {
  await requirePermission("catalog_test_methods", "write");
  await setMatrixTestMappings(matrixId, testMethodIds);
  revalidatePath("/admin/catalog/mappings");
  revalidatePath("/samples/requests/new");
  return { ok: true };
}

const IMPORT_HEADERS = ["groupCode", "groupName", "matrixCode", "matrixName", "sortOrder"] as const;

function parseImportRows(raw: Record<string, unknown>[]): MatrixImportRow[] {
  return raw.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      normalized[k.trim().toLowerCase()] = v;
    }
    return {
      groupCode: String(normalized.groupcode ?? normalized["mã nhóm"] ?? "").trim(),
      groupName: String(normalized.groupname ?? normalized["tên nhóm"] ?? "").trim(),
      matrixCode: String(normalized.matrixcode ?? normalized["mã nền"] ?? "").trim(),
      matrixName: String(normalized.matrixname ?? normalized["tên nền"] ?? "").trim(),
      sortOrder: normalized.sortorder ? Number(normalized.sortorder) : undefined,
    };
  });
}

export async function importMatrixCatalogAction(formData: FormData) {
  await requirePermission("catalog_matrices", "write");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Chọn file Excel hoặc CSV." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { ok: false as const, error: "File không có sheet dữ liệu." };

  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (json.length === 0) return { ok: false as const, error: "File trống." };

  const rows = parseImportRows(json);
  const result = await importMatrixCatalog(rows);

  revalidatePath("/admin/catalog/matrix-groups");
  revalidatePath("/admin/catalog/matrices");
  revalidatePath("/samples/requests/new");

  return { ok: true as const, result, templateHeaders: [...IMPORT_HEADERS] };
}

const TEST_METHOD_IMPORT_HEADERS = [
  "code",
  "name",
  "categoryCode",
  "categoryName",
  "defaultMethodCode",
  "defaultUnit",
  "lod",
] as const;

function parseTestMethodImportRows(raw: Record<string, unknown>[]): TestMethodImportRow[] {
  return raw.map((row) => {
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      normalized[k.trim().toLowerCase()] = v;
    }
    return {
      code: String(normalized.code ?? normalized["mã"] ?? normalized.ma ?? "").trim(),
      name: String(normalized.name ?? normalized["tên"] ?? normalized.ten ?? "").trim(),
      categoryCode: String(
        normalized.categorycode ?? normalized.manhom ?? normalized["mã nhóm"] ?? normalized["ma nhom"] ?? "",
      ).trim(),
      categoryName: String(
        normalized.categoryname ?? normalized.nhom ?? normalized["nhóm"] ?? normalized.nhom ?? "",
      ).trim(),
      defaultMethodCode: String(
        normalized.defaultmethodcode ??
          normalized.phuongphapthu ??
          normalized["phương pháp thử"] ??
          normalized["phuong phap thu"] ??
          "",
      ).trim(),
      defaultUnit: String(normalized.defaultunit ?? normalized.dvt ?? normalized["đvt"] ?? "").trim(),
      lod: String(normalized.lod ?? normalized.LOD ?? "").trim(),
    };
  });
}

export async function importTestMethodsCatalogAction(formData: FormData) {
  await requirePermission("catalog_test_methods", "write");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, error: "Chọn file Excel hoặc CSV." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { ok: false as const, error: "File không có sheet dữ liệu." };

  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (json.length === 0) return { ok: false as const, error: "File trống." };

  const rows = parseTestMethodImportRows(json);
  const result = await importTestMethodCatalog(rows);

  revalidatePath("/admin/catalog/test-methods");
  revalidatePath("/admin/catalog/mappings");
  revalidatePath("/samples/requests/new");

  return { ok: true as const, result, templateHeaders: [...TEST_METHOD_IMPORT_HEADERS] };
}
