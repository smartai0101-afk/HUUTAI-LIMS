# Set Turso env on Vercel from .env (values not printed)
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$vars = @{}
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
        $vars[$Matches[1]] = $Matches[2].Trim().Trim('"')
    }
}

$names = @("TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN", "SESSION_SECRET")
foreach ($name in $names) {
    if (-not $vars[$name]) {
        Write-Host "Missing $name in .env" -ForegroundColor Red
        exit 1
    }
}

function Set-VercelEnv {
    param([string]$Name, [string]$Value)
    foreach ($envName in @("production", "preview")) {
        npx vercel env add $Name $envName --value $Value --force --yes --sensitive 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to set $Name for $envName" -ForegroundColor Red
            exit 1
        }
        Write-Host "Set $Name ($envName)" -ForegroundColor Green
    }
}

Set-VercelEnv "TURSO_DATABASE_URL" $vars["TURSO_DATABASE_URL"]
Set-VercelEnv "TURSO_AUTH_TOKEN" $vars["TURSO_AUTH_TOKEN"]
Set-VercelEnv "SESSION_SECRET" $vars["SESSION_SECRET"]

Write-Host ""
Write-Host "Done. Run: npx vercel --prod" -ForegroundColor Cyan
