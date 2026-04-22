#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${BIGDATA_DB_HOST:-postgres-mirror}"
DB_PORT="${BIGDATA_DB_PORT:-5432}"
DB_NAME="${BIGDATA_DB_NAME:-skillbridge}"
DB_USER="${BIGDATA_DB_USER:-skillbridge}"
DB_PASSWORD="${BIGDATA_DB_PASSWORD:-skillbridge}"
HDFS_BASE="${HDFS_BASE:-/data/skillbridge}"
HDFS_URI="${HDFS_URI:-hdfs://namenode:9000}"
SQOOP_MR_MODE="${SQOOP_MR_MODE:-local}"
CONNECT="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}"
SQOOP_LIB="${SQOOP_HOME:-/opt/sqoop}/lib"
POSTGRES_JAR="${SQOOP_LIB}/postgresql-42.7.4.jar"

mkdir -p "$SQOOP_LIB"

if [ ! -f "$POSTGRES_JAR" ]; then
  echo "PostgreSQL JDBC driver not found. Downloading it for Sqoop..."
  if command -v curl >/dev/null 2>&1; then
    curl -L -o "$POSTGRES_JAR" "https://repo1.maven.org/maven2/org/postgresql/postgresql/42.7.4/postgresql-42.7.4.jar"
  elif command -v wget >/dev/null 2>&1; then
    wget -O "$POSTGRES_JAR" "https://repo1.maven.org/maven2/org/postgresql/postgresql/42.7.4/postgresql-42.7.4.jar"
  else
    echo "Install curl or wget in the Sqoop container, or mount postgresql-42.7.4.jar into $SQOOP_LIB."
    exit 1
  fi
fi

import_table() {
  local table="$1"
  local target="${HDFS_BASE}/raw/sqoop/${table}"
  local mr_args=(-Dmapreduce.framework.name=local)

  if [ "$SQOOP_MR_MODE" = "yarn" ]; then
    mr_args=(
      -Dmapreduce.framework.name=yarn
      -Dyarn.resourcemanager.hostname=resourcemanager
      -Dyarn.resourcemanager.address=resourcemanager:8032
      -Dyarn.app.mapreduce.am.env=HADOOP_MAPRED_HOME=/opt/hadoop-2.7.4
      -Dmapreduce.map.env=HADOOP_MAPRED_HOME=/opt/hadoop-2.7.4
      -Dmapreduce.reduce.env=HADOOP_MAPRED_HOME=/opt/hadoop-2.7.4
    )
  fi

  hdfs dfs -fs "$HDFS_URI" -rm -r -f "$target" || true
  sqoop import \
    -Dfs.defaultFS="$HDFS_URI" \
    -Ddfs.client.use.datanode.hostname=true \
    "${mr_args[@]}" \
    --connect "$CONNECT" \
    --driver org.postgresql.Driver \
    --username "$DB_USER" \
    --password "$DB_PASSWORD" \
    --table "$table" \
    --target-dir "${HDFS_URI}${target}" \
    --as-textfile \
    --fields-terminated-by $'\t' \
    --null-string '\\N' \
    --null-non-string '\\N' \
    --num-mappers 1
}

import_table providers
import_table categories
import_table skills
import_table courses
import_table course_skills
import_table project_ideas
import_table saved_courses
import_table course_progress

hdfs dfs -fs "$HDFS_URI" -ls "${HDFS_BASE}/raw/sqoop"
