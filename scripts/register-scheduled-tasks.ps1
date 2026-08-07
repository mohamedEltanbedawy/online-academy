param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"
$appDir = Join-Path $ProjectRoot "app"
$backup = Join-Path $ProjectRoot "scripts\backup-db.ps1"
$billing = Join-Path $appDir "prisma\generate-nursery-invoices.ts"
$node = (Get-Command node.exe).Source
$tsx = Join-Path $appDir "node_modules\.bin\tsx.cmd"

schtasks /Create /TN "OnlineAcademy-DatabaseBackup" /SC DAILY /ST 03:00 /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$backup`"" /F
schtasks /Create /TN "OnlineAcademy-NurseryBilling" /SC DAILY /ST 03:10 /TR "`"$tsx`" `"$billing`"" /F
Write-Output "Scheduled tasks registered. Run PowerShell as Administrator if Windows requests elevation."
