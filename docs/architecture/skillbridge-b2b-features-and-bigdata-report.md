# SkillBridge B2B Features And Big Data Pipeline Report

Date de verification: 2026-05-13  
Projet: SkillBridge  
Objectif du rapport: expliquer le projet bout-a-bout, les features, les preuves terminal, les logs, les roles des technologies et surtout le pipeline Big Data.

## 1. Resume executif

SkillBridge est une plateforme educative qui transforme une idee de projet en parcours de cours:

```text
Project idea -> detected skills -> matched categories -> ranked courses -> saved courses/progress
```

Le projet contient deux parties complementaires:

1. Application web temps reel:

```text
React -> Spring Boot -> Supabase PostgreSQL
```

2. Pipeline Big Data terminal-first:

```text
Datasets ZIP/JSON/CSV
  -> Python catalog builder
  -> Supabase safe upsert
  -> PostgreSQL mirror local
  -> Sqoop
  -> HDFS
  -> Hive
  -> MapReduce
  -> Python recommendation
  -> HBase
  -> JSON summaries
```

Le principe principal a defendre:

- Supabase PostgreSQL sert l'application en temps reel.
- Hadoop traite les donnees massives et les evenements en batch/streaming.
- Les resultats propres reviennent sous forme de catalogue, analytics, HBase stats et JSON summaries.

## 2. Features B2B du projet

Ici, B2B signifie "bout-a-bout": chaque feature est reliee a son frontend, son backend, sa base et, quand c'est pertinent, sa trace Big Data.

| Feature | Frontend | Backend/API | Donnees | Trace Big Data |
|---|---|---|---|---|
| Register/Login | Pages login/register | `/api/auth/register`, `/api/auth/login` | Supabase `users`, `roles` | Non, auth reste transactionnelle |
| Profil utilisateur | Dashboard/user session | `/api/users/me` | Supabase `users` | Non |
| Catalogue cours | Courses page avec pagination/filtres | `/api/courses` | Supabase `courses`, `categories`, `providers`, `skills` | `COURSE_SEARCH`, `COURSE_CLICK` dans `events.log` |
| Sauvegarde cours | Saved courses page | `/api/saved-courses` | Supabase `saved_courses` | `COURSE_SAVE` dans `events.log` |
| Progression | Progress page | `/api/progress` | Supabase `course_progress` | HBase stats utilise `avg_progress` depuis mirror |
| Idees de projet | Projects page/detail | `/api/projects` | Supabase `project_ideas` | `PROJECT_CREATED` dans `events.log` |
| Recommandations | Project detail/recommendations | `/api/projects/{id}/recommendations/generate` | Supabase snapshots/results | `PROJECT_RECOMMENDATION` dans `events.log`, JSON recommendation |
| Admin overview | Admin Control Room | `/api/admin/overview` | Supabase aggregations | Lit outputs Big Data |
| Big Data dashboard | Admin Big Data page | `/api/bigdata/*` | JSON files + events.log | Pipeline visibility |
| Catalog admin CRUD | Admin courses/categories/providers/skills | `/api/courses`, `/api/categories`, `/api/providers`, `/api/skills` | Supabase catalog tables | Indirect, catalogue enrichi par Big Data |

## 3. Endpoints backend verifies par le code

Extraction locale depuis les controllers Spring Boot:

```text
/api/auth/register
/api/auth/login
/api/users/me
/api/admin/users
/api/courses
/api/courses/{id}/click
/api/courses/admin
/api/categories
/api/providers
/api/skills
/api/skills/search
/api/projects
/api/projects/{id}
/api/projects/{id}/recommendations
/api/projects/{id}/recommendations/generate
/api/projects/{id}/recommendations/latest
/api/saved-courses
/api/progress
/api/bigdata/status
/api/bigdata/catalog-summary
/api/bigdata/events/latest
/api/bigdata/hive/summary
/api/bigdata/mapreduce/top-keywords
/api/bigdata/hbase/course-stats
/api/bigdata/recommendation/latest
/api/bigdata/analytics/refresh
/api/admin/overview
/api/admin/catalog-analytics
/api/admin/bigdata/pipeline
/api/admin/bigdata/catalog-analytics
/api/admin/bigdata/events-analytics
/api/admin/bigdata/recommendation-analytics
/api/admin/bigdata/commands
```

