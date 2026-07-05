# Apply LIMS workflow ISO migration to Turso production
# Usage: .\scripts\apply-lims-workflow-turso.ps1

$ErrorActionPreference = "Stop"
$migration = "prisma/migrations/20260715_lims_workflow_iso/migration.sql"

if (-not (Test-Path $migration)) {
    Write-Error "Migration file not found: $migration"
}

Write-Host "Applying LIMS workflow migration to Turso..."
$env:NODE_ENV = "production"
npx tsx scripts/apply-migration-turso.ts $migration

Write-Host "Seeding module permissions (prod)..."
npx tsx scripts/seed-module-permissions-prod.ts

Write-Host "Done."
