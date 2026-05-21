param(
    [switch] $PushSupabase,
    [switch] $CheckSupabase,
    [string] $Project,
    [ValidateRange(1, 20)]
    [int] $Datanodes = 2
)

$ErrorActionPreference = "Stop"
$env:COMPOSE_MENU = "false"

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

function Show-Step {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Number,
        [Parameter(Mandatory = $true)]
        [string] $Title,
        [Parameter(Mandatory = $true)]
        [string] $Role
    )

    Write-Host ""
    Write-Host "=== Etape $Number - $Title ==="
    Write-Host "Role: $Role"
}

function Show-Result {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Message
    )

    Write-Host "[OK] $Message"
}

function Show-Verify {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Command,
        [Parameter(Mandatory = $true)]
        [string] $Expected
    )

    Write-Host "Verification: $Command"
    Write-Host "Resultat attendu: $Expected"
}

Write-Host "=== SkillBridge full terminal Big Data lab ==="
Write-Host "This script runs: catalog -> optional Supabase -> mirror -> Sqoop -> Flume -> Hive -> MapReduce -> Python -> HBase."
Write-Host "HDFS DataNodes requested: $Datanodes"
$script:PythonExe = Resolve-Python
Write-Host "Python executable: $script:PythonExe"

Show-Step "0" "Verification des prerequis" "Verifier Docker, Python 3.10, Maven et les chemins des datasets ZIP."
& .\scripts\00_check_prereqs.ps1
Show-Result "Les prerequis locaux ont ete verifies."

Show-Step "1" "Build du catalogue unifie" "Nettoyage et fusion des datasets ZIP en CSV propres."
Run-Python -m pip install --upgrade pip setuptools wheel
Run-Python -m pip install -r requirements.txt
Run-Python .\scripts\12_merge_and_enrich_catalog.py
Show-Result "Le catalogue unifie est genere dans output/catalog."
Show-Verify "Get-Content .\output\catalog\catalog_build_report.json" "Le rapport contient les counts sources et finaux."

if ($PushSupabase) {
    Show-Step "2" "Upsert Supabase" "Enrichir la base applicative officielle sans supprimer les tables non catalogue."
    Run-Python .\scripts\13_push_catalog_to_supabase.py --apply
    Show-Result "Supabase a ete mis a jour via upsert safe."
} elseif ($CheckSupabase) {
    Show-Step "2" "Dry-run Supabase" "Verifier ce qui serait ecrit dans Supabase sans mutation."
    Run-Python .\scripts\13_push_catalog_to_supabase.py
    Show-Result "Le dry-run Supabase est termine sans ecriture."
} else {
    Show-Step "2" "Supabase ignore" "Executer le lab Big Data en mode local sans connexion Supabase."
    Write-Host "Supabase dry-run skipped. Use -CheckSupabase for dry-run or -PushSupabase for real upsert."
    Show-Result "Le lab continue avec le catalogue local et le PostgreSQL mirror."
}
if ($PushSupabase -or $CheckSupabase) {
    Show-Verify "Get-Content .\output\catalog\supabase_import_report.json" "Le rapport indique les tables touchees et les tables non touchees."
}

Show-Step "3" "Pipeline Big Data terminal" "Executer miroir PostgreSQL, Sqoop, Flume, Hive, MapReduce, Python et HBase."
powershell -ExecutionPolicy Bypass -File .\scripts\10_run_mvp_pipeline.ps1 -Datanodes $Datanodes
Show-Result "Le pipeline Big Data terminal est termine."
Show-Verify "Get-Content .\output\bigdata-summary.json" "Le resume final du pipeline est disponible."

Show-Step "4" "Recommendation terminale" "Tester le flux projet -> skills -> cours recommandes sans frontend."
if (-not $Project) {
    Write-Host ""
    $Project = Read-Host "Entre le nom ou la description de ton projet"
}
Run-Python .\scripts\15_run_project_recommendation.py --project $Project --limit 5
Show-Result "La CLI de recommandation a produit des cours recommandes."
Show-Verify "Get-Content .\output\recommendation_result.json" "Le JSON contient detected_skills, matched_categories et recommendations."

$summary = [ordered]@{
    catalog_report = "output/catalog/catalog_build_report.json"
    supabase_report = "output/catalog/supabase_import_report.json"
    mirror_report = "output/mirror_seed_report.json"
    bigdata_summary = "output/bigdata-summary.json"
    recommendation_result = "output/recommendation_result.json"
    supabase_apply_enabled = [bool]$PushSupabase
    supabase_check_enabled = [bool]$CheckSupabase
    datanodes_requested = $Datanodes
}

$summaryPath = ".\output\final-lab-summary.json"
$summary | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $summaryPath -Encoding UTF8

Write-Host ""
Write-Host "Final lab summary:"
Get-Content -LiteralPath $summaryPath
Show-Result "Le resume final du lab est disponible dans output/final-lab-summary.json."
