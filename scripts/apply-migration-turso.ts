/**
 * Apply a migration SQL file to Turso prod via lib/db.ts (not local DATABASE_URL=file:).
 * Idempotent: skips duplicate column / table errors.
 *
 * Usage:
 *   $env:NODE_ENV="production"; npx tsx scripts/apply-migration-turso.ts prisma/migrations/20260627_preparation_iso/migration.sql
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { db } from "@/lib/db";

function splitStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((s) => s.replace(/--[^\n]*/g, "").trim())
    .filter(Boolean);
}

function isIgnorableError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("duplicate column") ||
    lower.includes("already exists") ||
    lower.includes("duplicate index")
  );
}

async function main() {
  const rel = process.argv[2];
  if (!rel) {
    console.error("Usage: npx tsx scripts/apply-migration-turso.ts <migration.sql>");
    process.exit(1);
  }
  const path = resolve(process.cwd(), rel);
  const sql = readFileSync(path, "utf8");
  const statements = splitStatements(sql);
  let applied = 0;
  let skipped = 0;

  for (const stmt of statements) {
    try {
      await db.$executeRawUnsafe(stmt);
      applied++;
      console.log("OK:", stmt.slice(0, 80).replace(/\s+/g, " "));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (isIgnorableError(msg)) {
        skipped++;
        console.log("SKIP:", msg.split("\n")[0]);
      } else {
        console.error("FAIL:", stmt.slice(0, 120));
        throw e;
      }
    }
  }

  console.log(`Done: ${applied} applied, ${skipped} skipped (${statements.length} total)`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
