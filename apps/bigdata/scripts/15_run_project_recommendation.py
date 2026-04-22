import argparse
import json
import os
import re
from pathlib import Path

import psycopg2


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "output" / "recommendation_result.json"
BACKEND_ENV = ROOT.parent / "backend" / ".env"
PROJECT_REF = "kjhnukvekqkhixqymdgy"

CATEGORY_RULES = [
    ("Big Data", ["hadoop", "hdfs", "hive", "hbase", "sqoop", "flume", "mapreduce", "big data"]),
    ("Data Engineering", ["data engineer", "data pipeline", "etl", "airflow", "spark", "warehouse", "data lake"]),
    ("Application Security", ["security", "secure", "jwt", "oauth", "authentication", "authorization", "cyber"]),
    ("Backend Development", ["spring", "spring boot", "java", "rest api", "api", "backend", "microservice"]),
    ("Databases", ["postgresql", "postgres", "mysql", "sql", "database", "mongodb", "nosql"]),
    ("Cloud Computing", ["aws", "azure", "cloud", "kubernetes", "serverless", "terraform"]),
    ("DevOps", ["docker", "ci/cd", "devops", "linux", "jenkins", "ansible", "deployment"]),
    ("Web Development", ["react", "angular", "vue", "javascript", "typescript", "html", "css", "frontend"]),
    ("Machine Learning", ["machine learning", "deep learning", "neural", "ai", "tensorflow", "pytorch", "data science"]),
    ("Product and UX", ["ux", "ui", "user experience", "product", "figma"]),
    ("Business and Management", ["business", "management", "marketing", "finance", "leadership"]),
]

STOPWORDS = {
    "a",
    "an",
    "and",
    "avec",
    "build",
    "de",
    "des",
    "du",
    "for",
    "i",
    "je",
    "la",
    "le",
    "les",
    "to",
    "un",
    "une",
    "using",
    "want",
    "with",
}


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


def db_config(source):
    if source == "supabase":
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
    return {
        "host": os.environ.get("BIGDATA_DB_HOST", "localhost"),
        "port": int(os.environ.get("BIGDATA_DB_PORT", "5433")),
        "dbname": os.environ.get("BIGDATA_DB_NAME", "skillbridge"),
        "user": os.environ.get("BIGDATA_DB_USER", "skillbridge"),
        "password": os.environ.get("BIGDATA_DB_PASSWORD", "skillbridge"),
    }


def normalize_text(value):
    return re.sub(r"\s+", " ", (value or "").lower()).strip()


def tokens(text):
    return [token for token in re.findall(r"[a-zA-Z0-9+#.]+", text.lower()) if token not in STOPWORDS and len(token) > 1]


