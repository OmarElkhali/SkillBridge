import csv
import json
import os
import random
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_values


ROOT = Path(__file__).resolve().parents[1]
CATALOG_DIR = ROOT / "output" / "catalog"
SCHEMA_SQL = ROOT / "sql" / "postgres" / "01_create_seed_schema.sql"
PROJECT_SQL = ROOT / "sql" / "postgres" / "02_seed_project_ideas.sql"
REPORT_PATH = ROOT / "output" / "mirror_seed_report.json"


def env(name, default):
    return os.environ.get(name, default)


DB = {
    "host": env("BIGDATA_DB_HOST", "localhost"),
    "port": int(env("BIGDATA_DB_PORT", "5433")),
    "dbname": env("BIGDATA_DB_NAME", "skillbridge"),
    "user": env("BIGDATA_DB_USER", "skillbridge"),
    "password": env("BIGDATA_DB_PASSWORD", "skillbridge"),
}


def load_csv(name):
    path = CATALOG_DIR / name
    if not path.exists():
        raise FileNotFoundError(f"Missing catalog file: {path}. Run 12_merge_and_enrich_catalog.py first.")
    with path.open("r", newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))


def as_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def execute_file(conn, path):
    with conn.cursor() as cur:
        cur.execute(path.read_text(encoding="utf-8"))


def reset_catalog_tables(conn):
    requested = [
        "recommendation_results",
        "recommendation_snapshots",
        "project_detected_skills",
        "course_progress",
        "saved_courses",
        "course_skills",
        "courses",
        "skills",
        "providers",
        "categories",
    ]
    with conn.cursor() as cur:
        cur.execute(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = ANY(%s)",
            (requested,),
        )
        existing = {row[0] for row in cur.fetchall()}
        ordered = [table for table in requested if table in existing]
        if ordered:
            cur.execute("TRUNCATE TABLE " + ", ".join(ordered) + " RESTART IDENTITY CASCADE")


def load_catalog(conn):
    providers = load_csv("providers.csv")
    categories = load_csv("categories.csv")
    skills = load_csv("skills.csv")
    courses = load_csv("courses_staging.csv")
    course_skills = load_csv("course_skills_staging.csv")

    with conn.cursor() as cur:
        execute_values(
            cur,
            """
            INSERT INTO providers(id, name, website_url, description)
            VALUES %s
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                website_url = EXCLUDED.website_url,
                description = EXCLUDED.description,
                updated_at = now()
            """,
            [(as_int(r["id"]), r["name"], r.get("website_url") or None, r.get("description") or None) for r in providers],
            page_size=1000,
        )
        execute_values(
            cur,
            """
            INSERT INTO categories(id, name, slug, description)
            VALUES %s
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                slug = EXCLUDED.slug,
                description = EXCLUDED.description,
                updated_at = now()
            """,
            [(as_int(r["id"]), r["name"], r["slug"], r.get("description") or None) for r in categories],
            page_size=1000,
        )
        execute_values(
            cur,
            """
            INSERT INTO skills(id, name, slug, description)
            VALUES %s
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                slug = EXCLUDED.slug,
                description = EXCLUDED.description,
                updated_at = now()
            """,
            [(as_int(r["id"]), r["name"], r["slug"], r.get("description") or None) for r in skills],
            page_size=2000,
        )
        execute_values(
            cur,
            """
            INSERT INTO courses(
                id, title, slug, description, level, language, source_url,
                thumbnail_url, category_id, provider_id, published, popularity_score
            )
            VALUES %s
            ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                slug = EXCLUDED.slug,
                description = EXCLUDED.description,
                level = EXCLUDED.level,
                language = EXCLUDED.language,
                source_url = EXCLUDED.source_url,
                thumbnail_url = EXCLUDED.thumbnail_url,
                category_id = EXCLUDED.category_id,
                provider_id = EXCLUDED.provider_id,
                published = EXCLUDED.published,
                popularity_score = EXCLUDED.popularity_score,
                updated_at = now()
            """,
            [
                (
                    as_int(r["id"]),
                    r["title"],
                    r["slug"],
                    r["description"],
                    r["level"],
                    r["language"],
                    r["source_url"],
                    r.get("thumbnail_url") or None,
                    as_int(r["category_id"]),
                    as_int(r["provider_id"]),
                    r.get("published", "true").lower() == "true",
                    as_int(r["popularity_score"]),
                )
                for r in courses
            ],
            page_size=1000,
        )
        execute_values(
            cur,
            "INSERT INTO course_skills(course_id, skill_id) VALUES %s ON CONFLICT DO NOTHING",
            [(as_int(r["course_id"]), as_int(r["skill_id"])) for r in course_skills],
            page_size=5000,
        )
        for table in ["providers", "categories", "skills", "courses"]:
            cur.execute(
                "SELECT setval(pg_get_serial_sequence(%s, 'id'), COALESCE((SELECT MAX(id) FROM " + table + "), 1), true)",
                (table,),
            )


def seed_activity(conn):
    random.seed(42)
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users ORDER BY id")
        user_ids = [row[0] for row in cur.fetchall()]
        cur.execute("SELECT id FROM courses ORDER BY popularity_score DESC, id LIMIT 80")
        course_ids = [row[0] for row in cur.fetchall()]
        if not user_ids or not course_ids:
            return
        for index, course_id in enumerate(course_ids[:40]):
            cur.execute(
                "INSERT INTO saved_courses(user_id, course_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (user_ids[index % len(user_ids)], course_id),
            )
        for index, course_id in enumerate(course_ids[:50]):
            progress = random.choice([10, 15, 25, 40, 60, 80, 100])
            status = "COMPLETED" if progress == 100 else "IN_PROGRESS"
            cur.execute(
                """
                INSERT INTO course_progress(user_id, course_id, status, progress_percent, started_at, completed_at, last_updated_at)
                VALUES (%s, %s, %s, %s, now() - interval '7 days', CASE WHEN %s = 100 THEN now() ELSE NULL END, now())
                ON CONFLICT (user_id, course_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    progress_percent = EXCLUDED.progress_percent,
                    completed_at = EXCLUDED.completed_at,
                    last_updated_at = now()
                """,
                (user_ids[index % len(user_ids)], course_id, status, progress, progress),
            )


def counts(conn):
    tables = ["categories", "providers", "skills", "courses", "course_skills", "project_ideas", "saved_courses", "course_progress"]
    result = {}
    with conn.cursor() as cur:
        for table in tables:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            result[table] = cur.fetchone()[0]
    return result


def main():
    conn = psycopg2.connect(**DB)
    conn.autocommit = False
    try:
        execute_file(conn, SCHEMA_SQL)
        execute_file(conn, PROJECT_SQL)
        reset_catalog_tables(conn)
        load_catalog(conn)
        seed_activity(conn)
        report = {
            "source": str(CATALOG_DIR),
            "target": {"host": DB["host"], "port": DB["port"], "dbname": DB["dbname"]},
            "counts": counts(conn),
            "supabase_written": False,
            "note": "This script writes only to the local PostgreSQL mirror used by Sqoop.",
        }
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
