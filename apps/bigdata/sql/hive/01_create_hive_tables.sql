CREATE DATABASE IF NOT EXISTS skillbridge_bigdata;
USE skillbridge_bigdata;

CREATE EXTERNAL TABLE IF NOT EXISTS hive_providers (
    id BIGINT,
    name STRING,
    website_url STRING,
    description STRING,
    created_at STRING,
    updated_at STRING
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '\t'
STORED AS TEXTFILE
LOCATION '/data/skillbridge/raw/sqoop/providers';

CREATE EXTERNAL TABLE IF NOT EXISTS hive_categories (
    id BIGINT,
    name STRING,
    slug STRING,
    description STRING,
    created_at STRING,
    updated_at STRING
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '\t'
STORED AS TEXTFILE
LOCATION '/data/skillbridge/raw/sqoop/categories';

CREATE EXTERNAL TABLE IF NOT EXISTS hive_courses (
    id BIGINT,
    title STRING,
    slug STRING,
    description STRING,
    level STRING,
    language STRING,
    source_url STRING,
    thumbnail_url STRING,
    category_id BIGINT,
    provider_id BIGINT,
    published BOOLEAN,
    popularity_score INT,
    created_at STRING,
    updated_at STRING
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '\t'
STORED AS TEXTFILE
LOCATION '/data/skillbridge/raw/sqoop/courses';

CREATE EXTERNAL TABLE IF NOT EXISTS hive_skills (
    id BIGINT,
    name STRING,
    slug STRING,
    description STRING,
    created_at STRING,
    updated_at STRING
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '\t'
STORED AS TEXTFILE
LOCATION '/data/skillbridge/raw/sqoop/skills';

CREATE EXTERNAL TABLE IF NOT EXISTS hive_course_skills (
    course_id BIGINT,
    skill_id BIGINT
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '\t'
STORED AS TEXTFILE
LOCATION '/data/skillbridge/raw/sqoop/course_skills';

CREATE EXTERNAL TABLE IF NOT EXISTS hive_project_ideas (
    id BIGINT,
    user_id BIGINT,
    title STRING,
    description STRING,
    status STRING,
    created_at STRING,
    updated_at STRING
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '\t'
STORED AS TEXTFILE
LOCATION '/data/skillbridge/raw/sqoop/project_ideas';

CREATE EXTERNAL TABLE IF NOT EXISTS hive_saved_courses (
    id BIGINT,
    user_id BIGINT,
    course_id BIGINT,
    saved_at STRING
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '\t'
STORED AS TEXTFILE
LOCATION '/data/skillbridge/raw/sqoop/saved_courses';

CREATE EXTERNAL TABLE IF NOT EXISTS hive_course_progress (
    id BIGINT,
    user_id BIGINT,
    course_id BIGINT,
    status STRING,
    progress_percent INT,
    started_at STRING,
    completed_at STRING,
    last_updated_at STRING
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY '\t'
STORED AS TEXTFILE
LOCATION '/data/skillbridge/raw/sqoop/course_progress';

CREATE EXTERNAL TABLE IF NOT EXISTS hive_events (raw_line STRING)
STORED AS TEXTFILE
LOCATION '/data/skillbridge/raw/flume/events';