Interpretation:

- Le frontend ne parle pas directement a Hadoop.
- React appelle Spring Boot.
- Spring Boot lit Supabase et les fichiers generes par le pipeline.
- Hadoop reste terminal-first mais visible dans l'admin dashboard.

## 4. Role de chaque technologie

### React

React affiche l'interface utilisateur:

- login/register
- dashboard utilisateur
- catalogue de cours
- projets et recommandations
- saved courses
- progress tracking
- admin overview
- Big Data dashboard

React ne doit pas appeler directement HDFS, Hive, HBase ou Docker. C'est une regle d'architecture propre.

### Spring Boot

Spring Boot est le serveur API:

- gere l'authentification JWT
- applique les roles USER/ADMIN
- lit/ecrit Supabase PostgreSQL via JPA
- expose les endpoints Big Data sous forme propre
- ecrit les evenements web dans `apps/bigdata/data/events/events.log`

### Supabase PostgreSQL

Supabase est la base officielle de l'application:

- users
- roles
- courses
- categories
- providers
- skills
- project_ideas
- saved_courses
- course_progress
- recommendation_snapshots
- recommendation_results

Supabase Auth n'est pas utilise. L'auth est Spring Security/JWT.

### PostgreSQL mirror local

Le mirror Docker local est utilise pour le pipeline Big Data:

- source stable pour Sqoop
- resettable sans risque pour Supabase
- contient une copie du catalogue et des donnees utiles

### Sqoop

Sqoop fait la collecte batch:

```text
PostgreSQL mirror -> HDFS raw/sqoop
```

Il prouve l'import de tables relationnelles vers Hadoop.

### Flume

Flume fait la collecte streaming:

```text
events.log -> Flume source/channel/sink -> HDFS raw/flume/events
```

Dans ce projet, `tail -F` a ete remplace par `scripts/flume-follow-events.sh` pour etre fiable sur Windows/OneDrive bind mount.

### HDFS

HDFS est le stockage distribue:

- zone raw Sqoop
- zone raw Flume
- zone processed MapReduce
- zone export HBase

Le cluster local tourne avec 2 DataNodes.

### Hive

Hive lit les fichiers HDFS avec SQL:

- `hive_courses`
- `hive_events`
- `hive_saved_courses`
- `hive_course_progress`

Important: `hive_events` stocke les logs en colonne `raw_line`; les champs JSON sont lus avec `get_json_object`.

### MapReduce

MapReduce execute le job Java `TopSearchKeywordsJob`:

```text
HDFS raw/flume/events -> top_search_keywords
```

Il compte les mots-cles recherches ou presents dans les evenements.

### Python

Python est utilise pour:

- fusionner les datasets
- nettoyer/dedupliquer le catalogue
- pousser vers Supabase
- remplir le mirror PostgreSQL
- generer les scripts HBase
- generer les recommandations terminal
- produire les JSON summaries

### HBase

HBase stocke des statistiques par `course_id`:

- `meta:title`
- `activity:clicks`
- `activity:saves`
- `activity:avg_progress`

C'est la couche NoSQL key/value du pipeline.

## 5. Preuve Docker: tous les conteneurs

Commande:

```powershell
docker compose -f apps\bigdata\docker-compose.yml ps
```

Resultat observe:

```text
bigdata-datanode-1                      Up 2 days (healthy)
bigdata-datanode-2                      Up 18 hours (healthy)
skillbridge-flume-agent                 Up 18 hours
skillbridge-hbase                       Up 18 hours
skillbridge-hive-metastore              Up 2 days
skillbridge-hive-metastore-postgresql   Up 2 days
skillbridge-hive-server                 Up 2 days
skillbridge-namenode                    Up 2 days (healthy)
skillbridge-nodemanager                 Up 2 days (healthy)
skillbridge-postgres-mirror             Up 2 days
skillbridge-resourcemanager             Up 2 days (healthy)
skillbridge-sqoop-client                Up 2 days
```

Conclusion:

- La stack Big Data est demarree.
- Les deux DataNodes sont actifs.
- HDFS, Hive, Sqoop, Flume, HBase et PostgreSQL mirror sont disponibles.

## 6. Preuve HDFS et scalabilite DataNode

Commande:

```powershell
docker compose -f apps\bigdata\docker-compose.yml exec -T namenode hdfs dfsadmin -report
```

Extrait important:

```text
Configured Capacity: 2162202353664 (1.97 TB)
Present Capacity: 1998263599104 (1.82 TB)
DFS Remaining: 1998178369536 (1.82 TB)
DFS Used: 85229568 (81.28 MB)
Under replicated blocks: 0
Missing blocks: 0
Live datanodes (2)
```

Interpretation:

- HDFS fonctionne.
- Le cluster local a 2 DataNodes.
- Aucun bloc manquant.
- Aucun bloc sous-replique apres correction en replication 2.

Pourquoi c'est important:

- Le NameNode gere les chemins et metadata.
- Les DataNodes stockent les blocs.
- `--scale datanode=2` prouve la scalabilite horizontale.

## 7. Preuve PostgreSQL mirror

Commande:

```powershell
docker compose -f apps\bigdata\docker-compose.yml exec -T postgres-mirror psql -U skillbridge -d skillbridge -c "select ... counts ..."
```

Resultat:

```text
categories      12
course_progress 50
courses         17072
course_skills   104006
project_ideas   10
providers       459
saved_courses   40
skills          13647
```

Interpretation:

- Le mirror local contient le catalogue complet.
- Ce mirror est la source relationnelle de Sqoop.
- Les donnees applicatives utiles sont presentes pour les analytics.

## 8. Preuve catalog builder

Fichier:

```text
apps/bigdata/output/catalog/catalog_build_report.json
```

Sources utilisees:

```text
final_cleaned_dataset.csv       raw=2377   used=2377
all_courses.csv                 raw=1041   used=1041
processed_coursera_data.json    raw=13174  used=13173
edx_courses.json                raw=1000   used=1000
```

Nettoyage:

```text
deduplicated_records: 519
```

Resultat final:

```text
unified_courses: 17072
providers: 459
categories: 12
skills: 13647
course_skills: 104006
```

Distribution par niveau:

```text
BEGINNER: 8690
INTERMEDIATE: 7431
ADVANCED: 951
```

Top categories:

```text
Machine Learning: 5925
Backend Development: 2092
Product and UX: 1955
Application Security: 1718
General Technology: 1514
Cloud Computing: 1186
Databases: 571
Web Development: 512
Big Data: 490
DevOps: 436
Data Engineering: 396
Business and Management: 277
```

Interpretation:

- Le catalogue n'est pas juste importe brut.
- Il est nettoye, deduplique, normalise et enrichi avec categories/skills.
- Les cours viennent de plusieurs sources mais sortent dans un schema unique.

## 9. Preuve Sqoop: import batch vers HDFS

Commande:

```powershell
docker compose -f apps\bigdata\docker-compose.yml exec -T namenode hdfs dfs -ls -R /data/skillbridge/raw/sqoop
```

Extraits:

```text
/data/skillbridge/raw/sqoop/categories/_SUCCESS
/data/skillbridge/raw/sqoop/categories/part-m-00000
/data/skillbridge/raw/sqoop/course_progress/_SUCCESS
/data/skillbridge/raw/sqoop/course_progress/part-m-00000
/data/skillbridge/raw/sqoop/course_skills/_SUCCESS
/data/skillbridge/raw/sqoop/course_skills/part-m-00000
/data/skillbridge/raw/sqoop/courses/_SUCCESS
/data/skillbridge/raw/sqoop/courses/part-m-00000
/data/skillbridge/raw/sqoop/project_ideas/_SUCCESS
/data/skillbridge/raw/sqoop/project_ideas/part-m-00000
/data/skillbridge/raw/sqoop/providers/_SUCCESS
/data/skillbridge/raw/sqoop/providers/part-m-00000
/data/skillbridge/raw/sqoop/saved_courses/_SUCCESS
/data/skillbridge/raw/sqoop/saved_courses/part-m-00000
/data/skillbridge/raw/sqoop/skills/_SUCCESS
/data/skillbridge/raw/sqoop/skills/part-m-00000
```

Interpretation:

- `_SUCCESS` prouve que l'import Sqoop a termine correctement.
- `part-m-00000` contient les donnees extraites.
- Les tables relationnelles sont maintenant dans HDFS.

## 10. Preuve Flume: streaming events.log vers HDFS

Evenements web recents:

```text
PROJECT_RECOMMENDATION projectId=22 requestedLimit=10 scores=[78,78,76,72,...]
PROJECT_RECOMMENDATION projectId=22 requestedLimit=20 scores=[78,78,76,72,...]
PROJECT_CREATED projectId=23
PROJECT_RECOMMENDATION projectId=23 requestedLimit=10
PROJECT_CREATED projectId=24
PROJECT_RECOMMENDATION projectId=24 requestedLimit=5 scores=[61,55,55,54,54]
COURSE_SAVE courseId=5134
PIPELINE_FIX_TEST_POLLING
```

Commande HDFS:

```powershell
docker compose -f apps\bigdata\docker-compose.yml exec -T namenode hdfs dfs -ls -R /data/skillbridge/raw/flume/events
```

Resultat:

```text
events.1776679507079
events.1776679669807
events.1776697159650
events.1776783351033
events.1776844533695
events.1778594317723
```

Contenu du dernier fichier:

```json
{"message":"verify flume polling follower to hdfs","timestamp":"2026-05-12T13:58:35.6069489Z","source":"codex-fix","eventType":"PIPELINE_FIX_TEST_POLLING"}
```

Logs Flume importants:

```text
Creating instance of source eventsSource, type exec
Creating instance of sink: hdfsSink, type: hdfs
Channel memoryChannel connected to [eventsSource, hdfsSink]
Exec source starting with command: bash /opt/skillbridge/scripts/flume-follow-events.sh /opt/skillbridge/data/events/events.log
Component type: SINK, name: hdfsSink started
Component type: SOURCE, name: eventsSource started
Creating hdfs://namenode:9000/data/skillbridge/raw/flume/events/events.1778594317723.tmp
Renaming ... events.1778594317723.tmp to ... events.1778594317723
```

Interpretation:

- Spring Boot ecrit les evenements dans `events.log`.
- Flume lit les nouvelles lignes.
- Flume cree un fichier temporaire `.tmp`.
- Flume ferme puis renomme le fichier final dans HDFS.
- C'est la preuve du chemin streaming.

## 11. Preuve Hive: SQL sur HDFS

Commande:

```powershell
docker compose -f apps\bigdata\docker-compose.yml exec -T hive-server beeline -u jdbc:hive2://localhost:10000 --silent=true --showHeader=true --outputformat=table -e "use skillbridge_bigdata; ..."
```

Counts:

```text
hive_courses: 17072
hive_events: 59
```

Schema `hive_events`:

```text
raw_line string
```

Analyse des event types avec `get_json_object(raw_line, '$.eventType')`:

```text
COURSE_CLICK               23
COURSE_SEARCH              22
NULL                        5
PROJECT_SUBMISSION          4
COURSE_SAVE                 4
PIPELINE_FIX_TEST_POLLING   1
```

Interpretation:

- Hive peut lire les donnees HDFS.
- `hive_courses` prouve l'analyse batch du catalogue.
- `hive_events` prouve l'analyse des logs Flume.
- Les events sont stockes en JSON brut, donc les champs sont extraits avec `get_json_object`.

Point a ameliorer plus tard:

- Creer une table Hive structuree avec colonnes `eventType`, `userId`, `projectId`, `courseId`, `timestamp`.
- Garder `raw_line` comme table brute et creer `hive_events_parsed` comme table analytique.

## 12. Preuve MapReduce

Commande:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\07_run_mapreduce.ps1
```

Indicateurs du job:

```text
Input path: /data/skillbridge/raw/flume/events
Output path: /data/skillbridge/processed/mapreduce/top_search_keywords
Total input paths to process: 6
Map input records: 59
Map output records: 70
Reduce output records: 18
Job completed successfully
```

Sortie:

```text
airflow     4
boot        4
data        4
developer   5
engineering 4
flume       2
frontend    5
hadoop      2
hdfs        2
hive        4
learning    5
machine     5
python      5
react       5
security    4
spark       4
spring      4
sqoop       2
```

Interpretation:

- MapReduce lit les fichiers Flume dans HDFS.
- Le Mapper extrait les mots.
- Le Reducer additionne les occurrences.
- Le resultat est ecrit dans HDFS.

## 13. Preuve HBase

Fichier genere:

```text
apps/bigdata/output/load_course_stats.hbase
```

Colonnes:

```text
meta:title
activity:clicks
activity:saves
activity:avg_progress
```

Commande fiable:

```powershell
docker compose -f apps\bigdata\docker-compose.yml restart hbase
Start-Sleep -Seconds 90
python .\scripts\09_load_course_stats_hbase.py
docker compose -f apps\bigdata\docker-compose.yml exec -T hbase /hbase/bin/hbase shell /opt/skillbridge/output/load_course_stats.hbase
```

Scan observe apres redemarrage:

```text
1191 activity:avg_progress 80.00
1191 activity:clicks       0
1191 activity:saves        1
1191 meta:title            Algorithms Specialization

