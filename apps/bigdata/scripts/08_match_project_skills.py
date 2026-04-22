import csv
import os
import re
from pathlib import Path

import psycopg2


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "project_skill_matches.csv"
MAX_MATCHES_PER_PROJECT = int(os.environ.get("MAX_MATCHES_PER_PROJECT", "25"))
STOPWORDS = {
    "a",
    "an",
    "and",
    "api",
    "app",
    "application",
    "build",
    "course",
    "data",
    "for",
    "in",
    "of",
    "on",
    "or",
    "platform",
    "project",
    "system",
    "the",
    "to",
    "tool",
    "tools",
    "with",
}


def env(name, default):
    return os.environ.get(name, default)


DB = {
    "host": env("BIGDATA_DB_HOST", "localhost"),
    "port": int(env("BIGDATA_DB_PORT", "5433")),
    "dbname": env("BIGDATA_DB_NAME", "skillbridge"),
    "user": env("BIGDATA_DB_USER", "skillbridge"),
    "password": env("BIGDATA_DB_PASSWORD", "skillbridge"),
}


def tokens(text):
    raw_tokens = re.findall(r"[a-z0-9+#.]+", (text or "").lower())
    return {token for token in raw_tokens if len(token) > 1 and token not in STOPWORDS}


def main():
    matches = []
    conn = psycopg2.connect(**DB)
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name FROM skills ORDER BY id")
            skills = [(row[0], row[1], tokens(row[1])) for row in cur.fetchall()]
            cur.execute("SELECT id, title, description FROM project_ideas ORDER BY id")
            projects = cur.fetchall()
            cur.execute("DELETE FROM project_detected_skills WHERE match_source = 'PYTHON_BATCH'")
            for project_id, title, description in projects:
                project_text = f"{title} {description}".lower()
                project_tokens = tokens(project_text)
                ranked_matches = []
                for skill_id, skill_name, skill_tokens in skills:
                    overlap = project_tokens & skill_tokens
                    phrase_match = len(skill_name) > 2 and skill_name.lower() in project_text
                    if not overlap and not phrase_match:
                        continue
                    overlap_ratio = len(overlap) / max(len(skill_tokens), 1)
                    confidence = min(1.0, 0.6 + overlap_ratio * 0.35 + (0.05 if phrase_match else 0))
                    matched_keyword = " ".join(sorted(overlap))[:120] or skill_name[:120]
                    ranked_matches.append(
                        (
                            confidence,
                            len(overlap),
                            len(skill_tokens),
                            project_id,
                            skill_id,
                            skill_name,
                            matched_keyword,
                        )
                    )

                ranked_matches.sort(reverse=True)
                for confidence, _overlap_count, _skill_size, project_id, skill_id, skill_name, matched_keyword in ranked_matches[
                    :MAX_MATCHES_PER_PROJECT
                ]:
                    cur.execute(
                        """
                        INSERT INTO project_detected_skills(project_idea_id, skill_id, matched_keyword, match_source, confidence_score)
                        VALUES (%s, %s, %s, 'PYTHON_BATCH', %s)
                        ON CONFLICT (project_idea_id, skill_id, matched_keyword) DO UPDATE SET
                            confidence_score = EXCLUDED.confidence_score,
                            updated_at = now()
                        """,
                        (project_id, skill_id, matched_keyword, confidence),
                    )
                    matches.append((project_id, skill_id, skill_name, matched_keyword, round(confidence, 3)))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["project_id", "skill_id", "skill_name", "matched_keyword", "confidence_score"])
        writer.writerows(matches)
    print(f"Wrote {len(matches)} project-skill matches to {OUTPUT}.")


if __name__ == "__main__":
    main()
