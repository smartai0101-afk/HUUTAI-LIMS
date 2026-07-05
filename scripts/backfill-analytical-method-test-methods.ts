/**
 * Backfill analytical_method_test_methods for methods missing junction links.
 * Matches legacy analyte text tokens to test_methods by code or name.
 *
 * Usage: npx tsx scripts/backfill-analytical-method-test-methods.ts
 */
import { randomUUID } from "crypto";
import { buildAnalyteCache } from "../lib/catalog/test-method-label";
import { db } from "../lib/db";

function tokenizeAnalyte(analyte: string): string[] {
  return analyte
    .split(/[,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

async function main() {
  const testMethods = await db.testMethod.findMany({
    where: { active: true, deletedAt: null },
    select: { id: true, code: true, name: true, category: { select: { name: true } } },
  });

  const byCode = new Map(testMethods.map((t) => [t.code.toUpperCase(), t]));
  const byName = new Map(testMethods.map((t) => [t.name.toLowerCase(), t]));

  const methods = await db.analyticalMethod.findMany({
    select: {
      id: true,
      methodCode: true,
      analyte: true,
      methodTestMethods: { select: { testMethodId: true } },
    },
  });

  let linked = 0;
  let skipped = 0;
  let cacheUpdated = 0;

  for (const method of methods) {
    if (method.methodTestMethods.length > 0) {
      skipped += 1;
      continue;
    }

    const tokens = tokenizeAnalyte(method.analyte);
    const matched = new Map<string, (typeof testMethods)[number]>();

    for (const token of tokens) {
      const upper = token.toUpperCase();
      const lower = token.toLowerCase();
      const hit = byCode.get(upper) ?? byName.get(lower);
      if (hit) matched.set(hit.id, hit);
    }

    if (matched.size === 0) {
      console.warn(`  Skip ${method.methodCode}: no test method match for "${method.analyte}"`);
      skipped += 1;
      continue;
    }

    const rows = [...matched.values()];
    for (const tm of rows) {
      await db.analyticalMethodTestMethod.upsert({
        where: {
          methodId_testMethodId: { methodId: method.id, testMethodId: tm.id },
        },
        create: { id: randomUUID(), methodId: method.id, testMethodId: tm.id },
        update: {},
      });
      linked += 1;
    }

    const analyteCache = buildAnalyteCache(
      rows.map((t) => ({ ...t, categoryName: t.category.name })),
    );
    await db.analyticalMethod.update({
      where: { id: method.id },
      data: { analyte: analyteCache },
    });
    cacheUpdated += 1;
    console.log(`  Linked ${method.methodCode} → ${rows.map((t) => t.code).join(", ")}`);
  }

  console.log(
    `Done: ${linked} link(s), ${cacheUpdated} analyte cache(s) updated, ${skipped} method(s) unchanged/skipped.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
