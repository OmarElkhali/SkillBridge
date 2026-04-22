#!/usr/bin/env bash
set -euo pipefail

BASE="${HDFS_BASE:-/data/skillbridge}"

hdfs dfs -mkdir -p \
  "$BASE/raw/sqoop/roles" \
  "$BASE/raw/sqoop/users" \
  "$BASE/raw/sqoop/categories" \
  "$BASE/raw/sqoop/providers" \
  "$BASE/raw/sqoop/skills" \
  "$BASE/raw/sqoop/courses" \
  "$BASE/raw/sqoop/course_skills" \
  "$BASE/raw/sqoop/project_ideas" \
  "$BASE/raw/flume/events" \
  "$BASE/hive" \
  "$BASE/processed/mapreduce" \
  "$BASE/processed/python" \
  "$BASE/export/hbase"

hdfs dfs -ls -R "$BASE" | head -80

