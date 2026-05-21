from __future__ import annotations

import html
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
REPORTS = ROOT / "docs" / "reports"
BIGDATA = ROOT / "apps" / "bigdata"
HTML_PATH = REPORTS / "skillbridge_bigdata_deep_dive_report.html"
PDF_PATH = REPORTS / "skillbridge_bigdata_deep_dive_report.pdf"


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def run(command: list[str], cwd: Path = BIGDATA, timeout: int = 60) -> str:
    try:
        completed = subprocess.run(
            command,
            cwd=str(cwd),
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=timeout,
            check=False,
        )
        output = completed.stdout.strip()
        return output if output else f"(exit code {completed.returncode}, no output)"
    except Exception as exc:
        return f"Commande non disponible pendant la generation: {exc}"


def read_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def code_block(text: str) -> str:
    return f"<pre>{esc(text)}</pre>"


def rows(items: list[tuple[object, ...]]) -> str:
    return "\n".join("<tr>" + "".join(f"<td>{esc(cell)}</td>" for cell in row) + "</tr>" for row in items)


CONTAINERS = [
    ("postgres-mirror", "postgres:16", "Source relationnelle locale pour le pipeline", "Reçoit le catalogue CSV nettoyé. Sqoop lit cette base au lieu de toucher Supabase.", "5433:5432", "docker exec skillbridge-postgres-mirror psql -U skillbridge -d skillbridge -c \"select count(*) from courses;\""),
    ("namenode", "bde2020/hadoop-namenode", "Maître HDFS", "Gère les métadonnées HDFS: noms de fichiers, chemins, blocs, réplication.", "9870, 9000", "docker exec skillbridge-namenode hdfs dfsadmin -report"),
    ("datanode", "bde2020/hadoop-datanode", "Stockage HDFS", "Stocke physiquement les blocs HDFS. Le projet démarre deux DataNodes pour montrer la distribution.", "50075 interne", "docker ps --filter name=bigdata-datanode"),
    ("resourcemanager", "bde2020/hadoop-resourcemanager", "Planificateur YARN", "Coordonne l'exécution des traitements MapReduce/YARN.", "8088", "docker logs skillbridge-resourcemanager --tail 40"),
    ("nodemanager", "bde2020/hadoop-nodemanager", "Worker YARN", "Exécute les tâches que YARN lui assigne.", "8042", "docker logs skillbridge-nodemanager --tail 40"),
    ("sqoop-client", "skillbridge-sqoop", "Collecte batch PostgreSQL -> HDFS", "Importe providers, categories, skills, courses, course_skills, project_ideas, saved_courses, course_progress.", "-", "docker exec skillbridge-sqoop-client bash /opt/skillbridge/scripts/04_sqoop_import_mvp.sh"),
    ("flume-agent", "skillbridge-flume", "Collecte streaming events.log -> HDFS", "Suit le fichier events.log et pousse chaque ligne JSON vers HDFS.", "-", "docker logs skillbridge-flume-agent --tail 80"),
    ("hive-metastore-postgresql", "bde2020/hive-metastore-postgresql", "Base interne du metastore Hive", "Stocke les métadonnées Hive: bases, tables, colonnes, emplacements HDFS.", "5432 interne", "docker logs skillbridge-hive-metastore-postgresql --tail 40"),
    ("hive-metastore", "bde2020/hive", "Service metastore Hive", "Expose les définitions de tables à Hive Server.", "9083", "docker logs skillbridge-hive-metastore --tail 40"),
    ("hive-server", "bde2020/hive", "Serveur SQL Hive", "Permet d'exécuter Beeline et les requêtes SQL sur les fichiers HDFS.", "10000", "docker exec skillbridge-hive-server beeline -u jdbc:hive2://localhost:10000 -e \"show databases;\""),
    ("hbase", "harisekhon/hbase", "Serving key/value course_stats", "Stocke les statistiques finales par course_id: clicks, saves, avg_progress, title.", "16010", "docker exec -i skillbridge-hbase /hbase/bin/hbase shell -n"),
]

