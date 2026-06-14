param(
    [string]$Arch = "amd64"
)

$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$LocalIcon = Join-Path $RootDir ".local\branding\windows\icon.ico"
$Icon = if (Test-Path -LiteralPath $LocalIcon) { ".local/branding/windows/icon.ico" } else { "build/windows/icon.ico" }
$Info = "build/windows/info.json"

$AppName = if ($env:VITE_LAUNCHER_APP_NAME) { $env:VITE_LAUNCHER_APP_NAME } else { $env:LAUNCHER_BUILD_APP_NAME }
$Version = $env:LAUNCHER_VERSION
if ($AppName -or $Version) {
    $LocalInfoPath = Join-Path $RootDir ".local\branding\windows\info.json"
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $LocalInfoPath) | Out-Null

    $InfoJson = Get-Content -Raw -LiteralPath (Join-Path $RootDir "build\windows\info.json") | ConvertFrom-Json
    if ($AppName) {
        $InfoJson.info."0000".FileDescription = $AppName
        $InfoJson.info."0000".ProductName = $AppName
        $InfoJson.info."0000".Comments = $AppName
    }
    if ($Version) {
        $InfoJson.fixed.file_version = $Version
        $InfoJson.info."0000".ProductVersion = $Version
    }

    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($LocalInfoPath, ($InfoJson | ConvertTo-Json -Depth 16), $encoding)
    $Info = ".local/branding/windows/info.json"
}

Push-Location $RootDir
try {
    wails3 generate syso `
        -arch $Arch `
        -icon $Icon `
        -manifest "build/windows/wails.exe.manifest" `
        -info $Info `
        -out "wails_windows_$Arch.syso"
} finally {
    Pop-Location
}