def fetch_skills(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT id, name FROM skills ORDER BY length(name) DESC, name")
        return [{"id": row[0], "name": row[1]} for row in cur.fetchall()]


def fetch_courses(conn):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                c.id,
                c.title,
                c.description,
                c.popularity_score,
                p.name AS provider_name,
                cat.name AS category_name,
                COALESCE(string_agg(DISTINCT s.name, '|' ORDER BY s.name), '') AS skills
            FROM courses c
            JOIN providers p ON p.id = c.provider_id
            JOIN categories cat ON cat.id = c.category_id
            LEFT JOIN course_skills cs ON cs.course_id = c.id
            LEFT JOIN skills s ON s.id = cs.skill_id
            WHERE c.published = true
            GROUP BY c.id, c.title, c.description, c.popularity_score, p.name, cat.name
            """
        )
        return [
            {
                "id": row[0],
                "title": row[1],
                "description": row[2] or "",
                "popularity_score": row[3] or 0,
                "provider": row[4],
                "category": row[5],
                "skills": [skill for skill in (row[6] or "").split("|") if skill],
            }
            for row in cur.fetchall()
        ]


def detect_categories(project_text):
    text = f" {normalize_text(project_text)} "
    project_tokens = set(tokens(project_text))
    result = []
    for category, keywords in CATEGORY_RULES:
        matched = []
        for keyword in keywords:
            if len(keyword) <= 3:
                if keyword in project_tokens:
                    matched.append(keyword)
            elif keyword in text:
                matched.append(keyword)
        if matched:
            result.append({"name": category, "matched_keywords": matched})
    return result


def detect_skills(project_text, all_skills, limit=20):
    text = f" {normalize_text(project_text)} "
    project_tokens = set(tokens(project_text))
    detected = []
    seen = set()
    for skill in all_skills:
        name = skill["name"]
        lowered = normalize_text(name)
        skill_tokens = set(tokens(name))
        if not lowered or lowered in seen or lowered in STOPWORDS or not skill_tokens:
            continue
        phrase_match = len(lowered) > 3 and f" {lowered} " in text
        token_match = skill_tokens and skill_tokens.issubset(project_tokens) and len(skill_tokens) <= 4
        alias_match = False
        if lowered == "rest api" and ("api" in project_tokens or "rest" in project_tokens):
            alias_match = True
        if lowered == "postgresql" and ("postgres" in project_tokens or "postgresql" in project_tokens):
            alias_match = True
        if phrase_match or token_match or alias_match:
            seen.add(lowered)
            detected.append({"id": skill["id"], "name": name, "match": "phrase" if phrase_match else "token"})
            if len(detected) >= limit:
                break
    return detected


def score_course(course, project_text, project_tokens, detected_skills, detected_categories):
    title = normalize_text(course["title"])
    description = normalize_text(course["description"])
    category = course["category"]
    course_skill_names = {normalize_text(skill) for skill in course["skills"]}
    detected_skill_names = {normalize_text(skill["name"]) for skill in detected_skills}
    detected_category_names = {item["name"] for item in detected_categories}

    title_hits = [token for token in project_tokens if token in title]
    title_match_score = min(30, len(title_hits) * 6)
    if any(skill in title for skill in detected_skill_names):
        title_match_score = min(30, title_match_score + 12)

    exact_skill_hits = sorted(detected_skill_names.intersection(course_skill_names))
    description_skill_hits = [skill for skill in detected_skill_names if skill and skill in description]
    skill_match_score = min(40, len(exact_skill_hits) * 10 + len(description_skill_hits) * 4)

    category_match_score = 20 if category in detected_category_names else 0
    if not category_match_score and any(keyword in f"{title} {description}" for item in detected_categories for keyword in item["matched_keywords"]):
        category_match_score = 10

    popularity_bonus = min(10, int(course["popularity_score"]) / 10)
    total = min(100, round(title_match_score + skill_match_score + category_match_score + popularity_bonus, 2))

    reasons = []
    if title_hits:
        reasons.append("title match: " + ", ".join(title_hits[:5]))
    if exact_skill_hits:
        reasons.append("skill match: " + ", ".join(skill.title() for skill in exact_skill_hits[:5]))
    if category_match_score:
        reasons.append(f"category match: {category}")
    if popularity_bonus:
        reasons.append(f"popularity bonus: {round(popularity_bonus, 1)}")

    return {
        "course_id": course["id"],
        "title": course["title"],
        "provider": course["provider"],
        "category": course["category"],
        "skills": course["skills"][:10],
        "score": total,
        "score_breakdown": {
            "title_match_score": title_match_score,
            "skill_match_score": skill_match_score,
            "category_match_score": category_match_score,
            "popularity_bonus": round(popularity_bonus, 2),
        },
        "why": "; ".join(reasons) if reasons else "fallback ranking by catalog popularity",
    }


def recommend(conn, project_text, limit):
    all_skills = fetch_skills(conn)
    all_courses = fetch_courses(conn)
    detected_skills = detect_skills(project_text, all_skills)
    detected_categories = detect_categories(project_text)
    project_tokens = set(tokens(project_text))
    scored = [score_course(course, project_text, project_tokens, detected_skills, detected_categories) for course in all_courses]
    scored = [item for item in scored if item["score"] > 0]
    scored.sort(key=lambda item: (-item["score"], item["title"]))
    return {
        "project": project_text,
        "detected_skills": detected_skills,
        "matched_categories": detected_categories,
        "recommendations": scored[:limit],
    }


def print_text(result):
    print("\nDetected skills:")
    if result["detected_skills"]:
        for skill in result["detected_skills"]:
            print(f"- {skill['name']} ({skill['match']})")
    else:
        print("- none")

    print("\nMatched categories:")
    if result["matched_categories"]:
        for category in result["matched_categories"]:
            print(f"- {category['name']} via {', '.join(category['matched_keywords'][:5])}")
    else:
        print("- General Technology")

    print("\nRecommended courses:")
    if not result["recommendations"]:
        print("- No deterministic match found. Rebuild the catalog or use more technical keywords.")
        return
    for index, item in enumerate(result["recommendations"], start=1):
        print(f"{index}. {item['title']}")
        print(f"   Provider: {item['provider']}")
        print(f"   Category: {item['category']}")
        print(f"   Score: {item['score']}")
        print(f"   Why: {item['why']}")


def main():
    parser = argparse.ArgumentParser(description="Terminal project-to-course recommendation for SkillBridge.")
    parser.add_argument("--project", help="Project idea text. If omitted, the script asks in the terminal.")
    parser.add_argument("--source", choices=["mirror", "supabase"], default="mirror", help="Read from local PostgreSQL mirror or Supabase.")
    parser.add_argument("--limit", type=int, default=8)
    parser.add_argument("--json", action="store_true", help="Print JSON only.")
    args = parser.parse_args()

    project_text = args.project or input("Project idea: ").strip()
    if not project_text:
        raise SystemExit("Project text is required.")

    conn = psycopg2.connect(**db_config(args.source))
    try:
        result = recommend(conn, project_text, args.limit)
    finally:
        conn.close()

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print_text(result)
        print(f"\nJSON output: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
