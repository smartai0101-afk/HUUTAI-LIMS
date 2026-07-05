import { syncPrimaryMethodLink, upsertTestMethod } from "@/lib/services/catalog/test-methods";
import { db } from "@/lib/db";

export type TestMethodImportRow = {
  code: string;
  name: string;
  categoryCode?: string;
  categoryName?: string;
  defaultMethodCode?: string;
  defaultUnit?: string;
  lod?: string;
};

export type TestMethodImportResult = {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
};

async function resolveCategoryId(categoryCode?: string, categoryName?: string) {
  const code = categoryCode?.trim();
  const name = categoryName?.trim();
  if (code) {
    const byCode = await db.testCategory.findUnique({ where: { code } });
    if (byCode) return byCode.id;
  }
  if (name) {
    const byName = await db.testCategory.findFirst({ where: { name } });
    if (byName) return byName.id;
  }
  return null;
}

async function resolveDefaultMethodId(methodCode?: string) {
  const code = methodCode?.trim();
  if (!code) return null;
  const method = await db.analyticalMethod.findFirst({ where: { methodCode: code } });
  return method?.id ?? null;
}

export async function importTestMethodCatalog(rows: TestMethodImportRow[]): Promise<TestMethodImportResult> {
  const result: TestMethodImportResult = { created: 0, updated: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 2;
    const code = row.code?.trim();
    const name = row.name?.trim();

    if (!code || !name) {
      result.errors.push({ row: line, message: "Thiếu mã hoặc tên chỉ tiêu" });
      continue;
    }

    const categoryId = await resolveCategoryId(row.categoryCode, row.categoryName);
    if (!categoryId) {
      result.errors.push({
        row: line,
        message: "Không tìm thấy nhóm chỉ tiêu (cần categoryCode hoặc categoryName hợp lệ)",
      });
      continue;
    }

    try {
      const defaultMethodCode = row.defaultMethodCode?.trim();
      const defaultMethodId = defaultMethodCode
        ? await resolveDefaultMethodId(defaultMethodCode)
        : null;

      const existing = await db.testMethod.findUnique({ where: { code } });

      const saved = await upsertTestMethod({
        id: existing?.id,
        code,
        name,
        categoryId,
        defaultUnit: row.defaultUnit?.trim() ?? "",
        lod: row.lod?.trim() ?? "",
        active: true,
      });

      if (defaultMethodId) {
        await syncPrimaryMethodLink(
          saved.id,
          defaultMethodId,
          row.defaultUnit?.trim(),
          row.lod?.trim(),
        );
      }

      if (existing?.deletedAt) {
        await db.testMethod.update({
          where: { id: existing.id },
          data: { deletedAt: null, active: true },
        });
      }

      if (existing) result.updated++;
      else result.created++;
    } catch (e) {
      result.errors.push({
        row: line,
        message: e instanceof Error ? e.message : "Lỗi không xác định",
      });
    }
  }

  return result;
}
