param(
  [string]$OutputDir = "backups"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"
$envText = Get-Content -LiteralPath $envFile -Raw
$user = ([regex]::Match($envText, "(?m)^POSTGRES_USER=(.+)$")).Groups[1].Value.Trim()
$db = ([regex]::Match($envText, "(?m)^POSTGRES_DB=(.+)$")).Groups[1].Value.Trim()
if (-not $user -or -not $db) { throw "POSTGRES_USER or POSTGRES_DB is missing from .env" }

$targetDir = Join-Path $root $OutputDir
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
$file = Join-Path $targetDir ("academy-{0}.sql" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
docker exec academy-postgres pg_dump -U $user -d $db | Set-Content -LiteralPath $file -Encoding UTF8
Write-Output "Backup created: $file"
