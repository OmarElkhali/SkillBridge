import ast
import csv
import hashlib
import html
import json
import math
import re
import zipfile
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlparse, urlunparse


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "catalog"

ARCHIVE_FINAL = Path(r"C:\Users\omare\Downloads\archive (1).zip")
ARCHIVE_ALL = Path(r"C:\Users\omare\Downloads\archive.zip")
ARCHIVE_RICH = Path(r"C:\Users\omare\Downloads\archive (2).zip")

UNIFIED_COLUMNS = [
    "source_dataset",
    "source_record_id",
    "title",
    "slug",
    "description",
    "level",
    "language",
    "source_url",
    "thumbnail_url",
    "provider_name",
    "provider_slug",
    "category_name",
    "category_slug",
    "skills",
    "rating",
    "reviews_count",
    "students_count",
    "duration_hours",
    "popularity_score",
    "content_type",
    "dedupe_key",
]

CATEGORIES = [
    ("Backend Development", "Courses about APIs, backend services, Java, Spring, Node, and server-side design."),
    ("Application Security", "Courses about authentication, authorization, JWT, secure coding, and security testing."),
    ("Data Engineering", "Courses about data pipelines, ETL, Spark, Airflow, warehousing, and data platforms."),
    ("Big Data", "Courses about Hadoop, HDFS, Hive, HBase, Sqoop, Flume, and distributed processing."),
    ("Machine Learning", "Courses about machine learning, deep learning, artificial intelligence, and data science."),
    ("Cloud Computing", "Courses about cloud platforms, containers, Kubernetes, and cloud architecture."),
    ("Web Development", "Courses about frontend, HTML, CSS, JavaScript, React, Angular, and full-stack web."),
    ("Databases", "Courses about SQL, PostgreSQL, MongoDB, data modeling, and database administration."),
    ("DevOps", "Courses about Docker, CI/CD, Linux, automation, monitoring, and deployment."),
    ("Product and UX", "Courses about product thinking, UX, UI, design, and user research."),
    ("Business and Management", "Courses about business, leadership, analytics, finance, and management."),
    ("General Technology", "General technical or learning content that does not match a narrower category."),
]

CATEGORY_RULES = [
    ("Big Data", ["hadoop", "hdfs", "hive", "hbase", "sqoop", "flume", "mapreduce", "big data", "distributed data"]),
    ("Data Engineering", ["data engineer", "data pipeline", "etl", "airflow", "spark", "databricks", "warehouse", "lakehouse", "data lake"]),
    ("Application Security", ["security", "secure", "jwt", "oauth", "authentication", "authorization", "cryptography", "penetration", "cyber"]),
    ("Backend Development", ["spring", "spring boot", "java", "rest api", "api", "backend", "node.js", "django", "flask", "microservice"]),
    ("Databases", ["postgresql", "mysql", "sql", "database", "mongodb", "nosql", "data modeling", "relational"]),
    ("Cloud Computing", ["aws", "azure", "google cloud", "cloud", "kubernetes", "serverless", "terraform"]),
    ("DevOps", ["docker", "ci/cd", "devops", "linux", "jenkins", "ansible", "monitoring", "deployment"]),
    ("Web Development", ["react", "angular", "vue", "javascript", "typescript", "html", "css", "frontend", "web development"]),
    ("Machine Learning", ["machine learning", "deep learning", "neural", "ai", "artificial intelligence", "tensorflow", "pytorch", "data science"]),
    ("Product and UX", ["ux", "ui", "user experience", "product", "design thinking", "figma", "research"]),
    ("Business and Management", ["business", "management", "marketing", "finance", "leadership", "strategy", "entrepreneurship"]),
]

