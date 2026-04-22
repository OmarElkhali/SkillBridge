param(
    [switch] $Apply
)

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

Write-Host "=== SkillBridge Supabase catalog import ==="

if (-not (Test-Path ".\output\catalog\courses_staging.csv")) {
    Write-Host "Catalog output not found. Building it first."
    Run-Native python .\scripts\12_merge_and_enrich_catalog.py
}

Run-Native python -m pip install -r requirements.txt

if ($Apply) {
    Write-Host "Running real Supabase upsert. Only catalog tables are touched."
    Run-Native python .\scripts\13_push_catalog_to_supabase.py --apply
} else {
    Write-Host "Running dry-run. No Supabase data will be changed."
    Run-Native python .\scripts\13_push_catalog_to_supabase.py
}

Write-Host "Import report:"
Get-Content -LiteralPath ".\output\catalog\supabase_import_report.json"

