# SkillBridge Big Data Pipeline

Guide TP terminal-first pour construire, executer et expliquer la partie Big Data de SkillBridge.

Le module Big Data vit dans `apps/bigdata`. Il separe clairement deux mondes:

- Supabase PostgreSQL: base applicative officielle de SkillBridge.
- PostgreSQL mirror local: base Docker locale utilisee par Sqoop et le pipeline Big Data.

La regle importante: le pipeline Hadoop/Sqoop/Hive/HBase travaille sur le miroir local. Supabase est enrichi uniquement par le script catalogue safe `13_push_catalog_to_supabase.py --apply`.

## 1. Overview

Flux complet actuel:

```text
ZIP datasets
  -> 12_merge_and_enrich_catalog.py
  -> output/catalog/*.csv
  -> 13_push_catalog_to_supabase.py --apply       optional safe Supabase upsert
  -> 14_seed_postgres_mirror_from_catalog.py      local PostgreSQL mirror
  -> Sqoop
  -> HDFS raw zone
  -> Hive external tables
  -> MapReduce TopSearchKeywordsJob
  -> Python project-skill matching
  -> HBase course_stats
  -> terminal JSON summaries
```

Validated catalog counts after cleaning:

```text
unified_courses  17072
providers        459
categories       12
skills           13647
course_skills    104006
```

Supabase was enriched by safe upsert. Existing non-catalog application tables were not deleted.

## 2. Architecture

Docker services:

```text
postgres-mirror              PostgreSQL local source for Sqoop
namenode, datanode           HDFS storage
resourcemanager, nodemanager Hadoop runtime
sqoop-client                 Batch import PostgreSQL -> HDFS
flume-agent                  Streaming file events.log -> HDFS
hive-metastore-postgresql    Hive metadata database
hive-metastore               Hive metadata service
hive-server                  Hive SQL endpoint
hbase                        Final key/value serving table
```

`sqoop-client` and `flume-agent` are built locally from `docker/sqoop` and `docker/flume`. This avoids fragile public images with incompatible Hadoop libraries.

## 3. Role Of Each Technology

```text
Collecte batch      -> Sqoop
Collecte streaming  -> Flume
Stockage            -> HDFS + HBase
SQL analytique      -> Hive
Traitement batch    -> MapReduce Java
Traitement metier   -> Python
Restitution         -> terminal JSON + CLI recommendation
```

Explanation simple: Sqoop imports relational catalog data, Flume streams user events, HDFS stores raw files, Hive queries them, MapReduce counts search keywords, Python matches project ideas to skills, and HBase stores final course statistics.

## 4. Prerequisites

Required on Windows:

```powershell
docker --version
python --version
```

Maven is needed for the Java MapReduce job. The project Maven wrapper is enough:

```powershell
cd C:\Users\omare\OneDrive\Desktop\SPRING_BIGDATA_PROJECT
.\mvnw.cmd -version
```

Required datasets:

```text
C:\Users\omare\Downloads\archive (1).zip
C:\Users\omare\Downloads\archive.zip
C:\Users\omare\Downloads\archive (2).zip
```

Check prerequisites:

```powershell
cd C:\Users\omare\OneDrive\Desktop\SPRING_BIGDATA_PROJECT\apps\bigdata
powershell -ExecutionPolicy Bypass -File .\scripts\00_check_prereqs.ps1
```

## 5. Folder Structure

```text
apps/bigdata/
  README.md
  .env.example
  docker-compose.yml
  conf/hive/hive-site.xml
  docker/flume/Dockerfile
  docker/sqoop/Dockerfile
  data/events/events.log.example
  flume/skillbridge-events.conf
  mapreduce/pom.xml
  mapreduce/src/main/java/com/skillbridge/bigdata/TopSearchKeywordsJob.java
  scripts/
    12_merge_and_enrich_catalog.py
    13_push_catalog_to_supabase.py
    14_seed_postgres_mirror_from_catalog.py
    15_run_project_recommendation.py
    16_run_catalog_build.ps1
    17_push_catalog_to_supabase.ps1
    18_run_full_terminal_lab.ps1
  sql/postgres/
  sql/hive/
  sql/hbase/
  output/
```

