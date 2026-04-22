$ErrorActionPreference = "Stop"

function Test-Command($Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing command: $Name"
    }
    Write-Host "OK: $Name"
}

Test-Command docker
Test-Command python

if (-not (Test-Path -LiteralPath "C:\Users\omare\Downloads\archive (1).zip")) {
    throw "Missing dataset archive: C:\Users\omare\Downloads\archive (1).zip"
}

Write-Host "OK: main dataset archive found"

$repoRoot = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\..\..")
if (Get-Command mvn -ErrorAction SilentlyContinue) {
    Write-Host "OK: mvn"
} elseif (Test-Path -LiteralPath (Join-Path $repoRoot "mvnw.cmd")) {
    Write-Host "OK: Maven wrapper found"
} else {
    throw "Missing Maven. Install mvn or keep mvnw.cmd at the repository root."
}
