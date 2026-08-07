param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envText = Get-Content -LiteralPath (Join-Path $root ".env") -Raw
$user = ([regex]::Match($envText, "(?m)^POSTGRES_USER=(.+)$")).Groups[1].Value.Trim()
$db = ([regex]::Match($envText, "(?m)^POSTGRES_DB=(.+)$")).Groups[1].Value.Trim()
if (-not (Test-Path -LiteralPath $BackupFile)) { throw "Backup file does not exist: $BackupFile" }
Get-Content -LiteralPath $BackupFile -Raw | docker exec -i academy-postgres psql -U $user -d $db
Write-Output "Backup restored: $BackupFile"
