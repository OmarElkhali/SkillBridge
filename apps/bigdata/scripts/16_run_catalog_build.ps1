$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Run-Native {
    param(
        [Parameter(Mandatory = $true)]
        [string] $FilePath,
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]] $Arguments
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $($Arguments -join ' ')"
    }
}

Write-Host "=== SkillBridge catalog build ==="
Write-Host "1) Installing Python dependencies"
Run-Native python -m pip install -r requirements.txt

Write-Host "2) Building unified catalog from ZIP datasets"
Run-Native python .\scripts\12_merge_and_enrich_catalog.py

Write-Host "3) Catalog report"
Get-Content -LiteralPath ".\output\catalog\catalog_build_report.json"