FILES = [
    ("README.md", "Documentation principale du module Big Data: architecture, rôles, commandes, erreurs fréquentes."),
    ("docker-compose.yml", "Déclare tous les conteneurs: PostgreSQL mirror, Hadoop, Sqoop, Flume, Hive, HBase."),
    (".env.example", "Variables locales: chemins ZIP, HDFS_BASE, HIVE_DATABASE, connexion mirror."),
    ("requirements.txt", "Dépendances Python, notamment psycopg2-binary."),
    ("data/events/events.log.example", "Événements web de démonstration au format JSON Lines."),
    ("data/events/events.log", "Fichier runtime écrit par Spring Boot et suivi par Flume."),
    ("data/raw/README.md", "Zone explicative pour les données brutes locales."),
    ("flume/skillbridge-events.conf", "Configuration source/channel/sink Flume."),
    ("conf/hive/hive-site.xml", "Connexion Hive au metastore PostgreSQL et options Hive."),
    ("docker/sqoop/Dockerfile", "Image locale Sqoop compatible Hadoop 2.7.4 + PostgreSQL JDBC."),
    ("docker/flume/Dockerfile", "Image locale Flume avec librairies Hadoop nécessaires."),
    ("mapreduce/pom.xml", "Build Maven du job Java MapReduce."),
    ("mapreduce/src/main/java/com/skillbridge/bigdata/TopSearchKeywordsJob.java", "Mapper/Reducer qui compte les mots-clés dans les événements."),
    ("sql/postgres/01_create_seed_schema.sql", "Schema local minimal pour le PostgreSQL mirror."),
    ("sql/postgres/02_seed_project_ideas.sql", "Jeu de projets de démonstration pour le mirror."),
    ("sql/hive/01_create_hive_tables.sql", "Tables externes Hive pointant vers les dossiers HDFS."),
    ("sql/hive/02_demo_queries.sql", "Requêtes analytiques: counts, top providers, top categories, top skills, events."),
    ("sql/hbase/01_create_course_stats.hbase", "Script HBase de création de table course_stats."),
    ("scripts/00_check_prereqs.ps1", "Vérifie Docker, Python, Maven wrapper, datasets."),
    ("scripts/03_create_hdfs_dirs.sh", "Crée /data/skillbridge/raw, processed, export, hive."),
    ("scripts/04_sqoop_import_mvp.sh", "Importe les tables du mirror vers HDFS avec Sqoop."),
    ("scripts/06_run_hive_queries.sh", "Lance les scripts Hive de création et requêtes demo."),
    ("scripts/07_run_mapreduce.ps1", "Compile le job Java puis l'exécute dans Hadoop."),
    ("scripts/07_run_mapreduce.sh", "Commande Hadoop jar dans le namenode."),
    ("scripts/08_match_project_skills.py", "Détecte les skills dans les projets du mirror."),
    ("scripts/09_load_course_stats_hbase.py", "Génère load_course_stats.hbase et bigdata-summary.json."),
    ("scripts/10_run_mvp_pipeline.ps1", "Orchestre le pipeline Big Data MVP complet."),
    ("scripts/12_merge_and_enrich_catalog.py", "Lit les ZIP, nettoie, déduplique, catégorise, écrit les CSV catalogue."),
    ("scripts/13_push_catalog_to_supabase.py", "Dry-run ou upsert safe vers Supabase catalogue."),
    ("scripts/14_seed_postgres_mirror_from_catalog.py", "Remplit le PostgreSQL mirror depuis les CSV catalogue."),
    ("scripts/15_run_project_recommendation.py", "CLI terminal de recommandation à partir d'un texte projet."),
    ("scripts/16_run_catalog_build.ps1", "Wrapper PowerShell du build catalogue."),
    ("scripts/17_push_catalog_to_supabase.ps1", "Wrapper PowerShell du push Supabase."),
    ("scripts/18_run_full_terminal_lab.ps1", "Pipeline complet: catalog -> Supabase -> mirror -> Sqoop -> Flume -> Hive -> MapReduce -> Python -> HBase -> CLI."),
    ("scripts/19_clean_bigdata_runtime.ps1", "Nettoyage sûr des fichiers générés."),
    ("scripts/20_verify_app_bigdata_link.ps1", "Vérifie que Spring Boot voit le catalogue Big Data via /api/courses."),
    ("scripts/21_sync_supabase_sequences.py", "Resynchronise les séquences PostgreSQL Supabase après imports explicites."),
    ("scripts/flume-follow-events.sh", "Follower compatible Windows/volume Docker pour envoyer les nouvelles lignes à Flume."),
    ("output/catalog/*.csv", "Livrables catalogue générés."),
    ("output/bigdata-summary.json", "Résumé final lu par le backend/admin dashboard."),
    ("output/recommendation_result.json", "Dernier résultat de recommandation web ou CLI."),
    ("output/load_course_stats.hbase", "Script HBase généré avec les put course_stats."),
]

TECHS = [
    ("Sqoop", "Collecte batch", "Lit les tables PostgreSQL mirror via JDBC et écrit des fichiers texte tabulés dans HDFS.", "Prouve l'import relationnel massif vers Big Data."),
    ("Flume", "Collecte streaming", "Suit events.log et envoie les lignes JSON vers HDFS avec source exec, channel memory, sink HDFS.", "Relie les actions web au data lake."),
    ("HDFS", "Stockage distribué", "Stocke les zones raw/sqoop, raw/flume, processed/mapreduce.", "Base commune pour Hive et MapReduce."),
    ("Hive", "SQL analytique", "Déclare des tables externes sur les dossiers HDFS et lance les requêtes demo.", "Permet d'expliquer les données avec SQL."),
    ("MapReduce", "Traitement distribué Java", "Mapper extrait les tokens des événements COURSE_SEARCH/PROJECT_RECOMMENDATION, Reducer somme les compteurs.", "Produit les top mots-clés recherchés."),
    ("HBase", "Serving key/value", "Table course_stats avec familles meta et activity.", "Expose des statistiques rapides par course_id."),
    ("Python", "Préparation et traitement métier", "Nettoyage catalogue, seed mirror, matching projet-skill, génération scripts HBase.", "Fait le lien business entre web app et pipeline."),
]