Generated runtime files are ignored:

```text
data/events/events.log
output/*
mapreduce/target/
/*.java
```

## 6. Data Source Audit

Used fully:

```text
archive (1).zip/final_cleaned_dataset.csv
  2377 rows
  Useful for course names, platforms, skills, ratings, students.

archive.zip/all_courses.csv
  1041 rows
  Useful for real course titles, descriptions, providers, ratings, reviews, URLs.

archive (2).zip/processed_coursera_data.json
  13174 rows
  Uses type in ('course', 'project').
  Coursera guided projects are kept as recommendable educational content.

archive (2).zip/edx_courses.json
  1000 rows
  Uses product='Course'.
  Useful for subject, level, language, descriptions, skills, images.
```

Ignored or not used directly:

```text
combined_dataset.json
  Combined duplicate source. Not used directly to avoid double imports.

edx_programs.json
  Programs/certificates, not unit courses.

edx_degree_programs.json
  Degree programs, not unit courses.

edx_executive_education_paidstuff.json
  Executive/paid offers, not the MVP course catalog.

combine_preprocessing.py
  Historical reference script, not part of the final flow.
```

## 7. Unified Catalog Rules

The script `12_merge_and_enrich_catalog.py` reads ZIP files directly and writes:

```text
output/catalog/unified_courses.csv
output/catalog/providers.csv
output/catalog/categories.csv
output/catalog/skills.csv
output/catalog/courses_staging.csv
output/catalog/course_skills_staging.csv
output/catalog/catalog_build_report.json
```

Final course schema:

```text
source_dataset
source_record_id
title
slug
description
level
language
source_url
thumbnail_url
provider_name
provider_slug
category_name
category_slug
skills
rating
reviews_count
students_count
duration_hours
popularity_score
content_type
dedupe_key
```

Normalization:

- `level`: only `BEGINNER`, `INTERMEDIATE`, `ADVANCED`.
- `language`: source language if available, otherwise `English`.
- `provider`: deterministic standardization such as `coursera -> Coursera`, `edx -> edX`.
- `skills`: parsed from CSV strings, JSON lists and dictionaries; invalid values like `NaN`, `null`, `unknown` are removed.
- `description`: source description first, deterministic fallback only when missing.
- `slug`: generated from title and provider, made unique.
- `source_url`: source URL first, deterministic SkillBridge fallback only when missing.
- `popularity_score`: deterministic formula from rating, reviews, students/enrollments and source popularity hints.

Deduplication:

- Primary key: normalized real URL.
- Secondary key: normalized title + provider.
- If duplicates exist, the richest record wins: better description, skills, URL, rating/reviews and image.

Categories are inferred by deterministic rules over title, description, skills and subject.

## 8. How To Build The Catalog

```powershell
cd C:\Users\omare\OneDrive\Desktop\SPRING_BIGDATA_PROJECT\apps\bigdata
powershell -ExecutionPolicy Bypass -File .\scripts\16_run_catalog_build.ps1
```

Or directly:

```powershell
python -m pip install -r requirements.txt
python .\scripts\12_merge_and_enrich_catalog.py
```

Verify:

```powershell
Get-Content .\output\catalog\catalog_build_report.json
```

Expected after current cleaning:

```text
unified_courses: 17072
providers: 459
categories: 12
skills: 13647
course_skills: 104006
```

## 9. How To Push Catalog To Supabase

Default mode is dry-run. It does not mutate Supabase:

```powershell
python .\scripts\13_push_catalog_to_supabase.py
```