1208 activity:avg_progress 80.00
1208 activity:clicks       0
1208 activity:saves        1
1208 meta:title            Analisis de Datos de Google Professional Certificate

1227 activity:avg_progress 80.00
1227 activity:clicks       0
1227 activity:saves        1
1227 meta:title            Arizona State University TESOL Professional Certificate
```

Point operationnel important:

- Le conteneur HBase peut rester `Up` meme si le RegionServer interne est tombe.
- Symptome observe:

```text
Connection refused: 328c3d1ae9a3/172.19.0.4:16020
HRegionServer Aborted
ZooKeeper SessionExpiredException
```

Correction:

- Redemarrer `hbase`.
- Attendre environ 90 secondes.
- Relancer le script de chargement.

Pour une soutenance, il faut toujours relancer la verification HBase juste avant la demo.

## 14. Preuve JSON Big Data summary

Fichier:

```text
apps/bigdata/output/bigdata-summary.json
```

Extrait:

```json
{
  "generated": true,
  "flume": {
    "source": "data/events/events.log",
    "sink": "/data/skillbridge/raw/flume/events",
    "eventCountFromLocalLog": 39
  },
  "hdfs": {
    "rawFlumeEventsPath": "/data/skillbridge/raw/flume/events",
    "mapReduceOutputPath": "/data/skillbridge/processed/mapreduce/top_search_keywords"
  },
  "hive": {
    "database": "skillbridge_bigdata",
    "tables": ["hive_courses", "hive_events", "hive_saved_courses", "hive_course_progress"]
  },
  "mapreduce": {
    "job": "TopSearchKeywordsJob",
    "inputPath": "/data/skillbridge/raw/flume/events",
    "outputPath": "/data/skillbridge/processed/mapreduce/top_search_keywords"
  },
  "course_stats": {
    "totalGeneratedRows": 50
  }
}
```

Interpretation:

- Ce JSON sert au backend/admin dashboard.
- Il resume les chemins, les roles et les outputs.
- Il evite de connecter le frontend directement aux conteneurs Hadoop.

## 15. Preuve recommendation_result.json

Commande:

```powershell
python .\scripts\15_run_project_recommendation.py --project "i want to create a complete website using react and java" --limit 10
```

Sortie terminal:

```text
Detected skills:
- Website
- Create
- React
- Java

Matched categories:
- Backend Development via java
- Web Development via react

Recommended courses:
1. Build Your First React Website
   Provider: Coursera Project Network
   Category: Backend Development
   Score: 86.4
   Why: title match: react, website; skill match: Java, React; category match: Backend Development; popularity bonus: 6.4

2. Build Your First React Website (Part II)
   Score: 82.7

3. Interactivity with JavaScript
   Score: 80.7