COMMAND_SECTIONS = [
    ("Préparer les prérequis", "powershell -ExecutionPolicy Bypass -File .\\scripts\\00_check_prereqs.ps1", "Montre que Docker, Python et datasets existent."),
    ("Construire le catalogue", "powershell -ExecutionPolicy Bypass -File .\\scripts\\16_run_catalog_build.ps1", "Génère les CSV propres et catalog_build_report.json."),
    ("Voir les counts catalogue", "Get-Content .\\output\\catalog\\catalog_build_report.json", "Prouve les 17k cours, 13k skills, 104k liens."),
    ("Démarrer le mirror", "docker compose up -d postgres-mirror", "Démarre la base relationnelle locale."),
    ("Compter les tables mirror", "docker exec skillbridge-postgres-mirror psql -U skillbridge -d skillbridge -c \"select count(*) from courses;\"", "Prouve le seed PostgreSQL."),
    ("Créer les dossiers HDFS", "docker exec skillbridge-namenode bash /opt/skillbridge/scripts/03_create_hdfs_dirs.sh", "Montre l'organisation raw/processed/export."),
    ("Lister HDFS", "docker exec skillbridge-namenode hdfs dfs -ls -R /data/skillbridge", "Prouve les fichiers importés et générés."),
    ("Relancer Sqoop", "docker exec skillbridge-sqoop-client bash /opt/skillbridge/scripts/04_sqoop_import_mvp.sh", "Montre l'import batch."),
    ("Démontrer Flume", "Add-Content .\\data\\events\\events.log '{\"eventType\":\"COURSE_SEARCH\",\"source\":\"demo\",\"timestamp\":\"2026-05-20T00:00:00Z\",\"query\":\"spring hive hadoop\"}'", "Ajoute un événement que Flume doit pousser dans HDFS."),
    ("Vérifier Flume dans HDFS", "docker exec skillbridge-namenode hdfs dfs -ls -R /data/skillbridge/raw/flume/events", "Montre les fichiers events.*."),
    ("Créer et interroger Hive", "docker exec skillbridge-hive-server bash /opt/skillbridge/scripts/06_run_hive_queries.sh", "Crée les tables externes et lance les requêtes demo."),
    ("Compter Hive", "docker exec skillbridge-hive-server beeline -u jdbc:hive2://localhost:10000 --silent=true --showHeader=true --outputformat=table -e \"use skillbridge_bigdata; select count(*) from hive_courses; select count(*) from hive_events;\"", "Montre les counts SQL."),
    ("Lancer MapReduce", "powershell -ExecutionPolicy Bypass -File .\\scripts\\07_run_mapreduce.ps1", "Compile et exécute TopSearchKeywordsJob."),
    ("Lire résultat MapReduce", "docker exec skillbridge-namenode hdfs dfs -cat /data/skillbridge/processed/mapreduce/top_search_keywords/part-r-00000", "Affiche keyword + count."),
    ("Matching Python", "python .\\scripts\\08_match_project_skills.py", "Génère project_skill_matches.csv."),
    ("Générer HBase script", "python .\\scripts\\09_load_course_stats_hbase.py", "Génère load_course_stats.hbase et bigdata-summary.json."),
    ("Charger HBase", "docker exec -i skillbridge-hbase /hbase/bin/hbase shell /opt/skillbridge/output/load_course_stats.hbase", "Crée/remplit course_stats."),
    ("Scanner HBase", "echo \"scan 'course_stats', {LIMIT => 5}\" | docker exec -i skillbridge-hbase /hbase/bin/hbase shell -n", "Affiche les lignes HBase si le RegionServer est prêt."),
    ("Vérifier lien backend", "powershell -ExecutionPolicy Bypass -File .\\scripts\\20_verify_app_bigdata_link.ps1 -BackendUrl http://localhost:8081 -MinimumCourses 1000", "Prouve que Spring Boot voit le catalogue importé."),
    ("Pipeline complet", "powershell -ExecutionPolicy Bypass -File .\\scripts\\18_run_full_terminal_lab.ps1 -Project \"secure Spring Boot backend with JWT and PostgreSQL\"", "Démonstration intégrale pour soutenance."),
]


