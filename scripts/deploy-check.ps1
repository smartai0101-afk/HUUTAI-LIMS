# Deploy env check — run from repo root: .\scripts\deploy-check.ps1

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host ""
Write-Host "=== Lab Inventory LIMS - Deploy check ===" -ForegroundColor Cyan
Write-Host ""

$envFile = Join-Path (Get-Location) ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "FAIL: .env not found - copy from .env.example" -ForegroundColor Red
    exit 1
}

$vars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
        $vars[$Matches[1]] = $Matches[2].Trim().Trim('"')
    }
}

$ok = $true

if (-not $vars["TURSO_DATABASE_URL"] -or $vars["TURSO_DATABASE_URL"] -notmatch '^libsql://') {
    Write-Host "FAIL: TURSO_DATABASE_URL missing (need libsql://...)" -ForegroundColor Red
    $ok = $false
} else {
    Write-Host "OK: TURSO_DATABASE_URL" -ForegroundColor Green
}

if (-not $vars["TURSO_AUTH_TOKEN"] -or $vars["TURSO_AUTH_TOKEN"].Length -lt 10) {
    Write-Host "FAIL: TURSO_AUTH_TOKEN missing" -ForegroundColor Red
    $ok = $false
} else {
    Write-Host "OK: TURSO_AUTH_TOKEN" -ForegroundColor Green
}

$dbUrl = $vars["DATABASE_URL"]
if ($dbUrl -and $dbUrl -notmatch '^libsql://') {
    Write-Host "WARN: DATABASE_URL is local SQLite - use libsql URL for remote setup" -ForegroundColor Yellow
} elseif ($dbUrl -match '^libsql://') {
    Write-Host "OK: DATABASE_URL (libsql)" -ForegroundColor Green
} else {
    Write-Host "INFO: DATABASE_URL will be built from TURSO vars in db:setup-remote" -ForegroundColor Gray
}

$secret = $vars["SESSION_SECRET"]
if (-not $secret -or $secret.Length -lt 16 -or $secret -eq "change-me-to-random-string-at-least-32-chars") {
    Write-Host "FAIL: SESSION_SECRET missing (min 16 chars)" -ForegroundColor Red
    $ok = $false
} else {
    Write-Host "OK: SESSION_SECRET" -ForegroundColor Green
}

Write-Host ""
if (-not $ok) {
    Write-Host "Fix .env per DEPLOY.md step 2, then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "Env ready. Next:" -ForegroundColor Green
Write-Host "  1. npm run db:setup-remote"
Write-Host "  2. Set same env vars on Vercel Dashboard"
Write-Host "  3. Deploy or Redeploy"
Write-Host "  See DEPLOY.md for details."
Write-Host ""
