#!/usr/bin/env bash
set -euo pipefail

BASE="${HDFS_BASE:-/data/skillbridge}"
JAR="/opt/skillbridge/mapreduce/target/skillbridge-mapreduce-1.0.0.jar"
INPUT="${BASE}/raw/flume/events"
OUTPUT="${BASE}/processed/mapreduce/top_search_keywords"

hdfs dfs -rm -r -f "$OUTPUT" || true
hadoop jar "$JAR" com.skillbridge.bigdata.TopSearchKeywordsJob "$INPUT" "$OUTPUT"
hdfs dfs -cat "$OUTPUT/part-r-00000" | head -20

