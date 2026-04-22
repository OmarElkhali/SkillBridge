#!/usr/bin/env bash
set -euo pipefail

beeline -u jdbc:hive2://localhost:10000 -f /opt/skillbridge/sql/hive/01_create_hive_tables.sql
beeline -u jdbc:hive2://localhost:10000 -f /opt/skillbridge/sql/hive/02_demo_queries.sql

