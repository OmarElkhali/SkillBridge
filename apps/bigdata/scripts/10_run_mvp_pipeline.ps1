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
    Write-Host "Role Big Data: $Role"
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

Write-Host "=== SkillBridge Big Data MVP Pipeline ==="
Write-Host "Working directory: $root"

Show-Step "1" "Verification des prerequis" "S'assurer que Docker, Python et les outils minimums sont disponibles."
& .\scripts\00_check_prereqs.ps1
Show-Result "Les prerequis locaux ont ete verifies."
Show-Verify "docker --version; python --version" "Les deux commandes retournent une version."

Show-Step "2" "Build des images Sqoop et Flume" "Preparer les outils de collecte batch et streaming avec des images locales stables."
Run-Native docker compose build sqoop-client flume-agent
Show-Result "Les images locales Sqoop et Flume sont construites."
Show-Verify "docker images skillbridge-sqoop; docker images skillbridge-flume" "Les deux images existent localement."

Show-Step "3" "Demarrage du PostgreSQL mirror" "Creer la source relationnelle locale utilisee par Sqoop."
Run-Native docker compose up --detach postgres-mirror
Start-Sleep -Seconds 10
Run-Native docker compose ps
Show-Result "Le miroir PostgreSQL local est demarre."
Show-Verify "docker compose ps postgres-mirror" "Le service postgres-mirror est Up."

Show-Step "4" "Installation des dependances Python" "Installer les librairies necessaires au catalogue, au seed et aux traitements Python."
Run-Native python -m pip install -r requirements.txt
Show-Result "Les dependances Python sont installees."
Show-Verify "python -m pip show psycopg2-binary" "Le package psycopg2-binary est disponible."

Show-Step "5" "Build catalogue et seed du miroir" "Transformer les datasets ZIP en catalogue propre puis remplir le PostgreSQL mirror."
Run-Native python .\scripts\12_merge_and_enrich_catalog.py
Run-Native python .\scripts\14_seed_postgres_mirror_from_catalog.py
Show-Result "Le catalogue unifie est genere et le miroir PostgreSQL est rempli."
Show-Verify "docker compose exec postgres-mirror psql -U skillbridge -d skillbridge -c `"select count(*) from courses;`"" "Le count des cours est superieur a 17000."

Show-Step "6" "Demarrage HDFS, YARN et Sqoop" "Preparer le stockage distribue HDFS et le client Sqoop."
Run-Native docker compose up --detach namenode datanode resourcemanager nodemanager sqoop-client
Start-Sleep -Seconds 35
Run-Native docker compose ps
Show-Result "HDFS, YARN et Sqoop sont demarres."
Show-Verify "docker compose ps namenode datanode sqoop-client" "Les services sont Up/healthy."

Show-Step "7" "Creation des dossiers HDFS" "Organiser les zones raw, processed et export du pipeline."
Run-Native docker compose exec namenode bash /opt/skillbridge/scripts/03_create_hdfs_dirs.sh
Show-Result "L'arborescence HDFS SkillBridge est prete."
Show-Verify "docker compose exec namenode hdfs dfs -ls -R /data/skillbridge" "Les dossiers raw, processed et export existent."

Show-Step "8" "Import Sqoop vers HDFS" "Collecte batch: importer les tables PostgreSQL mirror vers HDFS."
Run-Native docker compose exec sqoop-client bash /opt/skillbridge/scripts/04_sqoop_import_mvp.sh
Show-Result "Sqoop a importe les tables du miroir PostgreSQL vers HDFS."
Show-Verify "docker compose exec namenode hdfs dfs -ls /data/skillbridge/raw/sqoop/courses" "_SUCCESS et part-m-00000 sont presents."

Show-Step "9" "Streaming Flume depuis events.log" "Collecte streaming: envoyer les evenements JSON Lines vers HDFS."
Copy-Item -LiteralPath ".\data\events\events.log.example" -Destination ".\data\events\events.log" -Force
Run-Native docker compose up --detach flume-agent
Start-Sleep -Seconds 80
Run-Native docker compose exec namenode hdfs dfs -ls -R /data/skillbridge/raw/flume/events
Show-Result "Flume a envoye les evenements dans HDFS."
Show-Verify "docker compose exec namenode hdfs dfs -ls -R /data/skillbridge/raw/flume/events" "Au moins un fichier events.* existe; .tmp est normal si Flume ecrit encore."

Show-Step "10" "Hive SQL sur HDFS" "Exposer les fichiers HDFS comme tables SQL analytiques."
Run-Native docker compose up --detach hive-metastore-postgresql hive-metastore hive-server
Start-Sleep -Seconds 75
Run-Native docker compose exec hive-server bash /opt/skillbridge/scripts/06_run_hive_queries.sh
Show-Result "Hive a cree les tables externes et execute les requetes de demo."
Show-Verify "docker compose exec hive-server beeline -u jdbc:hive2://localhost:10000 -e `"use skillbridge_bigdata; select count(*) from hive_courses;`"" "Hive retourne le nombre de cours."

Show-Step "11" "MapReduce TopSearchKeywordsJob" "Traitement batch distribue: compter les mots recherches dans les logs Flume."
powershell -ExecutionPolicy Bypass -File .\scripts\07_run_mapreduce.ps1
Show-Result "Le job MapReduce a produit les top mots-cles."
Show-Verify "docker compose exec namenode hdfs dfs -cat /data/skillbridge/processed/mapreduce/top_search_keywords/part-r-00000" "Une liste mot-cle + count est affichee."

Show-Step "12" "Matching Python projet vers skills" "Traitement metier: detecter les skills utiles pour les idees de projet."
Run-Native python .\scripts\08_match_project_skills.py
Show-Result "Python a produit les associations project_id -> skill_id."
Show-Verify "Get-Content .\output\project_skill_matches.csv" "Le CSV contient les matches projet-skill."

Show-Step "13" "Chargement HBase course_stats" "Stockage resultat: rendre les stats cours consultables en key/value."
Run-Native docker compose up --detach hbase
Start-Sleep -Seconds 90
Run-Native python .\scripts\09_load_course_stats_hbase.py
Run-Native docker compose exec hbase hbase shell /opt/skillbridge/output/load_course_stats.hbase
Show-Result "HBase contient la table course_stats."
Show-Verify "scan 'course_stats', {LIMIT => 10}" "Des lignes avec activity:clicks, activity:saves et meta:title sont visibles."

Show-Step "14" "Resume terminal" "Restitution: afficher un resultat final lisible sans frontend."
Get-Content -LiteralPath ".\output\bigdata-summary.json"
Show-Result "Le resume JSON du pipeline est disponible."
Show-Verify "Get-Content .\output\bigdata-summary.json" "Le JSON contient les stats finales."

Write-Host ""
Write-Host "Pipeline MVP complete."
