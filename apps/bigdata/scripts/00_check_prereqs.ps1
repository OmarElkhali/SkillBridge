$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env"
if (Test-Path -LiteralPath $envFile) {
    Get-Content -LiteralPath $envFile | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) {
            return
        }
        $parts = $line.Split("=", 2)
        $name = $parts[0].Trim()
        $value = $parts[1].Trim().Trim('"').Trim("'")
        if (-not [Environment]::GetEnvironmentVariable($name, "Process")) {
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

function Test-Command($Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing command: $Name"
    }
    Write-Host "OK: $Name"
}

Test-Command docker
Test-Command python

$datasetPaths = @(
    @{ Name = "SKILLBRIDGE_DATASET_FINAL_ZIP"; Default = "C:\Users\omare\Downloads\archive (1).zip" },
    @{ Name = "SKILLBRIDGE_DATASET_ALL_COURSES_ZIP"; Default = "C:\Users\omare\Downloads\archive.zip" },
    @{ Name = "SKILLBRIDGE_DATASET_RICH_ZIP"; Default = "C:\Users\omare\Downloads\archive (2).zip" }
)

foreach ($dataset in $datasetPaths) {
    $path = [Environment]::GetEnvironmentVariable($dataset.Name, "Process")
    if (-not $path) {
        $path = $dataset.Default
    }
    if (-not (Test-Path -LiteralPath $path)) {
        throw "Missing dataset archive for $($dataset.Name): $path. Set this path in apps/bigdata/.env."
    }
    Write-Host "OK: $($dataset.Name) -> $path"
}

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\..\..")
if (Get-Command mvn -ErrorAction SilentlyContinue) {
    Write-Host "OK: mvn"
} elseif (Test-Path -LiteralPath (Join-Path $repoRoot "mvnw.cmd")) {
    Write-Host "OK: Maven wrapper found"
} else {
    throw "Missing Maven. Install mvn or keep mvnw.cmd at the repository root."
}
