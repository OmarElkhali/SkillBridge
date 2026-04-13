# Big Data Roadmap For SkillBridge

## Purpose
This roadmap explains how to extend SkillBridge later with Big Data tools without breaking the clean full-stack application already built.

Phase 1 stays simple:

`React -> Spring Boot -> Supabase PostgreSQL`

Phase 2 adds a data engineering pipeline around it.

## Important Project Principle
Big Data should enrich the platform, not replace the transactional database.

Supabase PostgreSQL remains the operational database for:
- users
- authentication data
- projects
- saved courses
- progress
- final curated course catalog

Hadoop ecosystem tools should be used for:
- large raw datasets
- ingestion pipelines
- normalization
- deduplication
- analytics
- batch enrichment

## Recommended Big Data Architecture
Use this target flow later:

`External sources -> Raw zone in HDFS -> Cleaning/transformation -> Curated datasets -> Sync useful results back to PostgreSQL`

Suggested sources:
- Kaggle datasets you already downloaded
- OpenLearn catalog exports or scrapers
- MIT OpenCourseWare feeds or scrapers
- future platform usage logs

## Role Of Each Technology
### HDFS
HDFS stores the raw and transformed datasets at scale.

Use it for:
- large CSV/JSON files from Kaggle
- raw snapshots from OpenLearn and MIT OCW
- intermediate transformed files

Do not use HDFS for:
- user login data
- JWT auth
- real-time application CRUD

### Hadoop / MapReduce
Use Hadoop batch processing only when dataset size justifies it.

Examples:
- cleaning millions of rows
- grouping courses by provider/category/language
- generating skill frequency statistics
- matching duplicated course records from multiple sources

For small datasets, plain Spring jobs or Python ETL may be simpler.

### Sqoop
Sqoop is useful for exchange between relational databases and Hadoop.

In this project, the right use of Sqoop is:
- export data from PostgreSQL to HDFS for analytics
- import curated data from Hadoop outputs back into PostgreSQL staging tables

Sqoop is **not** the best first tool for Kaggle CSV files.

For Kaggle files, you should first load them directly into HDFS.

### Hive
Hive is useful for SQL-like analytics on data stored in HDFS.

Examples:
- find the most common skills across imported course datasets
- compute provider coverage by technology
- identify missing categories in your current catalog
- prepare aggregated views before import into PostgreSQL

### Flume
Flume is better for streaming logs and event data than for static course datasets.

Possible future usage:
- collect application logs
- collect recommendation click events
- collect search behavior data

For Kaggle/OpenLearn/MIT OCW bulk ingestion, Flume is optional and usually not the first choice.

## Recommended Pipeline By Source
### A. Kaggle datasets you already downloaded
1. Store raw files locally in a `data/raw/kaggle` workspace.
2. Upload them to HDFS.
3. Standardize schema fields:
   - title
   - description
   - provider
   - category
   - language
   - level
   - source_url
   - skills
4. Run cleaning and deduplication jobs.
5. Produce curated output in Parquet or normalized CSV.
6. Import curated results into PostgreSQL staging tables.
7. Validate, then promote them into the `courses`, `providers`, `categories`, and `skills` tables.

### B. OpenLearn automatic import
1. Build a scheduled extractor or scraper outside the transactional app.
2. Save raw results in HDFS.
3. Normalize fields to the same schema as Kaggle imports.
4. Match provider as `OpenLearn`.
5. Deduplicate against existing PostgreSQL catalog.
6. Import only approved or cleaned records back into SkillBridge.

### C. MIT OpenCourseWare automatic import
1. Build a dedicated collector for MIT OCW metadata.
2. Save snapshots in HDFS.
3. Normalize and enrich with detected skills.
4. Compare with existing courses to avoid duplicates.
5. Push curated results back into PostgreSQL.

## Recommended Database Strategy For Big Data Integration
Do not write raw external data directly into production catalog tables.

Instead add staging tables later, for example:
- `external_course_import_batches`
- `external_course_staging`
- `external_skill_staging`
- `catalog_merge_reviews`

Then apply a merge workflow:
1. import raw curated records into staging
2. validate and deduplicate
3. merge approved rows into production tables
4. log provenance of each imported course

This makes the project easier to defend because you can explain where every course came from.

## Recommended Metadata To Add Later
For imported courses, add fields like:
- `external_source`
- `external_source_id`
- `ingestion_batch_id`
- `raw_provider_name`
- `normalized_status`
- `quality_score`
- `last_synced_at`

These fields help you manage automatic imports safely.

## Proposed Future Modules
When you start the Big Data phase, split it into dedicated modules:
- `ingestion-service`
- `normalization-service`
- `catalog-merge-service`
- `analytics-service`

Keep them separate from the current backend API so the web app stays clean.

## Suggested Phases
### Phase 2.1: Controlled ingestion
- import one Kaggle dataset manually
- load into HDFS
- clean it
- write curated rows back to PostgreSQL

### Phase 2.2: Catalog enrichment
- add OpenLearn importer
- add MIT OCW importer
- deduplicate titles/providers/URLs
- enrich skills using deterministic matching rules

### Phase 2.3: Analytics layer
- add Hive views and reporting datasets
- compute course coverage by skill/category/provider
- identify catalog gaps for admins

### Phase 2.4: Recommendation enrichment
- use Big Data outputs to improve course completeness and popularity signals
- keep the recommendation engine rule-based at first
- only consider ML later if your academic scope allows it

## Best Practical Advice
- Keep Supabase PostgreSQL as the source of truth for the live app.
- Use HDFS as the raw and transformed data lake.
- Use Sqoop for relational exchange, not as the first loader for Kaggle CSV files.
- Use staging tables before touching production catalog tables.
- Track provenance for every imported course.
- Add one source at a time so debugging stays manageable.

## What You Should Understand For Jury Defense
If a jury asks why both PostgreSQL and Hadoop exist, the answer is:

- PostgreSQL serves the application in real time.
- Hadoop ecosystem tools process large external datasets in batch.
- Curated results flow back into PostgreSQL to improve the live product.

That separation is the main architectural idea that makes the future Big Data phase coherent.
