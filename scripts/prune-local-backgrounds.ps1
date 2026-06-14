$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$DistDir = Join-Path $RootDir "frontend\dist"
$Options = $env:VITE_LAUNCHER_BACKGROUND_OPTIONS

if ([string]::IsNullOrWhiteSpace($Options)) {
    return
}

if (-not (Test-Path -LiteralPath $DistDir)) {
    return
}

$ResolvedDist = (Resolve-Path -LiteralPath $DistDir).Path
if (-not $ResolvedDist.StartsWith($RootDir, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Resolved dist path is outside the project root: $ResolvedDist"
}

$Keep = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

function Add-BackgroundKeep {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return
    }

    $Clean = $Value.Trim().Trim('"').Trim("'")
    if ($Clean -match '^(https?:|data:)' ) {
        return
    }

    $Clean = $Clean.Replace('\', '/').TrimStart('.', '/')
    $Name = [System.IO.Path]::GetFileName($Clean)
    if (-not [string]::IsNullOrWhiteSpace($Name)) {
        [void]$Keep.Add($Name)
    }
}

foreach ($Item in ($Options -split ',')) {
    Add-BackgroundKeep $Item
}

Add-BackgroundKeep $env:VITE_LAUNCHER_DEFAULT_BACKGROUND
Add-BackgroundKeep $env:VITE_LAUNCHER_STARRAIL_BACKGROUND
Add-BackgroundKeep $env:VITE_LAUNCHER_GENSHIN_BACKGROUND

if ($Keep.Count -eq 0) {
    return
}

Get-ChildItem -LiteralPath $ResolvedDist -File |
    Where-Object { $_.Name -match '^bg-.+\.(jpg|jpeg|png|webp|gif)$' } |
    Where-Object { -not $Keep.Contains($_.Name) } |
    ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force }
