/**
 * Phase 0: inventory of business codes in the local database.
 * Usage: npx tsx scripts/scan-codes.ts
 */
import { writeFileSync } from "fs";
import { join } from "path";
import { db } from "@/lib/db";

async function main() {
  const [chem, std, strains, pc, ps, pstr] = await Promise.all([
    db.chemical.findMany({ select: { id: true, code: true }, orderBy: { code: "asc" } }),
    db.standard.findMany({ select: { id: true, code: true, standardGroup: true }, orderBy: { code: "asc" } }),
    db.microbialStrain.findMany({ select: { id: true, code: true }, orderBy: { code: "asc" } }),
    db.preparedChemical.findMany({
      select: { id: true, code: true, parentCode: true, batchNumber: true, deletedAt: true },
      orderBy: { code: "asc" },
    }),
    db.preparedStandard.findMany({
      select: { id: true, code: true, parentCode: true, batchNumber: true, level: true, deletedAt: true },
      orderBy: { code: "asc" },
    }),
    db.preparedStrain.findMany({
      select: { id: true, code: true, parentCode: true, batchNumber: true, deletedAt: true },
      orderBy: { code: "asc" },
    }),
  ]);

  const report = {
    scannedAt: new Date().toISOString(),
    counts: {
      chemicals: chem.length,
      standards: std.length,
      strains: strains.length,
      preparedChemicals: pc.length,
      preparedStandards: ps.length,
      preparedStrains: pstr.length,
    },
    msStrains: strains.filter((s) => s.code.startsWith("MS-")),
    preparedParentCodes: {
      chemical: [...new Set(pc.map((r) => r.parentCode))],
      standard: [...new Set(ps.map((r) => r.parentCode))],
      strain: [...new Set(pstr.map((r) => r.parentCode))],
    },
    chemicals: chem,
    standards: std,
    strains,
    preparedChemicals: pc,
    preparedStandards: ps,
    preparedStrains: pstr,
  };

  const outPath = join(process.cwd(), "scripts", "code-scan-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`Wrote ${outPath}`);
  console.log("Counts:", report.counts);
  console.log("MS strains:", report.msStrains.length);
  console.log("Prepared parent codes (std):", report.preparedParentCodes.standard);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
