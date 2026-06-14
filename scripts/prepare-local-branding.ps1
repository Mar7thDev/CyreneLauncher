$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$DefaultIconSource = Join-Path $RootDir ".local\branding\appicon.png"
$IconSource = if ($env:LAUNCHER_BUILD_ICON) { $env:LAUNCHER_BUILD_ICON } else { $DefaultIconSource }

if (-not (Test-Path -LiteralPath $IconSource)) {
    return
}

$PublicIcon = Join-Path $RootDir "frontend\public\local-appicon.png"
$EmbeddedIcon = Join-Path $RootDir "assets\local-appicon.png"
$LocalWindowsDir = Join-Path $RootDir ".local\branding\windows"
$LocalDarwinDir = Join-Path $RootDir ".local\branding\darwin"
$LocalWindowsIcon = Join-Path $LocalWindowsDir "icon.ico"
$LocalDarwinIcon = Join-Path $LocalDarwinDir "icons.icns"

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $PublicIcon), (Split-Path -Parent $EmbeddedIcon), $LocalWindowsDir, $LocalDarwinDir | Out-Null
Copy-Item -LiteralPath $IconSource -Destination $PublicIcon -Force
Copy-Item -LiteralPath $IconSource -Destination $EmbeddedIcon -Force

$shouldGenerate = -not (Test-Path -LiteralPath $LocalWindowsIcon)
if (-not $shouldGenerate) {
    $shouldGenerate = (Get-Item -LiteralPath $IconSource).LastWriteTimeUtc -gt (Get-Item -LiteralPath $LocalWindowsIcon).LastWriteTimeUtc
}

if ($shouldGenerate) {
    wails3 generate icons -input $IconSource -macfilename $LocalDarwinIcon -windowsfilename $LocalWindowsIcon
}