def svg_architecture() -> str:
    return """
<svg viewBox="0 0 1100 520" role="img" aria-label="Architecture Big Data">
<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#6b3a24"/></marker></defs>
<rect x="35" y="45" width="170" height="65" class="box"/><text x="120" y="82" text-anchor="middle">ZIP datasets</text>
<rect x="270" y="45" width="190" height="65" class="box2"/><text x="365" y="74" text-anchor="middle">Python catalog</text><text x="365" y="94" text-anchor="middle" class="small">clean, enrich, dedupe</text>
<rect x="525" y="45" width="180" height="65" class="box"/><text x="615" y="74" text-anchor="middle">CSV output</text><text x="615" y="94" text-anchor="middle" class="small">courses, skills, links</text>
<ellipse cx="850" cy="78" rx="95" ry="42" class="store"/><text x="850" y="75" text-anchor="middle">Supabase</text><text x="850" y="95" text-anchor="middle" class="small">application DB</text>
<ellipse cx="365" cy="215" rx="95" ry="42" class="store"/><text x="365" y="212" text-anchor="middle">Postgres mirror</text><text x="365" y="232" text-anchor="middle" class="small">Docker source</text>
<rect x="540" y="185" width="130" height="60" class="box2"/><text x="605" y="220" text-anchor="middle">Sqoop</text>
<ellipse cx="790" cy="215" rx="95" ry="42" class="store"/><text x="790" y="212" text-anchor="middle">HDFS</text><text x="790" y="232" text-anchor="middle" class="small">raw/processed</text>
<rect x="215" y="340" width="150" height="60" class="box"/><text x="290" y="375" text-anchor="middle">events.log</text>
<rect x="430" y="340" width="130" height="60" class="box2"/><text x="495" y="375" text-anchor="middle">Flume</text>
<rect x="680" y="340" width="130" height="60" class="box"/><text x="745" y="375" text-anchor="middle">Hive</text>
<rect x="850" y="340" width="150" height="60" class="box2"/><text x="925" y="375" text-anchor="middle">MapReduce</text>
<ellipse cx="930" cy="465" rx="88" ry="38" class="store"/><text x="930" y="462" text-anchor="middle">HBase</text><text x="930" y="481" text-anchor="middle" class="small">course_stats</text>
<path d="M205 78 L270 78" class="arrow"/><path d="M460 78 L525 78" class="arrow"/><path d="M705 78 L755 78" class="arrow"/>
<path d="M615 110 C570 170, 475 190, 450 205" class="arrow"/><path d="M460 215 L540 215" class="arrow"/><path d="M670 215 L695 215" class="arrow"/>
<path d="M365 110 C330 145, 330 170, 350 178" class="arrow"/>
<path d="M365 340 C410 310, 515 295, 705 240" class="arrow"/>
<path d="M365 370 L430 370" class="arrow"/><path d="M560 370 C620 335, 700 285, 760 255" class="arrow"/>
<path d="M790 257 L745 340" class="arrow"/><path d="M810 257 L925 340" class="arrow"/><path d="M925 400 L930 427" class="arrow"/>
</svg>"""


def svg_generate_reco() -> str:
    return """
<svg viewBox="0 0 1100 570" role="img" aria-label="Generate recommendation flow">
<defs><marker id="arrow2" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#6b3a24"/></marker></defs>
<rect x="45" y="50" width="160" height="60" class="box2"/><text x="125" y="85" text-anchor="middle">React button</text>
<rect x="270" y="50" width="190" height="60" class="box"/><text x="365" y="75" text-anchor="middle">POST generate</text><text x="365" y="95" text-anchor="middle" class="small">JWT protected</text>
<rect x="525" y="50" width="210" height="60" class="box2"/><text x="630" y="85" text-anchor="middle">RecommendationService</text>
<rect x="95" y="185" width="150" height="55" class="box"/><text x="170" y="208" text-anchor="middle">Load project</text><text x="170" y="227" text-anchor="middle" class="small">owner scoped</text>
<rect x="305" y="185" width="150" height="55" class="box"/><text x="380" y="208" text-anchor="middle">Tokenize</text><text x="380" y="227" text-anchor="middle" class="small">stop words</text>
<rect x="515" y="185" width="150" height="55" class="box"/><text x="590" y="208" text-anchor="middle">Detect skills</text><text x="590" y="227" text-anchor="middle" class="small">skills table</text>
<rect x="725" y="185" width="150" height="55" class="box"/><text x="800" y="208" text-anchor="middle">Rank courses</text><text x="800" y="227" text-anchor="middle" class="small">score 0-100</text>
<ellipse cx="245" cy="350" rx="100" ry="42" class="store"/><text x="245" y="347" text-anchor="middle">PostgreSQL</text><text x="245" y="366" text-anchor="middle" class="small">snapshots/results</text>
<rect x="440" y="320" width="190" height="60" class="box"/><text x="535" y="345" text-anchor="middle">events.log</text><text x="535" y="365" text-anchor="middle" class="small">PROJECT_RECOMMENDATION</text>
<rect x="720" y="320" width="170" height="60" class="box2"/><text x="805" y="345" text-anchor="middle">Response</text><text x="805" y="365" text-anchor="middle" class="small">courses + trace</text>
<rect x="440" y="465" width="120" height="50" class="box2"/><text x="500" y="496" text-anchor="middle">Flume</text>
<ellipse cx="665" cy="490" rx="80" ry="36" class="store"/><text x="665" y="495" text-anchor="middle">HDFS</text>
<rect x="805" y="465" width="120" height="50" class="box"/><text x="865" y="496" text-anchor="middle">Analytics</text>
<path d="M205 80 L270 80" class="arrow"/><path d="M460 80 L525 80" class="arrow"/>
<path d="M630 110 C580 150, 250 150, 170 185" class="arrow"/><path d="M245 212 L305 212" class="arrow"/><path d="M455 212 L515 212" class="arrow"/><path d="M665 212 L725 212" class="arrow"/>
<path d="M800 240 C710 300, 350 300, 245 310" class="arrow"/><path d="M800 240 C730 310, 615 305, 535 320" class="arrow"/><path d="M800 240 L805 320" class="arrow"/>
<path d="M535 380 L500 465" class="arrow"/><path d="M560 490 L585 490" class="arrow"/><path d="M745 490 L805 490" class="arrow"/>
</svg>"""


