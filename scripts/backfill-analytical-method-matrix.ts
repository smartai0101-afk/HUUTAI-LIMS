/**
 * Backfill analytical_method_matrices for methods missing junction links.
 * Handles DBs that still have matrixId column (pre-20260718) or methods with no links.
 *
 * Usage: npx tsx scripts/backfill-analytical-method-matrix.ts
 */
import { randomUUID } from "crypto";
import { db } from "../lib/db";

function inferMatrixCodes(methodCode: string): string[] {
  const c = methodCode.toUpperCase();
  if (c.includes("ICP") || c.includes("WAT")) return ["WATER"];
  if (c.includes("LCMS") || c.includes("PEST")) return ["FOOD-VEG"];
  return [];
}

async function main() {
  const matrices = await db.sampleMatrix.findMany({
    where: { deletedAt: null },
    select: { id: true, code: true },
  });
  const byCode = new Map(matrices.map((m) => [m.code.toUpperCase(), m.id]));

  const methods = await db.analyticalMethod.findMany({
    select: {
      id: true,
      methodCode: true,
      methodMatrices: { select: { matrixId: true } },
    },
  });

  let inserted = 0;
  let skipped = 0;

  for (const method of methods) {
    if (method.methodMatrices.length > 0) {
      skipped += 1;
      continue;
    }

    const codes = inferMatrixCodes(method.methodCode);
    const matrixIds = codes
      .map((code) => byCode.get(code))
      .filter((id): id is string => Boolean(id));

    if (matrixIds.length === 0) {
      console.warn(`  Skip ${method.methodCode}: no matrix mapping`);
      skipped += 1;
      continue;
    }

    for (const matrixId of matrixIds) {
      await db.analyticalMethodMatrix.upsert({
        where: {
          methodId_matrixId: { methodId: method.id, matrixId },
        },
        create: { id: randomUUID(), methodId: method.id, matrixId },
        update: {},
      });
      inserted += 1;
    }
    console.log(`  Linked ${method.methodCode} → ${codes.join(", ")}`);
  }

  console.log(`Done: ${inserted} link(s) inserted, ${skipped} method(s) unchanged/skipped.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
