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

function Resolve-Python {
    if (Get-Command py -ErrorAction SilentlyContinue) {
        $candidate = (& py -3.10 -c "import sys; print(sys.executable)" 2>$null)
        if ($LASTEXITCODE -eq 0 -and $candidate) {
            return $candidate.Trim()
        }
    }
    return "python"
}

function Run-Python {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]] $Arguments
    )
    Run-Native $script:PythonExe @Arguments
}

$script:PythonExe = Resolve-Python
Write-Host "=== SkillBridge Supabase catalog import ==="
Write-Host "Python executable: $script:PythonExe"

if (-not (Test-Path ".\output\catalog\courses_staging.csv")) {
    Write-Host "Catalog output not found. Building it first."
    Run-Python .\scripts\12_merge_and_enrich_catalog.py
}

Run-Python -m pip install --upgrade pip setuptools wheel
Run-Python -m pip install -r requirements.txt

if ($Apply) {
    Write-Host "Running real Supabase upsert. Only catalog tables are touched."
    Run-Python .\scripts\13_push_catalog_to_supabase.py --apply
} else {
    Write-Host "Running dry-run. No Supabase data will be changed."
    Run-Python .\scripts\13_push_catalog_to_supabase.py
}

Write-Host "Import report:"
Get-Content -LiteralPath ".\output\catalog\supabase_import_report.json"

