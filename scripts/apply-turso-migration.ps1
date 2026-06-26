# Apply a Prisma migration SQL file to Turso. Run from repo root.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$migration = $args[0]
if (-not $migration) {
    Write-Host "Usage: .\scripts\apply-turso-migration.ps1 prisma/migrations/.../migration.sql"
    exit 1
}

Get-Content ".env" | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($Matches[1], $Matches[2].Trim().Trim('"'), "Process")
    }
}

npx tsx scripts/apply-turso-migration.ts $migration