```

Extrait JSON:

```json
{
  "project": "i want to create a complete website using react and java",
  "detected_skills": [
    {"name": "Website", "match": "phrase"},
    {"name": "Create", "match": "phrase"},
    {"name": "React", "match": "phrase"},
    {"name": "Java", "match": "phrase"}
  ],
  "matched_categories": [
    {"name": "Backend Development", "matched_keywords": ["java"]},
    {"name": "Web Development", "matched_keywords": ["react"]}
  ],
  "recommendations": [
    {
      "title": "Build Your First React Website",
      "provider": "Coursera Project Network",
      "category": "Backend Development",
      "score": 86.4,
      "score_breakdown": {
        "title_match_score": 24,
        "skill_match_score": 36,
        "category_match_score": 20,
        "popularity_bonus": 6.4
      }
    }
  ]
}
```

Trace pipeline incluse:

```text
execution_mode: terminal-first-bigdata-recommendation
namenode: HDFS metadata manager
datanodes: HDFS block storage workers, default_scale=2
flume: data/events/events.log -> /data/skillbridge/raw/flume/events
hdfs: raw events path + MapReduce output path
hive: skillbridge_bigdata tables
mapreduce: TopSearchKeywordsJob
hbase: course_stats sample
catalog: catalog_build_report.json
refresh_commands: Docker/HDFS/Hive/MapReduce/HBase commands
```

Interpretation:

- La recommandation est rule-based, pas ML.
- Elle utilise un catalogue enrichi par Big Data.
- Elle produit une trace explicable pour le jury.

## 16. Comment fonctionne le scoring

Score total:

```text
score = title_match_score + skill_match_score + category_match_score + popularity_bonus
```

Exemple:

```text
Build Your First React Website
title_match_score: 24
skill_match_score: 36
category_match_score: 20
popularity_bonus: 6.4
total: 86.4
```

Explication:

- `title_match_score`: le titre contient React/Website.
- `skill_match_score`: le cours a les skills Java/React.
- `category_match_score`: la categorie correspond a Backend/Web Development.
- `popularity_bonus`: signal deterministic venant du catalogue enrichi.

## 17. Pipeline temps reel web

Flux:

```text
User action in React
  -> Spring Boot endpoint
  -> write JSON line in events.log
  -> Flume reads events.log
  -> Flume writes HDFS file
  -> Hive can query HDFS events
  -> MapReduce can process event keywords
```

Exemple d'evenement:

```json
{
  "eventType": "PROJECT_RECOMMENDATION",
  "source": "web-app",
  "userId": 1,
  "projectId": 22,
  "requestedLimit": 20,
  "detectedSkills": ["Create React App", "Website", "React", "Java"],
  "matchedCategories": ["Backend Development"],
  "topRecommendedCourseIds": [2798, 2799, 11577],
  "scores": [78, 78, 76],
  "timestamp": "2026-05-11T22:40:12.505364900Z"
}
```

Pourquoi c'est utile:

- On garde l'API rapide.
- On capture les comportements utilisateurs.
- On peut analyser les recherches, clics, saves, recommandations.
- Ces donnees alimentent Hive/MapReduce/HBase.

## 18. Pipeline batch catalog

Flux:

```text
archive ZIP files
  -> Python extraction
  -> cleaning
  -> deduplication
  -> normalized CSV
  -> Supabase upsert
  -> PostgreSQL mirror
  -> Sqoop
  -> HDFS raw/sqoop
  -> Hive external tables
```

Pourquoi c'est utile:

- Les datasets externes ne sont pas inseres directement dans la base live.
- Les donnees sont nettoyees avant publication.
- Le mirror permet de tester Sqoop sans risquer Supabase.

## 19. Pipeline analytics

Flux:

```text
HDFS raw/flume/events
  -> Hive count/query
  -> MapReduce TopSearchKeywordsJob
  -> HDFS processed/mapreduce/top_search_keywords
  -> JSON summary
  -> Admin Big Data dashboard
```

Preuve:

```text
Map input records: 59
Reduce output records: 18
top keywords: developer, frontend, learning, machine, python, react
```

## 20. Pipeline serving layer HBase

Flux:

```text
PostgreSQL mirror activity data
  -> Python aggregation
  -> load_course_stats.hbase
  -> HBase table course_stats
  -> Admin Big Data dashboard / terminal scan