PROVIDER_ALIASES = {
    "edx": "edX",
    "ed x": "edX",
    "coursera": "Coursera",
    "udacity": "Udacity",
    "udemy": "Udemy",
    "youtube": "YouTube",
    "freecodecamp": "freeCodeCamp",
    "free code camp": "freeCodeCamp",
    "mit ocw": "MIT OCW",
    "mit opencourseware": "MIT OCW",
    "openlearn": "OpenLearn",
    "linkedin learning": "LinkedIn Learning",
    "khan academy": "Khan Academy",
}

KNOWN_PROVIDER_URLS = {
    "Coursera": "https://www.coursera.org",
    "edX": "https://www.edx.org",
    "Udacity": "https://www.udacity.com",
    "Udemy": "https://www.udemy.com",
    "YouTube": "https://www.youtube.com",
    "freeCodeCamp": "https://www.freecodecamp.org",
    "MIT OCW": "https://ocw.mit.edu",
    "OpenLearn": "https://www.open.edu/openlearn",
    "LinkedIn Learning": "https://www.linkedin.com/learning",
    "Khan Academy": "https://www.khanacademy.org",
}


def clean(value, max_length=None):
    value = "" if value is None else str(value)
    value = html.unescape(value).replace("\ufeff", " ")
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    if max_length:
        value = value[:max_length].rstrip()
    return value


def slugify(value, fallback="item"):
    value = clean(value).lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value or fallback


def normalize_url(value):
    value = clean(value)
    if not value:
        return ""
    parsed = urlparse(value)
    if not parsed.scheme or not parsed.netloc:
        return value
    path = re.sub(r"/+$", "", parsed.path)
    return urlunparse((parsed.scheme.lower(), parsed.netloc.lower(), path, "", "", ""))


def stable_hash(value, length=10):
    return hashlib.sha1(value.encode("utf-8", errors="ignore")).hexdigest()[:length]


def first_value(value):
    if isinstance(value, list):
        for item in value:
            result = first_value(item)
            if result:
                return result
        return ""
    if isinstance(value, dict):
        for key in ("name", "title", "label", "skill", "value", "key"):
            if key in value:
                result = first_value(value.get(key))
                if result:
                    return result
        return ""
    return clean(value)


def parse_listish(value):
    if value is None:
        return []
    if isinstance(value, list):
        result = []
        for item in value:
            if isinstance(item, dict):
                result.append(first_value(item))
            else:
                result.extend(parse_listish(item) if isinstance(item, list) else [clean(item)])
        return [item for item in result if item]
    if isinstance(value, dict):
        return [first_value(value)] if first_value(value) else []
    text = clean(value)
    if not text:
        return []
    if text.startswith("[") and text.endswith("]"):
        try:
            return parse_listish(ast.literal_eval(text))
        except (SyntaxError, ValueError):
            pass
    parts = re.split(r"\s*,\s*|\s*;\s*|\s*\|\s*", text)
    return [part for part in parts if part]


def normalize_skill(value):
    value = clean(value, 120)
    value = re.sub(r"\s+", " ", value).strip(" -_/")
    if not value or len(value) < 2 or value.lower() in {"nan", "none", "null", "n/a", "na", "unknown"}:
        return ""
    lowered = value.lower()
    aliases = {
        "js": "JavaScript",
        "nodejs": "Node.js",
        "node js": "Node.js",
        "postgres": "PostgreSQL",
        "postgres sql": "PostgreSQL",
        "rest": "REST API",
        "api": "REST API",
        "ml": "Machine Learning",
        "ai": "Artificial Intelligence",
    }
    if lowered in aliases:
        return aliases[lowered]
    if value.isupper() and len(value) <= 6:
        return value
    return " ".join(part if part in {"and", "or", "of", "for"} else part[:1].upper() + part[1:] for part in value.split())


