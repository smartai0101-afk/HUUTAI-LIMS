# Turso production — Prepared standard prefix-by-level migration
# Run from repo root after local QA passes.
# Prerequisite: 20260706_code_standardization already applied.

# 1. Strain IST1/2/3 -> PST1/2/3 (frees IST for prepared standards)
npx tsx scripts/migrate-strain-prefix-pst.ts

# 2. Prepared standard PSTD -> IST1/2/3/WSTD by level
npx tsx scripts/migrate-prepared-standard-level-prefix.ts

# 3. Backfill snapshots and sourceCode fields
npx tsx scripts/backfill-code-snapshots-after-prefix-migration.ts

# 4. Resync CodeSequence counters
npx tsx scripts/seed-code-sequences.ts

# 5. Verify
npx tsx scripts/verify-code-migration.ts

# 6. Unit tests
npx tsx scripts/test-code-generator.ts
npx tsx scripts/test-prepared-batch-code.ts
