/**
 * Push schema + seed to remote Turso DB.
 *
 * Prerequisites:
 *   1. Create database at https://turso.tech
 *   2. Set env (PowerShell example):
 *        $env:TURSO_DATABASE_URL="libsql://xxx.turso.io"
 *        $env:TURSO_AUTH_TOKEN="..."
 *        $env:DATABASE_URL="libsql://xxx.turso.io?authToken=..."
 *        $env:SESSION_SECRET="your-secret-min-32-chars"
 *   3. Run: npx tsx scripts/setup-vercel-db.ts
 */
import { execSync } from "node:child_process";
import { isRemoteDatabase } from "../lib/db";

function requireRemoteEnv() {
  if (!process.env.DATABASE_URL?.startsWith("libsql://") && process.env.TURSO_DATABASE_URL) {
    const token = encodeURIComponent(process.env.TURSO_AUTH_TOKEN ?? "");
    process.env.DATABASE_URL = `${process.env.TURSO_DATABASE_URL}?authToken=${token}`;
  }

  if (!isRemoteDatabase()) {
    console.error(
      "Missing Turso config. Set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN,",
      "or DATABASE_URL=libsql://...?authToken=...",
    );
    process.exit(1);
  }
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) {
    console.warn("Warning: SESSION_SECRET not set (needed on Vercel, not for db push).");
  }
}

requireRemoteEnv();

console.log("Pushing schema to remote database...");
execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });

console.log("Seeding remote database...");
execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });

console.log("Done. Set the same env vars on Vercel and redeploy.");