Real import:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\17_push_catalog_to_supabase.ps1 -Apply
```

The script touches only:

```text
providers
categories
skills
courses
course_skills
```

It does not touch:

```text
users
roles
project_ideas
project_detected_skills
saved_courses
course_progress
recommendation_snapshots
recommendation_results
```

Supabase connection rule:

```text
host: aws-0-eu-west-1.pooler.supabase.com
user: postgres.kjhnukvekqkhixqymdgy
sslmode: require
password: read from apps/backend/.env DB_PASSWORD
```

The Supabase schema has no reliable visible ID sequences/defaults for these imports, so the script assigns explicit IDs using `max(id)+row_number` for new rows and preserves existing IDs for existing rows.

## 10. Supabase vs PostgreSQL Mirror

Supabase:

- Official application database.
- Used by the real SkillBridge app.
- Enriched only by the safe catalog upsert script.

PostgreSQL mirror:

- Local Docker database on `localhost:5433`.
- Used only for Big Data execution.
- Reset/reseedable without risk.
- Source database for Sqoop.

Seed mirror:

```powershell
docker compose up -d postgres-mirror
python .\scripts\14_seed_postgres_mirror_from_catalog.py
```

Verify:

```powershell
docker compose exec postgres-mirror psql -U skillbridge -d skillbridge -c "select count(*) from courses;"
docker compose exec postgres-mirror psql -U skillbridge -d skillbridge -c "select count(*) from skills;"
docker compose exec postgres-mirror psql -U skillbridge -d skillbridge -c "select count(*) from course_skills;"
docker compose exec postgres-mirror psql -U skillbridge -d skillbridge -c "select count(*) from project_ideas;"
```

Expected:

```text
courses: 17072
skills: 13647
course_skills: 104006
project_ideas: 10
```

## 11. How To Run Sqoop

Start Hadoop and Sqoop:

```powershell
docker compose up -d namenode datanode resourcemanager nodemanager sqoop-client
Start-Sleep -Seconds 35
docker compose exec namenode bash /opt/skillbridge/scripts/03_create_hdfs_dirs.sh
docker compose exec sqoop-client bash /opt/skillbridge/scripts/04_sqoop_import_mvp.sh
```

Sqoop imports:

```text
providers
categories
skills
courses
course_skills
project_ideas
saved_courses
course_progress
```

Verify:

```powershell
docker compose exec namenode hdfs dfs -ls /data/skillbridge/raw/sqoop/courses
$courses = (docker compose exec namenode hdfs dfs -cat /data/skillbridge/raw/sqoop/courses/part-m-00000 | Measure-Object -Line).Lines
$courses
```

Expected:

```text
17072
```

Note: Sqoop runs in local MapReduce mode for stable Docker execution. This still proves Sqoop batch collection. The separate Java job proves MapReduce processing.

## 12. How To Run Flume

Prepare events:

```powershell
Copy-Item .\data\events\events.log.example .\data\events\events.log -Force
docker compose up -d flume-agent
Start-Sleep -Seconds 45
```

Verify:

```powershell
docker compose exec namenode hdfs dfs -ls -R /data/skillbridge/raw/flume/events
```

Expected: files under `/data/skillbridge/raw/flume/events`. A `.tmp` file is normal while Flume is still writing.

## 13. How To Run Hive

Start Hive:

```powershell
docker compose up -d hive-metastore-postgresql hive-metastore hive-server
Start-Sleep -Seconds 75
docker compose exec hive-server bash /opt/skillbridge/scripts/06_run_hive_queries.sh
```

Direct checks:

```powershell
docker compose exec hive-server beeline -u jdbc:hive2://localhost:10000 --silent=true --showHeader=true --outputformat=table -e "use skillbridge_bigdata; select count(*) from hive_courses; select count(*) from hive_events;"
```

Validated example:

```text
hive_courses: 17072
hive_events: 36
```

Useful Hive queries include:

- count courses
- count events
- courses by level
- top providers
- top categories
- top skills
- top saved courses
- event counts
- top search queries

## 14. How To Run MapReduce

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\07_run_mapreduce.ps1
```

Verify:

```powershell
docker compose exec namenode hdfs dfs -cat /data/skillbridge/processed/mapreduce/top_search_keywords/part-r-00000
```

Validated example:

```text
hive      4
developer 3
frontend  3
learning  3
machine   3
python    3
react     3
```

## 15. How To Run Python Matching

Run:

```powershell
python .\scripts\08_match_project_skills.py
```

Outputs:

```text
output/project_skill_matches.csv
local mirror table project_detected_skills
```

Validated result:

```text
250 project-skill matches
```

Verify:

```powershell
docker compose exec postgres-mirror psql -U skillbridge -d skillbridge -c "select project_idea_id, count(*) from project_detected_skills group by project_idea_id order by project_idea_id;"
```

## 16. How To Load HBase

Start HBase and load:

```powershell
docker compose up -d hbase
Start-Sleep -Seconds 45
python .\scripts\09_load_course_stats_hbase.py
docker compose exec hbase hbase shell /opt/skillbridge/output/load_course_stats.hbase
```

Verify:

```powershell
docker compose exec hbase hbase shell -n
```

Inside HBase shell:

```ruby
scan 'course_stats', {LIMIT => 10}
exit
```

Expected columns:

```text
activity:clicks
activity:saves
activity:avg_progress
meta:title
```

## 17. Terminal Project Recommendation

Run from the terminal:

```powershell
python .\scripts\15_run_project_recommendation.py --project "I want to build a secure Spring Boot e-commerce backend with JWT and PostgreSQL"
```

Default source is the local mirror. To read Supabase:

```powershell
python .\scripts\15_run_project_recommendation.py --source supabase --project "I want to build a secure Spring Boot e-commerce backend with JWT and PostgreSQL"
```

Expected output:

```text
Detected skills:
- Spring Boot
- E-Commerce
- PostgreSQL
- Spring
- JWT

Matched categories:
- Application Security
- Backend Development
- Databases

Recommended courses:
1. Spring Boot with Embedded Database
   Provider: Coursera Project Network
   Score: 72.1
   Why: title match + skill match + category match + popularity bonus
```

JSON output is written to:

```text
output/recommendation_result.json
```

Scoring is deterministic:

```text
title_match_score      0-30
skill_match_score      0-40
category_match_score   0-20
popularity_bonus       0-10
total                  0-100
```

No machine learning is required.

## 18. Master Commands

Build catalog only:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\16_run_catalog_build.ps1
```

Supabase dry-run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\17_push_catalog_to_supabase.ps1
```

Supabase real upsert:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\17_push_catalog_to_supabase.ps1 -Apply
```

Full terminal lab:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\18_run_full_terminal_lab.ps1
```

At the end, the script asks:

```text
Entre le nom ou la description de ton projet:
```

You can also pass the project directly:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\18_run_full_terminal_lab.ps1 -Project "secure Spring Boot backend with JWT and PostgreSQL"
```

Full terminal lab with Supabase upsert:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\18_run_full_terminal_lab.ps1 -PushSupabase
```

## 19. Nettoyage Du Projet

Le module Big Data genere des fichiers temporaires pendant Sqoop, Maven, Flume, Python, HBase et les tests. Ces fichiers ne sont pas des sources du projet et peuvent etre reconstruits.

