$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== Nettoyage runtime SkillBridge Big Data ==="
Write-Host "Ce script supprime uniquement les fichiers generes/reconstructibles."
Write-Host "Il conserve les scripts, Docker, SQL, README, et output/catalog/*.csv/*.json."
Write-Host "Supabase n'est pas touche."
Write-Host ""

$removed = New-Object System.Collections.Generic.List[string]
$kept = New-Object System.Collections.Generic.List[string]

function Remove-IfExists {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Path
    )

    if (Test-Path -LiteralPath $Path) {
        Remove-Item -LiteralPath $Path -Recurse -Force
        $removed.Add($Path)
    } else {
        $kept.Add("Absent: $Path")
    }
}

function Remove-Glob {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Pattern
    )

    $items = Get-ChildItem -Path . -Filter $Pattern -File -ErrorAction SilentlyContinue
    if ($items.Count -eq 0) {
        $kept.Add("Aucun fichier: $Pattern")
        return
    }

    foreach ($item in $items) {
        Remove-Item -LiteralPath $item.FullName -Force
        $removed.Add($item.FullName)
    }
}

Remove-Glob "*.java"
Remove-Glob "*.jar"
Remove-IfExists ".\mapreduce\target"
Remove-IfExists ".\scripts\__pycache__"
Remove-IfExists ".\data\events\events.log"

$runtimeOutputs = @(
    ".\output\bigdata-summary.json",
    ".\output\final-lab-summary.json",
    ".\output\load_course_stats.hbase",
    ".\output\mirror_seed_report.json",
    ".\output\project_skill_matches.csv",
    ".\output\recommendation_result.json"
)

foreach ($path in $runtimeOutputs) {
    Remove-IfExists $path
}

Write-Host "[OK] Nettoyage termine."
Write-Host ""
Write-Host "Fichiers/dossiers supprimes:"
if ($removed.Count -eq 0) {
    Write-Host "- Rien a supprimer."
} else {
    foreach ($item in $removed) {
        Write-Host "- $item"
    }
}

Write-Host ""
Write-Host "Fichiers conserves volontairement:"
Write-Host "- output/.gitkeep"
Write-Host "- output/catalog/*.csv"
Write-Host "- output/catalog/*.json"
Write-Host "- tous les scripts, SQL, Dockerfiles, configs et README"

Write-Host ""
Write-Host "Verification rapide:"
Write-Host "- Test-Path .\output\catalog\unified_courses.csv"
Write-Host "- powershell -ExecutionPolicy Bypass -File .\scripts\18_run_full_terminal_lab.ps1"
