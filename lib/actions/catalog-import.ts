"use server";

import { revalidatePath } from "next/cache";
import {
  importCatalogLotRows,
  previewCatalogImport,
  type CatalogImportKind,
} from "@/lib/catalog-import";
import { requireSessionCanEdit } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/audit";

const REVALIDATE_PATHS = [
  "/chemicals",
  "/standards",
  "/microbial-strains",
  "/containers",
  "/stock-in",
  "/",
  "/reports",
];

function revalidateCatalog() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

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

export async function previewCatalogImportAction(kind: CatalogImportKind, formData: FormData) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };

  const rows = parseRows(formData);
  if ("error" in rows) return rows;

  return previewCatalogImport({ kind, rows });
}

async function bulkImportCatalog(kind: CatalogImportKind, formData: FormData) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) return { error: auth.error };

  const user = str(formData, "user") || auth.user.name || "System";
  const mergeDuplicates = str(formData, "mergeDuplicates") === "true";

  const rows = parseRows(formData);
  if ("error" in rows) return rows;

  const result = await importCatalogLotRows({ kind, rows, user, mergeDuplicates });
  if (result.error) return { error: result.error, errors: result.errors };

  const entityType =
    kind === "chemical" ? "Chemical" : kind === "standard" ? "Standard" : "MicrobialStrain";

  await writeAuditLog({
    user,
    action: "Imported",
    entityType,
    entityId: "bulk-excel",
    object: `${result.count ?? 0} dòng`,
    after: { count: result.count, errors: result.errors, mergeDuplicates },
  });

  revalidateCatalog();
  return { success: true, count: result.count, errors: result.errors };
}

export async function bulkImportChemicals(formData: FormData) {
  return bulkImportCatalog("chemical", formData);
}

export async function bulkImportStandards(formData: FormData) {
  return bulkImportCatalog("standard", formData);
}

export async function bulkImportMicrobialStrains(formData: FormData) {
  return bulkImportCatalog("strain", formData);
}

export async function previewChemicalsImport(formData: FormData) {
  return previewCatalogImportAction("chemical", formData);
}

export async function previewStandardsImport(formData: FormData) {
  return previewCatalogImportAction("standard", formData);
}

export async function previewMicrobialStrainsImport(formData: FormData) {
  return previewCatalogImportAction("strain", formData);
}