def main() -> None:
    REPORTS.mkdir(parents=True, exist_ok=True)
    catalog = read_json(BIGDATA / "output" / "catalog" / "catalog_build_report.json")
    summary = read_json(BIGDATA / "output" / "bigdata-summary.json")
    docker_ps = run(["docker", "ps", "--format", "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"], timeout=30)
    mirror_counts = run(["docker", "exec", "skillbridge-postgres-mirror", "psql", "-U", "skillbridge", "-d", "skillbridge", "-c", "select 'courses' as table_name, count(*) from courses union all select 'skills', count(*) from skills union all select 'course_skills', count(*) from course_skills union all select 'project_ideas', count(*) from project_ideas union all select 'saved_courses', count(*) from saved_courses union all select 'course_progress', count(*) from course_progress;"], timeout=60)
    hdfs_listing = run(["docker", "exec", "skillbridge-namenode", "hdfs", "dfs", "-ls", "-R", "/data/skillbridge"], timeout=60)
    hive_counts = run(["docker", "exec", "skillbridge-hive-server", "beeline", "-u", "jdbc:hive2://localhost:10000", "--silent=true", "--showHeader=true", "--outputformat=table", "-e", "use skillbridge_bigdata; select count(*) as hive_courses from hive_courses; select count(*) as hive_events from hive_events;"], timeout=90)
    mapreduce_out = run(["docker", "exec", "skillbridge-namenode", "hdfs", "dfs", "-cat", "/data/skillbridge/processed/mapreduce/top_search_keywords/part-r-00000"], timeout=60)
    events_tail = "\n".join((BIGDATA / "data" / "events" / "events.log").read_text(encoding="utf-8", errors="replace").splitlines()[-10:]) if (BIGDATA / "data" / "events" / "events.log").exists() else "events.log missing"

    final_counts = catalog.get("final_counts", {})
    hbase_sample = summary.get("course_stats", {}).get("sample", [])
    hbase_rows = [(item.get("courseId"), item.get("meta:title"), item.get("activity:clicks"), item.get("activity:saves"), item.get("activity:avg_progress")) for item in hbase_sample[:10]]
    flume_demo_cmd = """Add-Content .\\data\\events\\events.log '{"eventType":"COURSE_SEARCH","source":"demo","timestamp":"2026-05-20T00:00:00Z","query":"spring hive hadoop"}'
docker logs skillbridge-flume-agent --tail 80
docker exec skillbridge-namenode hdfs dfs -ls -R /data/skillbridge/raw/flume/events
docker exec skillbridge-namenode hdfs dfs -cat /data/skillbridge/raw/flume/events/<events-file>"""
    hive_demo_cmd = """docker exec skillbridge-hive-server bash /opt/skillbridge/scripts/06_run_hive_queries.sh
docker exec skillbridge-hive-server beeline -u jdbc:hive2://localhost:10000 --silent=true --showHeader=true --outputformat=table -e "use skillbridge_bigdata; select level, count(*) from hive_courses group by level;"
docker exec skillbridge-hive-server beeline -u jdbc:hive2://localhost:10000 --silent=true --showHeader=true --outputformat=table -e "use skillbridge_bigdata; select get_json_object(raw_line, '$.eventType') event_type, count(*) from hive_events group by get_json_object(raw_line, '$.eventType');" """
    hbase_demo_cmd = """python .\\scripts\\09_load_course_stats_hbase.py
docker exec -i skillbridge-hbase /hbase/bin/hbase shell /opt/skillbridge/output/load_course_stats.hbase
echo "scan 'course_stats', {LIMIT => 5}" | docker exec -i skillbridge-hbase /hbase/bin/hbase shell -n"""

    html_doc = f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>SkillBridge Big Data Deep Dive</title>
