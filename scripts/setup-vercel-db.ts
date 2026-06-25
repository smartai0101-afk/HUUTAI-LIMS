/**
 * Push schema + seed to remote Turso DB.
 *
 * Prisma CLI only accepts file: for sqlite provider — schema is applied via
 * `prisma migrate diff` SQL + @libsql/client, then seed uses lib/db (Turso adapter).
 *
 * Prerequisites: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN in .env
 * Run: npx tsx scripts/setup-vercel-db.ts
 */
import { execSync } from "node:child_process";
import { createClient } from "@libsql/client";
import { isRemoteDatabase } from "../lib/db";

function requireRemoteEnv() {
  if (!isRemoteDatabase()) {
    console.error(
      "Missing Turso config. Set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN in .env",
    );
    process.exit(1);
  }
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) {
    console.warn("Warning: SESSION_SECRET not set (needed on Vercel, not for db push).");
  }
}

async function main() {
  requireRemoteEnv();

  const url = process.env.TURSO_DATABASE_URL!.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN!.trim();

  console.log("Generating schema SQL from prisma/schema.prisma...");
  const sql = execSync(
    "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
    {
      encoding: "utf-8",
      env: { ...process.env, DATABASE_URL: "file:./dev.db" },
    },
  ).trim();

  if (!sql) {
    console.error("No SQL generated — check prisma/schema.prisma");
    process.exit(1);
  }

  console.log("Applying schema to Turso...");
  const client = createClient({ url, authToken });
  try {
    await client.executeMultiple(sql);
  } finally {
    client.close();
  }

  console.log("Seeding remote database...");
  execSync("npx tsx prisma/seed.ts", {
    stdio: "inherit",
    env: process.env,
  });

  console.log("Done. Set TURSO_* + SESSION_SECRET on Vercel and redeploy.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