def normalize_skills(values, title="", description=""):
    found = []
    for value in values:
        found.extend(parse_listish(value))
    text = f"{title} {description}".lower()
    inferred = [
        ("Spring Boot", ["spring boot"]),
        ("JWT", ["jwt"]),
        ("PostgreSQL", ["postgresql", "postgres"]),
        ("REST API", ["rest api", " api "]),
        ("Hadoop", ["hadoop"]),
        ("Hive", ["hive"]),
        ("HBase", ["hbase"]),
        ("Sqoop", ["sqoop"]),
        ("Flume", ["flume"]),
        ("MapReduce", ["mapreduce", "map reduce"]),
        ("Docker", ["docker"]),
        ("Kubernetes", ["kubernetes"]),
        ("React", ["react"]),
        ("Python", ["python"]),
        ("Java", ["java"]),
        ("SQL", [" sql "]),
        ("Machine Learning", ["machine learning"]),
    ]
    for skill, keywords in inferred:
        if any(keyword in f" {text} " for keyword in keywords):
            found.append(skill)
    seen = set()
    result = []
    for item in found:
        skill = normalize_skill(item)
        key = slugify(skill)
        if skill and key not in seen:
            seen.add(key)
            result.append(skill)
    return result[:30]


def normalize_provider(value):
    name = clean(first_value(value), 120)
    if not name:
        return "Unknown Provider"
    lowered = re.sub(r"[^a-z0-9]+", " ", name.lower()).strip()
    return PROVIDER_ALIASES.get(lowered, name)


def normalize_level(value):
    text = " ".join(parse_listish(value)) if isinstance(value, list) else clean(value)
    text = text.lower()
    if text in {"0", "beginner", "introductory", "intro", "basic"} or any(word in text for word in ["beginner", "introductory", "intro"]):
        return "BEGINNER"
    if text in {"2", "advanced", "expert"} or any(word in text for word in ["advanced", "expert"]):
        return "ADVANCED"
    return "INTERMEDIATE"


def normalize_language(value):
    lang = first_value(value)
    return clean(lang, 80) or "English"


def to_float(value):
    try:
        text = clean(value).replace(",", "")
        return float(text) if text else 0.0
    except (TypeError, ValueError):
        return 0.0


def to_int(value):
    try:
        text = clean(value).replace(",", "")
        if not text:
            return 0
        return int(float(text))
    except (TypeError, ValueError):
        return 0


def popularity_score(rating=0, reviews=0, students=0, recent=0, best=0):
    rating_value = min(max(to_float(rating), 0), 5)
    reviews_value = max(to_int(reviews), 0)
    students_value = max(to_int(students), 0)
    recent_value = max(to_int(recent), 0)
    best_value = 1 if clean(best).lower() in {"1", "true", "yes"} else 0
    score = rating_value * 10
    score += min(math.log1p(reviews_value) * 5, 20)
    score += min(math.log1p(students_value + recent_value) * 3, 25)
    score += best_value * 5
    return int(round(min(score, 100)))


def derive_category(title, description, skills, subject=""):
    text = f"{title} {description} {' '.join(skills)} {subject}".lower()
    for name, keywords in CATEGORY_RULES:
        if any(keyword in text for keyword in keywords):
            return name
    return "General Technology"


def make_description(title, description, skills):
    description = clean(description)
    if len(description) >= 40:
        return description[:4000]
    if skills:
        return clean(f"{title} course covering {', '.join(skills[:8])}.", 4000)
    return clean(f"{title} course for building practical technology skills.", 4000)


