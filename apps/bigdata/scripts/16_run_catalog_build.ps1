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
Write-Host "=== SkillBridge catalog build ==="
Write-Host "Python executable: $script:PythonExe"
Write-Host "1) Installing Python dependencies"
Run-Python -m pip install --upgrade pip setuptools wheel
Run-Python -m pip install -r requirements.txt

Write-Host "2) Building unified catalog from ZIP datasets"
Run-Python .\scripts\12_merge_and_enrich_catalog.py

Write-Host "3) Catalog report"
Get-Content -LiteralPath ".\output\catalog\catalog_build_report.json"

