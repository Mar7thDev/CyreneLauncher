#!/usr/bin/env pwsh
# build.ps1 — quick build helper for CyreneLauncher
# Usage:
#   .\build.ps1           # dev build (fast, no optimisation)
#   .\build.ps1 -Prod     # production build (-trimpath -ldflags "-w -s -H windowsgui")
#   .\build.ps1 -Run      # build then launch the exe
#   .\build.ps1 -Prod -Run

param(
    [switch]$Prod,
    [switch]$Run
)

$ErrorActionPreference = "Stop"

$AppName  = "cyrene-launcher"
$BinDir   = "bin"
$OutExe   = "$BinDir\$AppName.exe"

# ── 1. Frontend ────────────────────────────────────────────────────────────────
Write-Host "→ Building frontend..." -ForegroundColor Cyan
Push-Location frontend
try {
    if (-not (Test-Path node_modules)) {
        Write-Host "  Installing deps..." -ForegroundColor DarkGray
        npm install --silent
        if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    }
    npm run build --silent
    if ($LASTEXITCODE -ne 0) { throw "npm build failed" }
} finally { Pop-Location }

# ── 2. Syso (Windows resource file) ───────────────────────────────────────────
Write-Host "→ Generating .syso..." -ForegroundColor Cyan
Push-Location build
try {
    wails3 generate syso -arch amd64 -icon windows/icon.ico `
        -manifest windows/wails.exe.manifest `
        -info windows/info.json `
        -out ../wails_windows_amd64.syso
    if ($LASTEXITCODE -ne 0) { throw "syso generation failed" }
} finally { Pop-Location }

# ── 3. Go build ────────────────────────────────────────────────────────────────
if (-not (Test-Path $BinDir)) { New-Item -ItemType Directory $BinDir | Out-Null }

if ($Prod) {
    Write-Host "→ Production build..." -ForegroundColor Cyan
    $buildFlags = "-tags production -trimpath -buildvcs=false -ldflags=`"-w -s -H windowsgui`""
} else {
    Write-Host "→ Dev build..." -ForegroundColor Cyan
    $buildFlags = "-buildvcs=false -gcflags=all=`"-l`""
}

$env:GOOS        = "windows"
$env:GOARCH      = "amd64"
$env:CGO_ENABLED = "0"

$cmd = "go build $buildFlags -o $OutExe ."
Write-Host "  $cmd" -ForegroundColor DarkGray
Invoke-Expression $cmd
if ($LASTEXITCODE -ne 0) { throw "go build failed" }

# ── 4. Cleanup ─────────────────────────────────────────────────────────────────
Remove-Item -Force *.syso -ErrorAction SilentlyContinue

$size = [math]::Round((Get-Item $OutExe).Length / 1MB, 1)
Write-Host "✓ $OutExe  ($size MB)" -ForegroundColor Green

# ── 5. Run (optional) ──────────────────────────────────────────────────────────
if ($Run) {
    Write-Host "→ Launching $OutExe..." -ForegroundColor Cyan
    & ".\$OutExe"
}
