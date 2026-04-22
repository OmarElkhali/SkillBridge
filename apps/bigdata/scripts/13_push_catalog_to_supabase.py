import argparse
import csv
import json
import os
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_batch, execute_values


ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT.parents[1]
CATALOG_DIR = ROOT / "output" / "catalog"
BACKEND_ENV = ROOT.parent / "backend" / ".env"
REPORT_PATH = CATALOG_DIR / "supabase_import_report.json"

PROJECT_REF = "kjhnukvekqkhixqymdgy"


def read_env_file(path):
    values = {}
    if not path.exists():
        return values
    for raw_line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def db_config():
    env_file = read_env_file(BACKEND_ENV)
    password = os.environ.get("SUPABASE_DB_PASSWORD") or env_file.get("DB_PASSWORD")
    if not password:
        raise RuntimeError(f"DB_PASSWORD not found in {BACKEND_ENV}.")
    return {
        "host": os.environ.get("SUPABASE_DB_HOST", "aws-0-eu-west-1.pooler.supabase.com"),
        "port": int(os.environ.get("SUPABASE_DB_PORT", "5432")),
        "dbname": os.environ.get("SUPABASE_DB_NAME", "postgres"),
        "user": os.environ.get("SUPABASE_DB_USER", f"postgres.{PROJECT_REF}"),
        "password": password,
        "sslmode": "require",
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


def fetch_existing(conn, table, key_columns):
    columns = ["id"] + key_columns
    with conn.cursor() as cur:
        cur.execute(f"SELECT {', '.join(columns)} FROM {table}")
        rows = cur.fetchall()
    result = {}
    for row in rows:
        row_id = row[0]
        for index, column in enumerate(key_columns, start=1):
            value = row[index]
            if value is not None:
                result[(column, str(value).lower())] = row_id
    return result


def max_id(conn, table):
    with conn.cursor() as cur:
        cur.execute(f"SELECT COALESCE(MAX(id), 0) FROM {table}")
        return cur.fetchone()[0]


def count_table(conn, table):
    with conn.cursor() as cur:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        return cur.fetchone()[0]


def allocate_ids(items, existing, key_priority, start_id):
    final_id_by_staging = {}
    inserts = []
    updates = []
    next_id = start_id + 1
    for item in items:
        found = None
        for column in key_priority:
            value = item.get(column)
            if value:
                found = existing.get((column, value.lower()))
                if found:
                    break
        if found:
            item["_final_id"] = found
            updates.append(item)
        else:
            item["_final_id"] = next_id
            next_id += 1
            inserts.append(item)
        final_id_by_staging[as_int(item["id"])] = item["_final_id"]
    return final_id_by_staging, inserts, updates


def build_plan(conn):
    providers = load_csv("providers.csv")
    categories = load_csv("categories.csv")
    skills = load_csv("skills.csv")
    courses = load_csv("courses_staging.csv")
    course_skills = load_csv("course_skills_staging.csv")

    provider_existing = fetch_existing(conn, "providers", ["name"])
    category_existing = fetch_existing(conn, "categories", ["slug", "name"])
    skill_existing = fetch_existing(conn, "skills", ["slug", "name"])
    course_existing = fetch_existing(conn, "courses", ["slug"])

    provider_map, provider_inserts, provider_updates = allocate_ids(providers, provider_existing, ["name"], max_id(conn, "providers"))
    category_map, category_inserts, category_updates = allocate_ids(categories, category_existing, ["slug", "name"], max_id(conn, "categories"))
    skill_map, skill_inserts, skill_updates = allocate_ids(skills, skill_existing, ["slug", "name"], max_id(conn, "skills"))
    course_map, course_inserts, course_updates = allocate_ids(courses, course_existing, ["slug"], max_id(conn, "courses"))

    resolved_course_skills = []
    for row in course_skills:
        course_id = course_map.get(as_int(row["course_id"]))
        skill_id = skill_map.get(as_int(row["skill_id"]))
        if course_id and skill_id:
            resolved_course_skills.append((course_id, skill_id))

    return {
        "providers": (providers, provider_inserts, provider_updates, provider_map),
        "categories": (categories, category_inserts, category_updates, category_map),
        "skills": (skills, skill_inserts, skill_updates, skill_map),
        "courses": (courses, course_inserts, course_updates, course_map),
        "course_skills": resolved_course_skills,
    }


def dry_run_report(conn, plan):
    return {
        "mode": "dry-run",
        "supabase_project_ref": PROJECT_REF,
        "before_counts": {table: count_table(conn, table) for table in ["providers", "categories", "skills", "courses", "course_skills"]},
        "planned": {
            "providers": {"insert": len(plan["providers"][1]), "update": len(plan["providers"][2])},
            "categories": {"insert": len(plan["categories"][1]), "update": len(plan["categories"][2])},
            "skills": {"insert": len(plan["skills"][1]), "update": len(plan["skills"][2])},
            "courses": {"insert": len(plan["courses"][1]), "update": len(plan["courses"][2])},
            "course_skills": {"insert_ignore_conflicts": len(plan["course_skills"])},
        },
        "safety": {
            "touched_tables": ["providers", "categories", "skills", "courses", "course_skills"],
            "untouched_tables": [
                "users",
                "roles",
                "project_ideas",
                "project_detected_skills",
                "saved_courses",
                "course_progress",
                "recommendation_snapshots",
                "recommendation_results",
            ],
            "global_delete": False,
        },
    }


def apply_plan(conn, plan):
    report = dry_run_report(conn, plan)
    report["mode"] = "apply"

    provider_inserts = plan["providers"][1]
    provider_updates = plan["providers"][2]
    category_inserts = plan["categories"][1]
    category_updates = plan["categories"][2]
    skill_inserts = plan["skills"][1]
    skill_updates = plan["skills"][2]
    course_inserts = plan["courses"][1]
    course_updates = plan["courses"][2]
    provider_map = plan["providers"][3]
    category_map = plan["categories"][3]
    course_skills = plan["course_skills"]
    invalid_skill_names = ("nan", "none", "null", "n/a", "na", "unknown")

    with conn.cursor() as cur:
        if provider_inserts:
            execute_values(
                cur,
                """
                INSERT INTO providers(id, name, website_url, description, created_at, updated_at)
                VALUES %s
                ON CONFLICT (name) DO UPDATE SET
                    website_url = COALESCE(NULLIF(EXCLUDED.website_url, ''), providers.website_url),
                    description = EXCLUDED.description,
                    updated_at = now()
                """,
                [(r["_final_id"], r["name"], r.get("website_url") or None, r.get("description") or None) for r in provider_inserts],
                template="(%s, %s, %s, %s, now(), now())",
                page_size=500,
            )
        if provider_updates:
            execute_batch(
                cur,
                "UPDATE providers SET website_url = COALESCE(NULLIF(%s, ''), website_url), description = %s, updated_at = now() WHERE id = %s",
                [(r.get("website_url") or "", r.get("description") or None, r["_final_id"]) for r in provider_updates],
                page_size=500,
            )

        if category_inserts:
            execute_values(
                cur,
                """
                INSERT INTO categories(id, name, slug, description, created_at, updated_at)
                VALUES %s
                ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, updated_at = now()
                """,
                [(r["_final_id"], r["name"], r["slug"], r.get("description") or None) for r in category_inserts],
                template="(%s, %s, %s, %s, now(), now())",
                page_size=500,
            )
        if category_updates:
            execute_batch(
                cur,
                "UPDATE categories SET name = %s, description = %s, updated_at = now() WHERE id = %s",
                [(r["name"], r.get("description") or None, r["_final_id"]) for r in category_updates],
                page_size=500,
            )

        if skill_inserts:
            execute_values(
                cur,
                """
                INSERT INTO skills(id, name, slug, description, created_at, updated_at)
                VALUES %s
                ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, updated_at = now()
                """,
                [(r["_final_id"], r["name"], r["slug"], r.get("description") or None) for r in skill_inserts],
                template="(%s, %s, %s, %s, now(), now())",
                page_size=1000,
            )
        if skill_updates:
            execute_batch(
                cur,
                "UPDATE skills SET description = %s, updated_at = now() WHERE id = %s",
                [(r.get("description") or None, r["_final_id"]) for r in skill_updates],
                page_size=1000,
            )

        if course_inserts:
            execute_values(
                cur,
                """
                INSERT INTO courses(
                    id, title, slug, description, level, language, source_url, thumbnail_url,
                    category_id, provider_id, published, popularity_score, created_at, updated_at
                )
                VALUES %s
                ON CONFLICT (slug) DO UPDATE SET
                    title = EXCLUDED.title,
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
                        r["_final_id"],
                        r["title"],
                        r["slug"],
                        r["description"],
                        r["level"],
                        r["language"],
                        r["source_url"],
                        r.get("thumbnail_url") or None,
                        category_map[as_int(r["category_id"])],
                        provider_map[as_int(r["provider_id"])],
                        r.get("published", "true").lower() == "true",
                        as_int(r["popularity_score"]),
                    )
                    for r in course_inserts
                ],
                template="(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now(), now())",
                page_size=500,
            )
        if course_updates:
            execute_batch(
                cur,
                """
                UPDATE courses SET
                    title = %s,
                    description = %s,
                    level = %s,
                    language = %s,
                    source_url = %s,
                    thumbnail_url = %s,
                    category_id = %s,
                    provider_id = %s,
                    published = %s,
                    popularity_score = %s,
                    updated_at = now()
                WHERE id = %s
                """,
                [
                    (
                        r["title"],
                        r["description"],
                        r["level"],
                        r["language"],
                        r["source_url"],
                        r.get("thumbnail_url") or None,
                        category_map[as_int(r["category_id"])],
                        provider_map[as_int(r["provider_id"])],
                        r.get("published", "true").lower() == "true",
                        as_int(r["popularity_score"]),
                        r["_final_id"],
                    )
                    for r in course_updates
                ],
                page_size=500,
            )

        if course_skills:
            execute_values(
                cur,
                "INSERT INTO course_skills(course_id, skill_id) VALUES %s ON CONFLICT DO NOTHING",
                course_skills,
                page_size=5000,
            )

        cur.execute(
            """
            DELETE FROM course_skills cs
            USING skills s
            WHERE cs.skill_id = s.id
              AND lower(s.name) = ANY(%s)
            """,
            (list(invalid_skill_names),),
        )
        removed_invalid_relations = cur.rowcount
        cur.execute("DELETE FROM skills WHERE lower(name) = ANY(%s)", (list(invalid_skill_names),))
        removed_invalid_skills = cur.rowcount

    report["after_counts"] = {table: count_table(conn, table) for table in ["providers", "categories", "skills", "courses", "course_skills"]}
    report["cleanup_invalid_skills"] = {
        "removed_course_skills": removed_invalid_relations,
        "removed_skills": removed_invalid_skills,
        "invalid_names": list(invalid_skill_names),
    }
    return report


def main():
    parser = argparse.ArgumentParser(description="Safe upsert of the generated SkillBridge catalog into Supabase.")
    parser.add_argument("--apply", action="store_true", help="Actually write to Supabase. Without this flag, the script only reports planned changes.")
    args = parser.parse_args()

    CATALOG_DIR.mkdir(parents=True, exist_ok=True)
    conn = psycopg2.connect(**db_config())
    conn.autocommit = False
    try:
        plan = build_plan(conn)
        if args.apply:
            report = apply_plan(conn, plan)
            conn.commit()
        else:
            report = dry_run_report(conn, plan)
            conn.rollback()
    except Exception as exc:
        conn.rollback()
        report = {"mode": "apply" if args.apply else "dry-run", "error": str(exc)}
        REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
        raise
    finally:
        conn.close()

    REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"Report written to {REPORT_PATH}")


if __name__ == "__main__":
    main()