```

Pourquoi HBase:

- HBase est une base NoSQL orientee colonnes.
- Elle permet une lecture rapide par cle `course_id`.
- Elle est adaptee aux statistiques agregees.

## 21. Comment montrer le pipeline en soutenance

Ordre recommande:

1. Montrer le catalogue: `catalog_build_report.json`.
2. Montrer le mirror: counts PostgreSQL.
3. Montrer Sqoop: `_SUCCESS` dans HDFS.
4. Montrer HDFS: `dfsadmin -report`, 2 DataNodes.
5. Montrer Flume: logs + fichier HDFS `events.*`.
6. Montrer Hive: `hive_courses=17072`, `hive_events=59`.
7. Montrer MapReduce: `top_search_keywords`.
8. Montrer Python recommendation: `recommendation_result.json`.
9. Montrer HBase: `scan 'course_stats'`.
10. Montrer admin dashboard: Big Data Control Room.

## 22. Commandes de verification complete

Depuis `apps/bigdata`:

```powershell
docker compose ps
docker compose exec namenode hdfs dfsadmin -report
docker compose exec postgres-mirror psql -U skillbridge -d skillbridge -c "select count(*) from courses;"
docker compose exec namenode hdfs dfs -ls -R /data/skillbridge/raw/sqoop
docker compose exec namenode hdfs dfs -ls -R /data/skillbridge/raw/flume/events
docker compose exec hive-server beeline -u jdbc:hive2://localhost:10000 --silent=true --showHeader=true --outputformat=table -e "use skillbridge_bigdata; select count(*) from hive_courses; select count(*) from hive_events;"
powershell -ExecutionPolicy Bypass -File .\scripts\07_run_mapreduce.ps1
docker compose exec namenode hdfs dfs -cat /data/skillbridge/processed/mapreduce/top_search_keywords/part-r-00000
docker compose restart hbase
Start-Sleep -Seconds 90
python .\scripts\09_load_course_stats_hbase.py
docker compose exec -T hbase /hbase/bin/hbase shell /opt/skillbridge/output/load_course_stats.hbase
python .\scripts\15_run_project_recommendation.py --project "i want to create a complete website using react and java" --limit 10
```

## 23. Questions critiques possibles du jury

### Pourquoi Supabase et Hadoop en meme temps?

Supabase sert les requetes temps reel de l'application. Hadoop sert au traitement massif, au batch, aux logs et aux analytics. On ne remplace pas la base transactionnelle par HDFS.

### Pourquoi ne pas connecter React directement a HDFS/Hive/HBase?

Parce que ce serait fragile et non securise. Le frontend doit appeler Spring Boot. Spring Boot controle les formats, les erreurs, les permissions et les chemins.

### Pourquoi Sqoop si les donnees viennent de fichiers Kaggle?

Les fichiers externes sont nettoyes par Python. Ensuite le catalogue normalise est charge dans PostgreSQL mirror. Sqoop demontre l'import batch relationnel vers HDFS.

### Pourquoi Flume?

Flume demontre le streaming d'evenements applicatifs. Les actions web generent des JSON Lines, puis Flume les pousse vers HDFS.

### Pourquoi MapReduce?

MapReduce montre un traitement batch distribue. Ici il calcule les mots-cles depuis les logs; demain il pourrait traiter beaucoup plus d'evenements.

### Pourquoi HBase?

HBase sert de couche key/value rapide pour des stats par cours. Ce n'est pas la base applicative, c'est une couche analytique/serving.

### Est-ce que le pipeline est totalement automatique?

Pas completement. Le pipeline Big Data reste terminal-first. C'est volontaire pour le projet academique: l'application reste rapide et le pipeline se lance/controlle en terminal.

### Quelle limite actuelle?

HBase peut necessiter un redemarrage avant demo car l'image locale peut perdre son RegionServer tout en gardant le conteneur Up. La correction est documentee.

## 24. Etat final

Etat observe le 2026-05-13:

| Composant | Etat | Preuve |
|---|---|---|
| Docker stack | OK | Tous les services principaux `Up` |
| DataNodes | OK | `Live datanodes (2)` |
| HDFS replication | OK | `Under replicated blocks: 0` |
| PostgreSQL mirror | OK | `courses=17072`, `skills=13647`, `course_skills=104006` |
| Sqoop | OK | `_SUCCESS` dans chaque dossier HDFS raw/sqoop |
| Flume | OK | fichier HDFS `events.1778594317723` genere |
| Hive | OK | `hive_courses=17072`, `hive_events=59` |
| MapReduce | OK | `Map input records=59`, output keywords |
| Python recommendation | OK | 10 recommandations avec scores detailles |
| HBase | OK apres restart | `course_stats` recreee et scannee |
| Admin/BigData APIs | Presentes | endpoints `/api/bigdata/*`, `/api/admin/bigdata/*` |

Conclusion:

Le projet peut etre explique comme une application full-stack connectee a un pipeline Big Data defensible:

```text
Application temps reel pour les utilisateurs
+ Pipeline Big Data terminal-first pour ingestion, stockage, analytics et serving
+ Dashboard admin pour rendre le travail Big Data visible
```

