import argparse
import json
import os
from pathlib import Path

import psycopg2
from psycopg2 import sql


ROOT = Path(__file__).resolve().parents[1]
BACKEND_ENV = ROOT.parent / "backend" / ".env"
REPORT_PATH = ROOT / "output" / "catalog" / "supabase_sequence_sync_report.json"
PROJECT_REF = "kjhnukvekqkhixqymdgy"

DEFAULT_TABLES = [
    "roles",
    "users",
    "categories",
    "providers",
    "skills",
    "courses",
    "project_ideas",
    "project_detected_skills",
    "recommendation_snapshots",
    "recommendation_results",
    "saved_courses",
    "course_progress",
]


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


def sync_sequences(conn, tables):
    report = {}
    with conn.cursor() as cur:
        for table in tables:
            cur.execute("SELECT to_regclass(%s)", (table,))
            if cur.fetchone()[0] is None:
                report[table] = {"exists": False, "synced": False}
                continue

            cur.execute("SELECT pg_get_serial_sequence(%s, 'id')", (table,))
            sequence_name = cur.fetchone()[0]
            if not sequence_name:
                report[table] = {"exists": True, "sequence": None, "synced": False}
                continue

            cur.execute(sql.SQL("SELECT COALESCE(MAX(id), 0) FROM {}").format(sql.Identifier(table)))
            max_value = cur.fetchone()[0]
            if max_value > 0:
                cur.execute("SELECT setval(%s, %s, true)", (sequence_name, max_value))
            else:
                cur.execute("SELECT setval(%s, 1, false)", (sequence_name,))

            report[table] = {
                "exists": True,
                "sequence": sequence_name,
                "max_id": max_value,
                "synced": True,
            }
    return report


def main():
    parser = argparse.ArgumentParser(description="Synchronize Supabase PostgreSQL identity sequences after explicit-id imports.")
    parser.add_argument("--tables", nargs="*", default=DEFAULT_TABLES, help="Tables to inspect and sync.")
    args = parser.parse_args()

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = psycopg2.connect(**db_config())
    conn.autocommit = False
    try:
        report = {
            "mode": "apply",
            "tables": sync_sequences(conn, args.tables),
        }
        conn.commit()
    except Exception as exc:
        conn.rollback()
        report = {"mode": "apply", "error": str(exc)}
        REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
        raise
    finally:
        conn.close()

    REPORT_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"Report written to {REPORT_PATH}")


if __name__ == "__main__":
    main()
