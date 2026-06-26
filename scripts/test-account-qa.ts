/**
 * QA account feature — profile fields, avatarUrl column, password hash.
 * Run: npx tsx scripts/test-account-qa.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";
import { hashPassword, verifyPassword } from "../lib/auth/password";
import { db } from "../lib/db";

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

async function assertLocalAvatarUrlColumn() {
  const admin = await db.user.findFirst({
    where: { email: "smartai0101@gmail.com" },
    select: { id: true, name: true, avatarUrl: true, passwordHash: true },
  });
  if (!admin) throw new Error("Admin user not found in local DB");
  if (typeof admin.avatarUrl !== "string") throw new Error("avatarUrl not string");
  console.log("OK local: User.avatarUrl column readable");
  return admin;
}

async function assertTursoAvatarUrlColumn() {
  loadDotEnv();
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  if (!url || !authToken) {
    console.log("SKIP Turso: no env");
    return;
  }
  const client = createClient({ url, authToken });
  try {
    const result = await client.execute(
      'SELECT avatarUrl FROM users WHERE email = ? LIMIT 1',
      ["smartai0101@gmail.com"],
    );
    if (result.rows.length === 0) throw new Error("Admin not found on Turso");
    console.log("OK Turso: avatarUrl column exists on prod DB");
  } finally {
    client.close();
  }
}

async function assertPasswordRoundTrip(adminId: string, currentHash: string) {
  const testPassword = "Admin@123456";
  const valid = await verifyPassword(testPassword, currentHash);
  if (!valid) throw new Error("Admin seed password verify failed");

  const newHash = await hashPassword("TestPass@99");
  await db.user.update({ where: { id: adminId }, data: { passwordHash: newHash } });
  const changed = await verifyPassword("TestPass@99", newHash);
  if (!changed) throw new Error("New password hash verify failed");
  await db.user.update({
    where: { id: adminId },
    data: { passwordHash: currentHash },
  });
  console.log("OK local: password hash update + restore");
}

async function assertProfileUpdate(adminId: string, originalName: string) {
  const testName = "QA Account Test";
  await db.user.update({ where: { id: adminId }, data: { name: testName } });
  const updated = await db.user.findUnique({ where: { id: adminId }, select: { name: true } });
  if (updated?.name !== testName) throw new Error("Name update failed");
  await db.user.update({ where: { id: adminId }, data: { name: originalName } });
  console.log("OK local: profile name update + restore");
}

async function main() {
  const admin = await assertLocalAvatarUrlColumn();
  await assertProfileUpdate(admin.id, admin.name);
  await assertPasswordRoundTrip(admin.id, admin.passwordHash);
  await assertTursoAvatarUrlColumn();
  console.log("\nAll account QA checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
