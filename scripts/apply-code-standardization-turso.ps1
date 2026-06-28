# Turso production — Code Standardization migration
# Run from repo root after local QA passes.

# 1. Schema migration
npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/20260706_code_standardization/migration.sql

# 2. Backfill sequences on masters
npx tsx scripts/seed-code-sequences.ts

# 3. MS -> STR
npx tsx scripts/migrate-master-codes.ts

# 4. Prepared parent codes (CG01 -> PSTD-0001, etc.)
npx tsx scripts/migrate-prepared-codes.ts

# 5. Verify
npx tsx scripts/verify-code-migration.ts

# 6. Unit tests
npx tsx scripts/test-code-generator.ts
npx tsx scripts/test-prepared-batch-code.ts
