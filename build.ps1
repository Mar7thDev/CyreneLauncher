#!/usr/bin/env pwsh
# build.ps1 — interactive build helper for CyreneLauncher

$ErrorActionPreference = "Stop"

$AppName = "cyrene-launcher"
$BinDir  = "bin"
$OutExe  = "$BinDir\$AppName.exe"

# ── Mode selection ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "  Cyrene Launcher — Build" -ForegroundColor Magenta
Write-Host ""
Write-Host "  [1] Dev    — fast build, no optimisation"
Write-Host "  [2] Prod   — trimpath + windowsgui, production tags"
Write-Host "  [3] Run    — dev build, then launch"
Write-Host ""

$choice = Read-Host "Select (1/2/3)"
switch ($choice) {
    "1" { $Prod = $false; $Run = $false }
    "2" { $Prod = $true;  $Run = $false }
    "3" { $Prod = $false; $Run = $true  }
    default { Write-Host "Invalid choice. Exiting." -ForegroundColor Red; exit 1 }
}

Write-Host ""

# ── 1. Frontend ────────────────────────────────────────────────────────────────
Write-Host ">> Frontend" -ForegroundColor Cyan
Push-Location frontend
try {
    if (-not (Test-Path node_modules)) {
        Write-Host "   Installing deps..." -ForegroundColor DarkGray
        npm install --silent
        if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    }
    npm run build --silent
    if ($LASTEXITCODE -ne 0) { throw "npm build failed" }
    Write-Host "   Done." -ForegroundColor DarkGray
} finally { Pop-Location }

# ── 2. Syso ────────────────────────────────────────────────────────────────────
Write-Host ">> Syso" -ForegroundColor Cyan
Push-Location build
try {
    wails3 generate syso -arch amd64 -icon windows/icon.ico `
        -manifest windows/wails.exe.manifest `
        -info windows/info.json `
        -out ../wails_windows_amd64.syso
    if ($LASTEXITCODE -ne 0) { throw "syso generation failed" }
    Write-Host "   Done." -ForegroundColor DarkGray
} finally { Pop-Location }

# ── 3. Go build ────────────────────────────────────────────────────────────────
if (-not (Test-Path $BinDir)) { New-Item -ItemType Directory $BinDir | Out-Null }

$env:GOOS        = "windows"
$env:GOARCH      = "amd64"
$env:CGO_ENABLED = "0"

if ($Prod) {
    Write-Host ">> Go build  [production]" -ForegroundColor Cyan
    $buildFlags = "-tags production -trimpath -buildvcs=false -ldflags=`"-w -s -H windowsgui`""
} else {
    Write-Host ">> Go build  [dev]" -ForegroundColor Cyan
    $buildFlags = "-buildvcs=false -gcflags=all=`"-l`""
}

$cmd = "go build $buildFlags -o $OutExe ."
Write-Host "   $cmd" -ForegroundColor DarkGray
Invoke-Expression $cmd
if ($LASTEXITCODE -ne 0) { throw "go build failed" }

# ── 4. Cleanup ─────────────────────────────────────────────────────────────────
Remove-Item -Force *.syso -ErrorAction SilentlyContinue

$size = [math]::Round((Get-Item $OutExe).Length / 1MB, 1)
Write-Host ""
Write-Host "  OK  $OutExe  ($size MB)" -ForegroundColor Green

# ── 5. Run ─────────────────────────────────────────────────────────────────────
if ($Run) {
    Write-Host ">> Launching $OutExe..." -ForegroundColor Cyan
    & ".\$OutExe"
}
