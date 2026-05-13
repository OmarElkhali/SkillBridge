import json
import os
import re
from collections import Counter
from pathlib import Path

import psycopg2


ROOT = Path(__file__).resolve().parents[1]
EVENTS = ROOT / "data" / "events" / "events.log"
EVENTS_EXAMPLE = ROOT / "data" / "events" / "events.log.example"
HBASE_SCRIPT = ROOT / "output" / "load_course_stats.hbase"
SUMMARY_JSON = ROOT / "output" / "bigdata-summary.json"
STOP_WORDS = {"a", "an", "and", "avec", "de", "for", "in", "of", "the", "to", "with"}


def env(name, default):
    return os.environ.get(name, default)


DB = {
    "host": env("BIGDATA_DB_HOST", "localhost"),
    "port": int(env("BIGDATA_DB_PORT", "5433")),
    "dbname": env("BIGDATA_DB_NAME", "skillbridge"),
    "user": env("BIGDATA_DB_USER", "skillbridge"),
    "password": env("BIGDATA_DB_PASSWORD", "skillbridge"),
}


def read_events():
    path = EVENTS if EVENTS.exists() else EVENTS_EXAMPLE
    result = []
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            result.append(json.loads(line))
        except json.JSONDecodeError:
            pass
    return result


def hbase_escape(value):
    return str(value).replace("\\", "\\\\").replace("'", "\\'")


def top_keywords(events):
    counter = Counter()
    for event in events:
        event_type = event.get("eventType")
        if event_type == "COURSE_SEARCH":
            text = event.get("query", "")
        elif event_type == "PROJECT_RECOMMENDATION":
            text = f"{event.get('projectTitle', '')} {event.get('projectDescription', '')}"
        else:
            continue
        for token in re.findall(r"[a-z0-9+#.]+", text.lower()):
            if token not in STOP_WORDS and len(token) > 1:
                counter[token] += 1
    return [{"keyword": key, "count": count} for key, count in counter.most_common(5)]


def main():
    events = read_events()
    clicks = Counter(int(event["courseId"]) for event in events if event.get("eventType") == "COURSE_CLICK" and event.get("courseId"))
    clicked_ids = sorted(clicks.keys())
    conn = psycopg2.connect(**DB)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                WITH selected_courses AS (
                    (SELECT id FROM courses ORDER BY popularity_score DESC, id LIMIT 50)
                    UNION
                    SELECT unnest(%s::bigint[])
                )
                SELECT c.id, c.title,
                       COALESCE(s.total_saves, 0),
                       COALESCE(p.avg_progress, 0)
                FROM courses c
                JOIN selected_courses selected ON selected.id = c.id
                LEFT JOIN (SELECT course_id, COUNT(*) AS total_saves FROM saved_courses GROUP BY course_id) s ON s.course_id = c.id
                LEFT JOIN (SELECT course_id, ROUND(AVG(progress_percent), 2) AS avg_progress FROM course_progress GROUP BY course_id) p ON p.course_id = c.id
                ORDER BY c.popularity_score DESC, c.id
                """,
                (clicked_ids,),
            )
            rows = cur.fetchall()
            cur.execute(
                """
                SELECT p.id, p.title, COALESCE(string_agg(s.name, ', ' ORDER BY s.name), '')
                FROM project_ideas p
                LEFT JOIN project_detected_skills pds ON pds.project_idea_id = p.id
                LEFT JOIN skills s ON s.id = pds.skill_id
                GROUP BY p.id, p.title
                ORDER BY p.id
                LIMIT 5
                """
            )
            project_rows = cur.fetchall()
    finally:
        conn.close()

    HBASE_SCRIPT.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "if exists 'course_stats'",
        "  disable 'course_stats'",
        "  drop 'course_stats'",
        "end",
        "create 'course_stats', 'activity', 'meta'",
    ]
    top_courses = []
    course_stats_sample = []
    for course_id, title, saves, avg_progress in rows:
        click_count = clicks.get(course_id, 0)
        lines.append(f"put 'course_stats', '{course_id}', 'meta:title', '{hbase_escape(title)}'")
        lines.append(f"put 'course_stats', '{course_id}', 'activity:clicks', '{click_count}'")
        lines.append(f"put 'course_stats', '{course_id}', 'activity:saves', '{saves}'")
        lines.append(f"put 'course_stats', '{course_id}', 'activity:avg_progress', '{avg_progress}'")
        course_stats_sample.append({
            "courseId": course_id,
            "meta:title": title,
            "activity:clicks": click_count,
            "activity:saves": int(saves),
            "activity:avg_progress": float(avg_progress),
        })
        if click_count:
            top_courses.append({"courseId": course_id, "title": title, "clicks": click_count})
    lines.append("scan 'course_stats', {LIMIT => 10}")
    lines.append("exit")
    HBASE_SCRIPT.write_text("\n".join(lines) + "\n", encoding="utf-8")

    top_courses.sort(key=lambda item: item["clicks"], reverse=True)
    summary = {
        "generated": True,
        "message": "Generated from the SkillBridge Big Data MVP pipeline.",
        "namenode": {
            "role": "HDFS metadata manager",
            "verifyCommand": "docker compose exec namenode hdfs dfsadmin -report",
        },
        "datanodes": {
            "role": "HDFS block storage workers",
            "defaultScale": 2,
            "verifyCommand": "docker compose ps datanode",
        },
        "flume": {
            "source": "data/events/events.log",
            "sink": "/data/skillbridge/raw/flume/events",
            "eventCountFromLocalLog": len(events),
        },
        "hdfs": {
            "rawFlumeEventsPath": "/data/skillbridge/raw/flume/events",
            "mapReduceOutputPath": "/data/skillbridge/processed/mapreduce/top_search_keywords",
            "verifyCommand": "docker compose exec namenode hdfs dfs -ls -R /data/skillbridge",
        },
        "hive": {
            "database": "skillbridge_bigdata",
            "tables": ["hive_courses", "hive_events", "hive_saved_courses", "hive_course_progress"],
            "verifyCommand": "docker compose exec hive-server beeline -u jdbc:hive2://localhost:10000 -e \"use skillbridge_bigdata; select count(*) from hive_events;\"",
        },
        "mapreduce": {
            "job": "TopSearchKeywordsJob",
            "inputPath": "/data/skillbridge/raw/flume/events",
            "outputPath": "/data/skillbridge/processed/mapreduce/top_search_keywords",
            "topSearchKeywords": top_keywords(events),
        },
        "topSearchKeywords": top_keywords(events),
        "topClickedCourses": top_courses[:5],
        "course_stats": {
            "sample": course_stats_sample[:10],
            "totalGeneratedRows": len(course_stats_sample),
        },
        "hbase": {
            "table": "course_stats",
            "sample": course_stats_sample[:10],
        },
        "projectSkillMatches": [
            {"projectId": row[0], "projectTitle": row[1], "skills": [skill for skill in row[2].split(", ") if skill]}
            for row in project_rows
        ],
    }
    SUMMARY_JSON.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"Wrote HBase load script to {HBASE_SCRIPT}.")
    print(f"Wrote backend summary JSON to {SUMMARY_JSON}.")


if __name__ == "__main__":
    main()
