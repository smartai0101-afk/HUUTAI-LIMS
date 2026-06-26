/**
 * Apply a single migration SQL file to Turso (libSQL).
 * Usage: npx tsx scripts/apply-turso-migration.ts prisma/migrations/20260625_user_avatar/migration.sql
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";

function loadDotEnv() {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadDotEnv();
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npx tsx scripts/apply-turso-migration.ts <migration.sql>");
    process.exit(1);
  }

  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (!url || !authToken) {
    console.error("Set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN in .env");
    process.exit(1);
  }

  const sql = readFileSync(file, "utf-8").trim();
  if (!sql) {
    console.error("Migration file is empty");
    process.exit(1);
  }

  console.log(`Applying ${file} to ${url}...`);
  const client = createClient({ url, authToken });
  try {
    await client.executeMultiple(sql);
    console.log("OK");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("duplicate column") || message.includes("already exists")) {
      console.log("Column already exists — skipping");
    } else {
      throw error;
    }
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
