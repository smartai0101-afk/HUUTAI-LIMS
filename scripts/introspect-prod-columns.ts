import { db } from "@/lib/db";

async function main() {
  for (const table of ["PreparedChemical", "PreparedStandard", "PreparedStrain"]) {
    const rs = await db.$queryRawUnsafe<Array<{ name: string }>>(
      `PRAGMA table_info("${table}")`,
    );
    const cols = rs.map((r) => r.name);
    console.log(`\n${table}:`, cols.join(", "));
  }
  for (const table of ["PreparationHistory", "PreparationAuditLog"]) {
    const rs = await db.$queryRawUnsafe<Array<{ name: string }>>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`,
    );
    console.log(`\n${table} exists:`, rs.length > 0);
  }
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