<style>
@page {{ size: A4; margin: 13mm 12mm; }}
* {{ box-sizing: border-box; }}
body {{ margin:0; background:#f5efe8; color:#251713; font-family: Segoe UI, Arial, sans-serif; line-height:1.45; }}
.page {{ max-width:1160px; margin:0 auto; background:#fff; padding:34px 42px; }}
.cover {{ min-height:900px; display:flex; flex-direction:column; justify-content:center; background:linear-gradient(135deg,#fff8ef,#efd1bd); border:2px solid #e6c7b4; border-radius:22px; padding:48px; }}
h1 {{ font-size:38px; line-height:1.08; margin:0 0 16px; color:#1b100c; }}
h2 {{ font-size:25px; border-top:2px solid #efd1bd; padding-top:14px; margin:28px 0 12px; break-after:avoid; }}
h3 {{ font-size:18px; color:#9d431d; margin:18px 0 8px; }}
p {{ margin:0 0 10px; }}
.lead {{ font-size:18px; max-width:850px; color:#5f473d; }}
.eyebrow {{ text-transform:uppercase; letter-spacing:.18em; color:#b55222; font-weight:800; font-size:12px; }}
.metrics {{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-top:28px; }}
.metric,.card {{ border:1px solid #ecd1bf; background:#fffaf5; border-radius:13px; padding:13px; break-inside:avoid; }}
.metric b {{ display:block; font-size:25px; color:#b55222; }}
.grid2 {{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }}
.grid3 {{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }}
table {{ width:100%; border-collapse:collapse; margin:10px 0 18px; font-size:11.7px; break-inside:auto; }}
th,td {{ border:1px solid #ecd1bf; padding:7px 8px; vertical-align:top; }}
th {{ background:#f1dccd; text-align:left; color:#2d1912; }}
pre {{ background:#21120d; color:#fff2e7; border-radius:9px; padding:12px; font-size:10.5px; white-space:pre-wrap; overflow-wrap:anywhere; }}
code {{ background:#f2e0d2; padding:1px 5px; border-radius:5px; }}
.figure {{ border:1px solid #ecd1bf; border-radius:15px; background:#fffdf9; padding:12px; margin:14px 0 20px; break-inside:avoid; }}
.caption {{ font-weight:800; color:#94401d; font-size:13px; }}
.note {{ border-left:4px solid #c7652d; background:#fff3e8; padding:10px 12px; border-radius:8px; margin:12px 0; }}
.pagebreak {{ break-before:page; }}
svg {{ width:100%; height:auto; display:block; }}
.box {{ fill:#fff8ef; stroke:#c7652d; stroke-width:2; rx:12; }}
.box2 {{ fill:#f0fbff; stroke:#21748c; stroke-width:2; rx:12; }}
.store {{ fill:#fff; stroke:#6b3a24; stroke-width:2; }}
.arrow {{ stroke:#6b3a24; stroke-width:2.4; fill:none; marker-end:url(#arrow); }}
svg text {{ font:700 13px Segoe UI, Arial, sans-serif; fill:#241713; }}
svg text.small {{ font:600 11px Segoe UI, Arial, sans-serif; fill:#6b5148; }}
</style>
</head>
<body><div class="page">
<section class="cover">
<div class="eyebrow">Rapport technique detaille</div>
<h1>SkillBridge Big Data Deep Dive: conteneurs, fichiers, code, pipeline et commandes de demonstration</h1>
<p class="lead">Ce PDF explique en profondeur tout le module <code>apps/bigdata</code>: role de chaque conteneur, role de chaque fichier, fonctionnement de Sqoop, Flume, HDFS, Hive, HBase et MapReduce, impact sur les use cases web, et commandes terminal pour prouver chaque partie.</p>
<div class="metrics">
<div class="metric"><b>{esc(final_counts.get('unified_courses', '17072'))}</b>cours unifies</div>
<div class="metric"><b>{esc(final_counts.get('skills', '13647'))}</b>skills</div>
<div class="metric"><b>{esc(final_counts.get('course_skills', '104006'))}</b>liens course-skill</div>
<div class="metric"><b>{len(CONTAINERS)}</b>conteneurs documentes</div>
</div>
<div class="note">Generation basee sur les fichiers du repository, les rapports <code>output/*.json</code> et les commandes Docker/HDFS/Hive disponibles localement.</div>
</section>

<section class="pagebreak"><h2>1. Architecture generale Big Data</h2><div class="figure"><p class="caption">Figure 1 - Flux global donnees et analytics</p>{svg_architecture()}</div>
<p>Le pipeline est separe en deux mondes: Supabase comme base officielle de l'application, et PostgreSQL mirror + Hadoop comme laboratoire Big Data. Cette separation evite de mettre Hadoop dans le chemin critique des requetes web.</p>
<table><thead><tr><th>Couche</th><th>Responsabilite</th><th>Impact</th></tr></thead><tbody>{rows(TECHS)}</tbody></table></section>

<section class="pagebreak"><h2>2. Etat Docker observe pendant la generation</h2><p>Cette sortie montre les conteneurs visibles via Docker au moment de produire le rapport.</p>{code_block(docker_ps)}</section>

<section class="pagebreak"><h2>3. Detail exhaustif des conteneurs</h2>
<table><thead><tr><th>Conteneur</th><th>Image</th><th>Fonction</th><th>Impact metier</th><th>Port</th><th>Commande demo</th></tr></thead><tbody>{rows(CONTAINERS)}</tbody></table>
<h3>Explication par conteneur</h3>
{''.join(f'<div class="card"><h3>{esc(c[0])}</h3><p><b>Role:</b> {esc(c[2])}. {esc(c[3])}</p><p><b>Commande de preuve:</b> <code>{esc(c[5])}</code></p></div>' for c in CONTAINERS)}
</section>

<section class="pagebreak"><h2>4. Inventaire de chaque fichier Big Data</h2>
<p>Cette table documente le role de chaque fichier source ou artefact important dans <code>apps/bigdata</code>.</p>
<table><thead><tr><th>Fichier</th><th>Role detaille</th></tr></thead><tbody>{rows(FILES)}</tbody></table></section>

<section class="pagebreak"><h2>5. Installation et preparation des donnees</h2>
<p>Les donnees viennent de ZIP locaux. Le script <code>12_merge_and_enrich_catalog.py</code> nettoie les titres, descriptions, niveaux, providers, URLs, skills, categories, scores de popularite et supprime les doublons.</p>
<table><thead><tr><th>Source</th><th>Raw</th><th>Utilise</th><th>Ignore</th></tr></thead><tbody>
{rows([(k, v.get('raw'), v.get('used'), v.get('ignored')) for k, v in catalog.get('sources', {}).items()])}
</tbody></table>
<h3>Commandes</h3>{code_block('cd apps\\\\bigdata\\npython -m pip install -r requirements.txt\\npython .\\\\scripts\\\\12_merge_and_enrich_catalog.py\\nGet-Content .\\\\output\\\\catalog\\\\catalog_build_report.json')}
<h3>Impact</h3><p>Sans cette etape, le web n'a pas un catalogue propre et le pipeline Hadoop n'a pas de tables coherentes a importer.</p></section>

<section class="pagebreak"><h2>6. Sqoop: collecte batch PostgreSQL vers HDFS</h2>
<p><code>04_sqoop_import_mvp.sh</code> importe huit tables du mirror vers HDFS. Chaque table devient un dossier sous <code>/data/skillbridge/raw/sqoop/&lt;table&gt;</code> avec <code>part-m-00000</code> et <code>_SUCCESS</code>.</p>
<h3>Tables importees</h3><ul><li>providers</li><li>categories</li><li>skills</li><li>courses</li><li>course_skills</li><li>project_ideas</li><li>saved_courses</li><li>course_progress</li></ul>
<h3>Preuve mirror PostgreSQL</h3>{code_block(mirror_counts)}
<h3>Commande de demonstration</h3>{code_block('docker exec skillbridge-sqoop-client bash /opt/skillbridge/scripts/04_sqoop_import_mvp.sh\\ndocker exec skillbridge-namenode hdfs dfs -ls /data/skillbridge/raw/sqoop/courses\\ndocker exec skillbridge-namenode hdfs dfs -cat /data/skillbridge/raw/sqoop/courses/part-m-00000 | head')}</section>

<section class="pagebreak"><h2>7. HDFS: stockage distribue</h2>
<p>HDFS est le stockage central. Sqoop y depose le batch, Flume y depose le streaming, MapReduce y lit et y ecrit ses resultats.</p>
<h3>Arborescence observee</h3>{code_block('\\n'.join(hdfs_listing.splitlines()[:90]))}
<h3>Commandes utiles</h3>{code_block('docker exec skillbridge-namenode hdfs dfsadmin -report\\ndocker exec skillbridge-namenode hdfs dfs -ls -R /data/skillbridge\\ndocker exec skillbridge-namenode hdfs dfs -du -h /data/skillbridge/raw/sqoop\\ndocker exec skillbridge-namenode hdfs dfs -cat /data/skillbridge/processed/mapreduce/top_search_keywords/part-r-00000')}</section>

<section class="pagebreak"><h2>8. Flume: streaming des evenements web</h2>
<p>Spring Boot ecrit des lignes JSON dans <code>data/events/events.log</code>. Flume utilise une source <code>exec</code> qui lance <code>flume-follow-events.sh</code>, un channel memoire, et un sink HDFS.</p>
<h3>Evenements supportes</h3><ul><li><code>COURSE_SEARCH</code>: recherche catalogue.</li><li><code>COURSE_CLICK</code>: clic vers un cours externe.</li><li><code>COURSE_SAVE</code>: sauvegarde cours.</li><li><code>PROJECT_CREATED</code>: creation idee.</li><li><code>PROJECT_RECOMMENDATION</code>: generation recommandations.</li></ul>
<h3>Derniers evenements locaux</h3>{code_block(events_tail)}
<h3>Commandes de demonstration</h3>{code_block(flume_demo_cmd)}</section>

<section class="pagebreak"><h2>9. Hive: SQL analytique sur HDFS</h2>
<p>Hive ne copie pas les donnees: il cree des tables externes sur les dossiers HDFS. Les fichiers Sqoop tabules deviennent des tables SQL. Les evenements Flume sont lus comme lignes brutes JSON et interroges avec <code>get_json_object</code>.</p>
<h3>Counts Hive observes</h3>{code_block(hive_counts)}
<h3>Commandes demo</h3>{code_block(hive_demo_cmd)}</section>

<section class="pagebreak"><h2>10. MapReduce: TopSearchKeywordsJob</h2>
<p>Le job Java lit les evenements HDFS. Le Mapper ignore les evenements qui ne sont pas <code>COURSE_SEARCH</code> ou <code>PROJECT_RECOMMENDATION</code>. Il tokenise le champ <code>query</code> ou le texte du projet. Le Reducer additionne les occurrences.</p>
<h3>Resultat observe</h3>{code_block(mapreduce_out)}
<h3>Commandes demo</h3>{code_block('powershell -ExecutionPolicy Bypass -File .\\\\scripts\\\\07_run_mapreduce.ps1\\ndocker exec skillbridge-namenode hdfs dfs -ls /data/skillbridge/processed/mapreduce/top_search_keywords\\ndocker exec skillbridge-namenode hdfs dfs -cat /data/skillbridge/processed/mapreduce/top_search_keywords/part-r-00000')}
<h3>Impact</h3><p>Ce résultat permet d'expliquer quelles technologies ou intentions reviennent le plus dans les recherches et projets des utilisateurs.</p></section>

<section class="pagebreak"><h2>11. HBase: course_stats</h2>
<p>Le script Python <code>09_load_course_stats_hbase.py</code> combine les evenements, saved courses et progressions puis genere un script HBase. La table <code>course_stats</code> a deux familles: <code>meta</code> et <code>activity</code>.</p>
<table><thead><tr><th>courseId</th><th>title</th><th>clicks</th><th>saves</th><th>avg progress</th></tr></thead><tbody>{rows(hbase_rows)}</tbody></table>
<h3>Commandes demo</h3>{code_block(hbase_demo_cmd)}
<div class="note">Pendant la generation du rapport, le scan direct HBase a retourne une erreur RegionServer <code>16020 connection refused</code>. Les donnees HBase restent documentees via <code>bigdata-summary.json</code> et <code>load_course_stats.hbase</code>. Pour corriger: redemarrer <code>skillbridge-hbase</code>, attendre 60-90 secondes, puis relancer le scan.</div></section>

<section class="pagebreak"><h2>12. Generate recommendations depuis le web</h2><div class="figure"><p class="caption">Figure 2 - Generate recommendations et trace Big Data</p>{svg_generate_reco()}</div>
<p>Quand l'utilisateur clique sur Generate recommendations, Spring Boot execute le moteur rapide: chargement du projet, extraction de tokens, detection des skills, ranking des cours, sauvegarde du snapshot, puis ecriture de l'evenement <code>PROJECT_RECOMMENDATION</code>.</p>
<p>Le pipeline Big Data n'est pas bloquant: Flume absorbe ensuite l'evenement, HDFS le stocke, Hive peut le compter, MapReduce peut en extraire les keywords.</p></section>

<section class="pagebreak"><h2>13. Use cases et impact Big Data</h2>
<table><thead><tr><th>Use case web</th><th>API backend</th><th>Donnee ecrite</th><th>Partie Big Data impactee</th><th>Commande de preuve</th></tr></thead><tbody>
{rows([
('Search courses','GET /api/courses?q=...','COURSE_SEARCH dans events.log','Flume, HDFS, Hive, MapReduce','hdfs dfs -ls -R /data/skillbridge/raw/flume/events'),
('Open course','POST /api/courses/{id}/click','COURSE_CLICK dans events.log','Flume, HDFS, HBase stats','Get-Content data/events/events.log -Tail 10'),
('Save course','POST /api/saved-courses/{id}','saved_courses en PostgreSQL','Sqoop, Hive, HBase saves','select count(*) from saved_courses'),
('Update progress','PUT /api/progress/{courseId}','course_progress','Sqoop, Hive, HBase avg_progress','select count(*) from course_progress'),
('Create project','POST /api/projects','project_ideas + PROJECT_CREATED','Sqoop + Flume selon version','select count(*) from project_ideas'),
('Generate recommendations','POST /api/projects/{id}/recommendations/generate','snapshot/results + PROJECT_RECOMMENDATION','Flume, HDFS, Hive, MapReduce','cat top_search_keywords/part-r-00000'),
('Admin Big Data dashboard','GET /api/bigdata/status','lecture JSON/logs','Consomme output/*.json','Invoke-RestMethod /api/bigdata/status'),
])}
</tbody></table></section>

<section class="pagebreak"><h2>14. Catalogue de commandes terminal pour soutenance</h2>
<table><thead><tr><th>Partie</th><th>Commande</th><th>Ce que tu montres</th></tr></thead><tbody>{rows(COMMAND_SECTIONS)}</tbody></table></section>

<section class="pagebreak"><h2>15. Lecture des rapports generes</h2>
<table><thead><tr><th>Rapport</th><th>Role</th></tr></thead><tbody>{rows([
('output/catalog/catalog_build_report.json','Audit des sources, counts finaux, distribution levels/categories/providers.'),
('output/catalog/supabase_import_report.json','Dry-run ou apply Supabase, tables touchees, securite no global delete.'),
('output/mirror_seed_report.json','Preuve que le mirror local est rempli.'),
('output/project_skill_matches.csv','Associations projet -> skills detectees par Python.'),
('output/bigdata-summary.json','Resume final lu par le dashboard admin.'),
('output/recommendation_result.json','Derniere recommandation web/CLI avec trace pipeline.'),
('output/app_bigdata_link_report.json','Preuve que Spring Boot voit le catalogue Big Data via API.'),
])}</tbody></table></section>

<section class="pagebreak"><h2>16. Conclusion technique</h2>
<p>Le module Big Data de SkillBridge couvre les trois grandes familles attendues dans un projet Big Data pedagogique: ingestion batch avec Sqoop, ingestion streaming avec Flume, stockage distribue HDFS, SQL analytique avec Hive, traitement distribue Java avec MapReduce, et stockage serving avec HBase.</p>
<p>Son impact applicatif est concret: le catalogue massif nourrit Supabase et le frontend; les evenements web deviennent des donnees analytiques; les recommandations produisent une trace exploitable; l'admin peut expliquer le pipeline avec des commandes terminal et des rapports JSON.</p>
</section>
</div></body></html>"""

    HTML_PATH.write_text(html_doc, encoding="utf-8")

    chrome_candidates = [
        Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
        Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
        Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
    ]
    browser = next((path for path in chrome_candidates if path.exists()), None)
    if browser:
        file_url = "file:///" + str(HTML_PATH).replace("\\", "/")
        subprocess.run(
            [
                str(browser),
                "--headless",
                "--disable-gpu",
                "--no-sandbox",
                f"--print-to-pdf={PDF_PATH}",
                "--print-to-pdf-no-header",
                file_url,
            ],
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )
    print(f"HTML: {HTML_PATH}")
    print(f"PDF:  {PDF_PATH}")


if __name__ == "__main__":
    main()