Commande de nettoyage sure:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\19_clean_bigdata_runtime.ps1
```

Ce script supprime uniquement:

```text
*.java generes par Sqoop a la racine de apps/bigdata
mapreduce/target/
scripts/__pycache__/
data/events/events.log
output/bigdata-summary.json
output/final-lab-summary.json
output/load_course_stats.hbase
output/mirror_seed_report.json
output/project_skill_matches.csv
output/recommendation_result.json
```

Ce script conserve volontairement:

```text
output/.gitkeep
output/catalog/*.csv
output/catalog/*.json
scripts/
sql/
docker/
conf/
flume/
mapreduce/src/
README.md
docker-compose.yml
```

Scripts obsoletes retires:

```text
01_start_bigdata.ps1
02_seed_postgres_from_csv.py
05_run_flume.sh
10_demo_all.ps1
11_check_postgres_mirror.ps1
```

Ils etaient remplaces par le flux actuel:

```text
12_merge_and_enrich_catalog.py
14_seed_postgres_mirror_from_catalog.py
10_run_mvp_pipeline.ps1
18_run_full_terminal_lab.ps1
19_clean_bigdata_runtime.ps1
```

Pourquoi garder `output/catalog/*.csv`:

```text
Ces fichiers sont des livrables utiles pour comprendre et recharger le catalogue.
Le fichier principal est output/catalog/unified_courses.csv.
```

Le nettoyage ne touche pas Supabase et ne supprime aucune donnee Docker. Pour supprimer aussi les volumes Docker locaux:

```powershell
docker compose down -v --remove-orphans
```

## 20. Comprendre Le Travail De Chaque Partie

Les scripts maitres affichent maintenant un texte apres chaque partie du pipeline. Chaque etape explique:

```text
ce qui vient d'etre fait
le role Big Data
la commande de verification
le resultat attendu
```

Résumé pédagogique:

```text
Catalogue Python
  Travail: lit les ZIP, nettoie, deduplique, normalise.
  Resultat: CSV propres dans output/catalog.

Supabase safe upsert
  Travail: enrichit les tables catalogue uniquement.
  Resultat: providers, categories, skills, courses, course_skills remplis.

PostgreSQL mirror
  Travail: copie locale du catalogue pour Big Data.
  Resultat: base Docker stable pour Sqoop.

Sqoop
  Travail: collecte batch PostgreSQL -> HDFS.
  Resultat: fichiers raw dans /data/skillbridge/raw/sqoop.

Flume
  Travail: collecte streaming events.log -> HDFS.
  Resultat: fichiers events.* dans /data/skillbridge/raw/flume/events.

Hive
  Travail: expose HDFS comme tables SQL.
  Resultat: requetes analytiques sur cours, providers, categories, events.

MapReduce
  Travail: compte les mots cles recherches dans les logs.
  Resultat: /data/skillbridge/processed/mapreduce/top_search_keywords.

Python matching
  Travail: detecte les skills des projets.
  Resultat: output/project_skill_matches.csv et table project_detected_skills locale.

HBase
  Travail: stocke les statistiques finales par course_id.
  Resultat: table course_stats scannable.

CLI recommendation
  Travail: prend un texte de projet et recommande des cours.
  Resultat: sortie terminal + output/recommendation_result.json.
```

## 21. How To Verify Every Result

```powershell
docker compose ps
docker compose exec postgres-mirror psql -U skillbridge -d skillbridge -c "select count(*) from courses;"
docker compose exec namenode hdfs dfs -ls /data/skillbridge/raw/sqoop/courses
docker compose exec namenode hdfs dfs -ls /data/skillbridge/raw/flume/events
docker compose exec hive-server beeline -u jdbc:hive2://localhost:10000 --silent=true --showHeader=true --outputformat=table -e "use skillbridge_bigdata; select count(*) from hive_courses; select count(*) from hive_events;"
docker compose exec namenode hdfs dfs -cat /data/skillbridge/processed/mapreduce/top_search_keywords/part-r-00000
docker compose exec hbase hbase shell /opt/skillbridge/output/load_course_stats.hbase
Get-Content .\output\bigdata-summary.json
Get-Content .\output\recommendation_result.json
```

## 22. Common Errors And Fixes

PowerShell refuses `.ps1`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\18_run_full_terminal_lab.ps1
```

Supabase pooler authentication fails:

```text
Use user postgres.kjhnukvekqkhixqymdgy, not postgres.
Use sslmode=require.
Read password from apps/backend/.env DB_PASSWORD.
```

Hive says `Version information not found in metastore`:

```powershell
docker compose rm -sf hive-server hive-metastore hive-metastore-postgresql
docker compose up -d hive-metastore-postgresql hive-metastore hive-server
```

Sqoop cannot reach HDFS `localhost:9000`:

```text
Inside Docker, use hdfs://namenode:9000, not localhost.
```

Sqoop prints HBase/HCatalog warnings:

```text
Acceptable for this TP. Sqoop is importing to HDFS, not directly to HBase or HCatalog.
```

Flume output stays `.tmp`:

```text
Normal while Flume is still running and writing.
```

Stale Docker state:

```powershell
docker compose down -v --remove-orphans
```

This removes local Docker volumes only. It does not touch Supabase.

## 23. Academic Demo Scenario

Use this order in a presentation:

1. Show source audit and explain which datasets are real courses.
2. Run or show `12_merge_and_enrich_catalog.py`.
3. Show `catalog_build_report.json`.
4. Explain safe Supabase upsert and show `supabase_import_report.json`.
5. Explain Supabase vs local PostgreSQL mirror.
6. Show mirror row counts.
7. Show Sqoop importing mirror tables into HDFS.
8. Show Flume writing events into HDFS.
9. Run Hive queries: count courses, top categories, top skills, event counts.
10. Run MapReduce and show top search keywords.
11. Run Python matching and show `project_skill_matches.csv`.
12. Load HBase and scan `course_stats`.
13. Run terminal recommendation with a project idea.

## 24. How To Explain The Pipeline Simply

Short oral version:

```text
SkillBridge stores application data in Supabase.
I first build a clean unified course catalog from CSV and JSON datasets.
I safely upsert the catalog into Supabase without deleting users, projects or progress.
For the Big Data lab, I copy the same catalog into a local PostgreSQL mirror.
Sqoop imports that mirror into HDFS as batch data.
Flume streams events.log into HDFS as streaming data.
Hive lets me query both batch and streaming data with SQL.
MapReduce computes top search keywords from logs.
Python detects skills from project ideas and matches them to the catalog.
HBase stores final course statistics for fast lookup.
The terminal recommendation command proves the useful business result.
```

## 25. Rebuild Everything From Scratch

Local-only rebuild:

```powershell
cd C:\Users\omare\OneDrive\Desktop\SPRING_BIGDATA_PROJECT\apps\bigdata
docker compose down -v --remove-orphans
powershell -ExecutionPolicy Bypass -File .\scripts\18_run_full_terminal_lab.ps1
```

With Supabase upsert:

```powershell
cd C:\Users\omare\OneDrive\Desktop\SPRING_BIGDATA_PROJECT\apps\bigdata
powershell -ExecutionPolicy Bypass -File .\scripts\18_run_full_terminal_lab.ps1 -PushSupabase
```

Manual sequence:

```powershell
python -m pip install -r requirements.txt
python .\scripts\12_merge_and_enrich_catalog.py
python .\scripts\13_push_catalog_to_supabase.py
python .\scripts\13_push_catalog_to_supabase.py --apply
docker compose up -d postgres-mirror
python .\scripts\14_seed_postgres_mirror_from_catalog.py
docker compose up -d namenode datanode resourcemanager nodemanager sqoop-client
Start-Sleep -Seconds 35
docker compose exec namenode bash /opt/skillbridge/scripts/03_create_hdfs_dirs.sh
docker compose exec sqoop-client bash /opt/skillbridge/scripts/04_sqoop_import_mvp.sh
Copy-Item .\data\events\events.log.example .\data\events\events.log -Force
docker compose up -d flume-agent
Start-Sleep -Seconds 45
docker compose up -d hive-metastore-postgresql hive-metastore hive-server
Start-Sleep -Seconds 75
docker compose exec hive-server bash /opt/skillbridge/scripts/06_run_hive_queries.sh
powershell -ExecutionPolicy Bypass -File .\scripts\07_run_mapreduce.ps1
python .\scripts\08_match_project_skills.py
docker compose up -d hbase
Start-Sleep -Seconds 45
python .\scripts\09_load_course_stats_hbase.py
docker compose exec hbase hbase shell /opt/skillbridge/output/load_course_stats.hbase
python .\scripts\15_run_project_recommendation.py --project "I want to build a secure Spring Boot backend with JWT and PostgreSQL"
```
