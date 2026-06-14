$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$OutputPath = Join-Path $RootDir "internal\buildconfig\local.json"

$config = [ordered]@{}

$appName = if ($env:VITE_LAUNCHER_APP_NAME) { $env:VITE_LAUNCHER_APP_NAME } else { $env:LAUNCHER_BUILD_APP_NAME }
if ($appName) {
    $config.launcher_app_name = $appName
}

if ($env:LAUNCHER_VERSION) {
    $config.launcher_version = $env:LAUNCHER_VERSION
}

if ($env:LAUNCHER_UPDATE_REPO) {
    $config.launcher_update_repo = $env:LAUNCHER_UPDATE_REPO
}

if ($env:LAUNCHER_UPDATE_RELEASES_URL) {
    $config.launcher_update_releases_url = $env:LAUNCHER_UPDATE_RELEASES_URL
}

if ($env:LAUNCHER_UPDATE_ASSET_NAME) {
    $config.launcher_update_asset_name = $env:LAUNCHER_UPDATE_ASSET_NAME
} elseif (($env:LAUNCHER_UPDATE_REPO -or $env:LAUNCHER_UPDATE_RELEASES_URL) -and $env:LAUNCHER_BUILD_EXE_NAME) {
    $assetBaseName = ($env:LAUNCHER_BUILD_EXE_NAME.Trim() -replace '\s+', '.')
    $config.launcher_update_asset_name = "$assetBaseName.exe"
}

if ($config.Count -eq 0) {
    if (Test-Path -LiteralPath $OutputPath) {
        Remove-Item -LiteralPath $OutputPath -Force
    }
    return
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutputPath) | Out-Null
$json = $config | ConvertTo-Json
$encoding = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($OutputPath, $json, $encoding)