def quality_score(row):
    score = 0
    score += min(len(row["description"]) // 120, 10)
    score += 12 if row["source_url"].startswith("http") and "skillbridge.local" not in row["source_url"] else 0
    score += min(len(row["skills"].split("|")) if row["skills"] else 0, 12)
    score += 5 if to_float(row["rating"]) else 0
    score += 5 if to_int(row["reviews_count"]) else 0
    score += 4 if row["thumbnail_url"] else 0
    score += int(row["popularity_score"]) / 10
    return score


def make_course(source_dataset, source_record_id, title, provider, description="", level="", language="", source_url="", thumbnail_url="", skills=None, rating=0, reviews=0, students=0, duration=0, content_type="COURSE", subject="", recent=0, best=0):
    title = clean(title, 180)
    if not title:
        return None
    provider_name = normalize_provider(provider)
    provider_slug = slugify(provider_name)
    skill_list = normalize_skills(skills or [], title, description)
    description = make_description(title, description, skill_list)
    source_url = normalize_url(source_url)
    if not source_url:
        source_url = f"https://skillbridge.local/catalog/{slugify(title)}-{provider_slug}"
    category_name = derive_category(title, description, skill_list, subject)
    base_slug = slugify(f"{title}-{provider_name}")[:190].rstrip("-")
    url_key = normalize_url(source_url)
    dedupe_key = f"url:{url_key}" if url_key and "skillbridge.local" not in url_key else f"title-provider:{slugify(title)}:{provider_slug}"
    return {
        "source_dataset": source_dataset,
        "source_record_id": clean(source_record_id, 120) or stable_hash(f"{source_dataset}:{title}:{provider_name}"),
        "title": title,
        "slug": base_slug,
        "description": description,
        "level": normalize_level(level),
        "language": normalize_language(language),
        "source_url": source_url,
        "thumbnail_url": clean(thumbnail_url, 500),
        "provider_name": provider_name,
        "provider_slug": provider_slug,
        "category_name": category_name,
        "category_slug": slugify(category_name),
        "skills": "|".join(skill_list),
        "rating": str(to_float(rating) or ""),
        "reviews_count": str(to_int(reviews)),
        "students_count": str(to_int(students)),
        "duration_hours": str(to_float(duration) or ""),
        "popularity_score": str(popularity_score(rating, reviews, students, recent, best)),
        "content_type": clean(content_type or "COURSE", 40).upper(),
        "dedupe_key": dedupe_key,
    }


def read_csv_from_zip(path, member):
    with zipfile.ZipFile(path) as archive:
        with archive.open(member) as raw:
            yield from csv.DictReader(line.decode("utf-8-sig", errors="replace") for line in raw)


def read_json_from_zip(path, member):
    with zipfile.ZipFile(path) as archive:
        return json.loads(archive.read(member).decode("utf-8", errors="replace"))


def load_final_cleaned(report):
    rows = []
    for index, row in enumerate(read_csv_from_zip(ARCHIVE_FINAL, "final_cleaned_dataset.csv"), start=1):
        report["sources"]["final_cleaned_dataset.csv"]["raw"] += 1
        course = make_course(
            "final_cleaned_dataset.csv",
            index,
            row.get("Course_Name"),
            row.get("Platform"),
            "",
            row.get("Level"),
            "English",
            "",
            "",
            [row.get("Skills")],
            row.get("Rating"),
            0,
            row.get("Number of students"),
            0,
            "COURSE",
        )
        if course:
            rows.append(course)
            report["sources"]["final_cleaned_dataset.csv"]["used"] += 1
    return rows


def load_all_courses(report):
    rows = []
    for row in read_csv_from_zip(ARCHIVE_ALL, "all_courses.csv"):
        report["sources"]["all_courses.csv"]["raw"] += 1
        course = make_course(
            "all_courses.csv",
            row.get("id"),
            row.get("course_name"),
            row.get("provider"),
            row.get("description"),
            "",
            "English",
            row.get("url"),
            "",
            [],
            row.get("rating"),
            row.get("reviews"),
            0,
            row.get("duration_in_hours"),
            "COURSE",
            "",
            0,
            row.get("best_of_all_time"),
        )
        if course:
            rows.append(course)
            report["sources"]["all_courses.csv"]["used"] += 1
    return rows


def load_coursera(report):
    rows = []
    for index, row in enumerate(read_json_from_zip(ARCHIVE_RICH, "processed_coursera_data.json"), start=1):
        report["sources"]["processed_coursera_data.json"]["raw"] += 1
        content_type = clean(row.get("type")).lower()
        if content_type not in {"course", "project"}:
            report["sources"]["processed_coursera_data.json"]["ignored"] += 1
            continue
        course = make_course(
            "processed_coursera_data.json",
            row.get("url") or index,
            row.get("course_name"),
            row.get("organization") or row.get("provider") or "Coursera",
            row.get("description"),
            row.get("level"),
            "English",
            row.get("url"),
            "",
            [row.get("skills")],
            row.get("rating"),
            row.get("nu_reviews") or row.get("reviews"),
            row.get("enrollments"),
            row.get("Duration"),
            "PROJECT" if content_type == "project" else "COURSE",
            row.get("subject"),
        )
        if course:
            rows.append(course)
            report["sources"]["processed_coursera_data.json"]["used"] += 1
    return rows


def edx_skill_names(value):
    result = []
    for item in parse_listish(value):
        result.append(item)
    if isinstance(value, list):
        for item in value:
            if isinstance(item, dict) and item.get("skill"):
                result.append(item.get("skill"))
    return result


def load_edx(report):
    rows = []
    for index, row in enumerate(read_json_from_zip(ARCHIVE_RICH, "edx_courses.json"), start=1):
        report["sources"]["edx_courses.json"]["raw"] += 1
        if clean(row.get("product")).lower() != "course":
            report["sources"]["edx_courses.json"]["ignored"] += 1
            continue
        description = " ".join(
            clean(row.get(key))
            for key in ("primary_description", "secondary_description", "tertiary_description")
            if clean(row.get(key))
        )
        provider = first_value(row.get("partner")) or first_value(row.get("owners")) or "edX"
        course = make_course(
            "edx_courses.json",
            row.get("uuid") or row.get("objectID") or index,
            row.get("title"),
            provider,
            description,
            row.get("level"),
            row.get("language"),
            row.get("marketing_url") or row.get("external_url"),
            row.get("card_image_url"),
            edx_skill_names(row.get("skills")),
            0,
            0,
            row.get("recent_enrollment_count"),
            row.get("weeks_to_complete"),
            "COURSE",
            " ".join(parse_listish(row.get("subject"))),
            row.get("recent_enrollment_count"),
        )
        if course:
            rows.append(course)
            report["sources"]["edx_courses.json"]["used"] += 1
    return rows


def dedupe(rows, report):
    best = {}
    for row in rows:
        key = row["dedupe_key"]
        if key not in best or quality_score(row) > quality_score(best[key]):
            best[key] = row
    report["deduplicated_records"] = len(rows) - len(best)
    result = sorted(best.values(), key=lambda item: (item["provider_name"].lower(), item["title"].lower()))
    used = {}
    for row in result:
        base = row["slug"][:200].rstrip("-") or "course"
        slug = base
        if slug in used:
            slug = f"{base}-{stable_hash(row['dedupe_key'], 8)}"[:220].rstrip("-")
        used[slug] = True
        row["slug"] = slug
    return result


def write_csv(path, columns, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)


def build_seed_files(courses):
    providers = {}
    skills = {}
    categories = {slugify(name): {"name": name, "slug": slugify(name), "description": description} for name, description in CATEGORIES}

    for course in courses:
        providers.setdefault(
            course["provider_slug"],
            {
                "name": course["provider_name"],
                "website_url": KNOWN_PROVIDER_URLS.get(course["provider_name"], ""),
                "description": f"Course provider imported from SkillBridge catalog: {course['provider_name']}.",
            },
        )
        categories.setdefault(
            course["category_slug"],
            {
                "name": course["category_name"],
                "slug": course["category_slug"],
                "description": f"Courses categorized as {course['category_name']}.",
            },
        )
        for skill_name in course["skills"].split("|"):
            if not skill_name:
                continue
            skill_slug = slugify(skill_name)
            skills.setdefault(
                skill_slug,
                {"name": skill_name, "slug": skill_slug, "description": f"Skill imported from catalog: {skill_name}."},
            )

    provider_rows = []
    provider_id_by_slug = {}
    for index, (provider_slug, provider) in enumerate(sorted(providers.items()), start=1):
        provider_id_by_slug[provider_slug] = index
        provider_rows.append({"id": index, **provider})

    category_rows = []
    category_id_by_slug = {}
    for index, (category_slug, category) in enumerate(sorted(categories.items()), start=1):
        category_id_by_slug[category_slug] = index
        category_rows.append({"id": index, **category})

    skill_rows = []
    skill_id_by_slug = {}
    for index, (skill_slug, skill) in enumerate(sorted(skills.items()), start=1):
        skill_id_by_slug[skill_slug] = index
        skill_rows.append({"id": index, **skill})

    course_rows = []
    course_skill_rows = []
    for index, course in enumerate(courses, start=1):
        course_rows.append(
            {
                "id": index,
                "title": course["title"],
                "slug": course["slug"],
                "description": course["description"],
                "level": course["level"],
                "language": course["language"],
                "source_url": course["source_url"],
                "thumbnail_url": course["thumbnail_url"],
                "category_id": category_id_by_slug[course["category_slug"]],
                "provider_id": provider_id_by_slug[course["provider_slug"]],
                "published": "true",
                "popularity_score": course["popularity_score"],
            }
        )
        for skill_name in course["skills"].split("|"):
            if not skill_name:
                continue
            course_skill_rows.append({"course_id": index, "skill_id": skill_id_by_slug[slugify(skill_name)]})

    return provider_rows, category_rows, skill_rows, course_rows, course_skill_rows


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    report = {
        "sources": defaultdict(lambda: {"raw": 0, "used": 0, "ignored": 0}),
        "ignored_files": {
            "combined_dataset.json": "Combined duplicate source, not used directly.",
            "edx_programs.json": "Programs/certificates, not unit courses.",
            "edx_degree_programs.json": "Degree programs, not unit courses.",
            "edx_executive_education_paidstuff.json": "Executive/paid offers, not MVP course catalog.",
            "combine_preprocessing.py": "Historical preprocessing script, not part of final flow.",
        },
    }

    rows = []
    rows.extend(load_final_cleaned(report))
    rows.extend(load_all_courses(report))
    rows.extend(load_coursera(report))
    rows.extend(load_edx(report))
    courses = dedupe(rows, report)
    providers, categories, skills, staging_courses, course_skills = build_seed_files(courses)

    write_csv(OUTPUT_DIR / "unified_courses.csv", UNIFIED_COLUMNS, courses)
    write_csv(OUTPUT_DIR / "providers.csv", ["id", "name", "website_url", "description"], providers)
    write_csv(OUTPUT_DIR / "categories.csv", ["id", "name", "slug", "description"], categories)
    write_csv(OUTPUT_DIR / "skills.csv", ["id", "name", "slug", "description"], skills)
    write_csv(
        OUTPUT_DIR / "courses_staging.csv",
        ["id", "title", "slug", "description", "level", "language", "source_url", "thumbnail_url", "category_id", "provider_id", "published", "popularity_score"],
        staging_courses,
    )
    write_csv(OUTPUT_DIR / "course_skills_staging.csv", ["course_id", "skill_id"], course_skills)

    report["final_counts"] = {
        "unified_courses": len(courses),
        "providers": len(providers),
        "categories": len(categories),
        "skills": len(skills),
        "course_skills": len(course_skills),
    }
    report["level_distribution"] = dict(Counter(course["level"] for course in courses))
    report["category_distribution"] = dict(Counter(course["category_name"] for course in courses))
    report["provider_top_20"] = dict(Counter(course["provider_name"] for course in courses).most_common(20))

    serializable_report = json.loads(json.dumps(report, default=dict))
    (OUTPUT_DIR / "catalog_build_report.json").write_text(json.dumps(serializable_report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(report["final_counts"], indent=2))
    print(f"Catalog files written to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
