# SkillBridge Setup For A Friend

This guide explains exactly what your friend must do to run the full SkillBridge project:

- React frontend
- Spring Boot backend
- Supabase PostgreSQL application database
- Docker Big Data stack with PostgreSQL mirror, Sqoop, Flume, HDFS, Hive, MapReduce and HBase

## 1. What Omar Must Send Privately

Do not put secrets in a public GitHub repository.

Send these privately to your friend:

1. The GitHub repository URL, preferably private.
2. `apps/backend/.env` values or the values to paste into `apps/backend/.env`.
3. The three dataset ZIP files:
   - `archive (1).zip`
   - `archive.zip`
   - `archive (2).zip`
4. Supabase database password if your friend must use the same Supabase project.
5. Admin login:
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`

Do not send:

- `.git`
- `node_modules`
- `apps/frontend/dist`
- `target`
- Docker volumes

## 2. What Your Friend Must Install

On Windows, install:

```powershell
git --version
java -version
node --version
npm --version
python --version
docker --version
```

Required versions:

- JDK 21 recommended.
- Node 20+ recommended.
- Python 3.10+ recommended.
- Docker Desktop running Linux containers.

## 3. Clone The Project

```powershell
cd C:\Users\<FRIEND_NAME>\Desktop
git clone https://github.com/OmarElkhali/SkillBridge.git
cd SkillBridge
```

If the repository is private, your friend must log in to GitHub first.

## 4. Create The Environment Files

Run:

```powershell
Copy-Item apps\backend\.env.example apps\backend\.env
Copy-Item apps\frontend\.env.example apps\frontend\.env
Copy-Item apps\bigdata\.env.example apps\bigdata\.env
```

Then edit:

```powershell
notepad apps\backend\.env
notepad apps\frontend\.env
notepad apps\bigdata\.env
```

### Backend `.env`

Use port `8081`:

```properties
SERVER_PORT=8081
DB_URL=jdbc:postgresql://aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require
DB_USERNAME=postgres.kjhnukvekqkhixqymdgy
DB_PASSWORD=<SUPABASE_DATABASE_PASSWORD>
JWT_SECRET=<LONG_RANDOM_SECRET_AT_LEAST_32_CHARS>
CORS_ALLOWED_ORIGINS=http://localhost:5173
SPRING_PROFILES_ACTIVE=dev
JPA_DDL_AUTO=update
SHOW_SQL=false
ADMIN_EMAIL=<ADMIN_EMAIL>
ADMIN_PASSWORD=<ADMIN_PASSWORD>
ADMIN_FIRST_NAME=Platform
ADMIN_LAST_NAME=Admin
SECURITY_MAX_LOGIN_ATTEMPTS=5
SECURITY_LOGIN_LOCK_MINUTES=15
SECURITY_LOGIN_ATTEMPT_WINDOW_MINUTES=15
GOOGLE_ALLOWED_AUDIENCES=<GOOGLE_WEB_CLIENT_ID>
GITHUB_CLIENT_ID=<GITHUB_CLIENT_ID>
GITHUB_CLIENT_SECRET=<GITHUB_CLIENT_SECRET>
GITHUB_REDIRECT_URI=http://localhost:5173/login
```

Important:

- `DB_PASSWORD` is the Supabase database password, not the website login password.
- `JWT_SECRET` must be long. Example format: `replace-this-with-a-very-long-random-secret-123456`.
- `CORS_ALLOWED_ORIGINS` must be explicit origins separated by commas. Do not use `*` because credentials are enabled.
- Login endpoint now has built-in brute-force protection. After too many failed attempts from the same email+IP pair, login is temporarily blocked.
- `GOOGLE_ALLOWED_AUDIENCES` must include your Google OAuth Web Client ID if you want Google login enabled.
- `GITHUB_REDIRECT_URI` must match your GitHub OAuth app callback URL exactly.

### Frontend `.env`

```properties
VITE_API_BASE_URL=http://localhost:8081
VITE_GOOGLE_CLIENT_ID=<GOOGLE_WEB_CLIENT_ID>
VITE_GITHUB_CLIENT_ID=<GITHUB_CLIENT_ID>
VITE_GITHUB_REDIRECT_URI=http://localhost:5173/login
```

### Big Data `.env`

Your friend can place the ZIP files anywhere. Example:

```text
C:\Users\<FRIEND_NAME>\Downloads\archive (1).zip
C:\Users\<FRIEND_NAME>\Downloads\archive.zip
C:\Users\<FRIEND_NAME>\Downloads\archive (2).zip
```

Then set:

```properties
COMPOSE_PROJECT_NAME=skillbridge_bigdata
BIGDATA_DB_HOST=localhost
BIGDATA_DB_PORT=5433
BIGDATA_DB_NAME=skillbridge
BIGDATA_DB_USER=skillbridge
BIGDATA_DB_PASSWORD=skillbridge
SKILLBRIDGE_DATASET_FINAL_ZIP=C:\Users\<FRIEND_NAME>\Downloads\archive (1).zip
SKILLBRIDGE_DATASET_ALL_COURSES_ZIP=C:\Users\<FRIEND_NAME>\Downloads\archive.zip
SKILLBRIDGE_DATASET_RICH_ZIP=C:\Users\<FRIEND_NAME>\Downloads\archive (2).zip
HDFS_BASE=/data/skillbridge
HIVE_DATABASE=skillbridge_bigdata
```

## 4.5 Google OAuth Setup (Optional but Recommended)

If you want users to log in with Google, configure OAuth first:

1. Open Google Cloud Console and select your project.
2. Configure OAuth consent screen.
3. Create an OAuth 2.0 Client ID for a Web application.
4. Add your local frontend origin (`http://localhost:5173`) to Authorized JavaScript origins.
5. Copy the generated Web Client ID.
6. Set both:
   - `VITE_GOOGLE_CLIENT_ID=<that client id>` in `apps/frontend/.env`
   - `GOOGLE_ALLOWED_AUDIENCES=<that same client id>` in `apps/backend/.env`

For a complete step-by-step guide see:
- `docs/auth/google-oauth-setup.md`

## 4.6 GitHub OAuth Setup (Optional)

If you also want GitHub login:

1. Open GitHub `Settings` -> `Developer settings` -> `OAuth Apps`.
2. Create a new OAuth App.
3. Set callback URL to `http://localhost:5173/login`.
4. Copy:
   - `Client ID`
   - `Client Secret`
5. Set:
   - `VITE_GITHUB_CLIENT_ID=<client id>` in `apps/frontend/.env`
   - `VITE_GITHUB_REDIRECT_URI=http://localhost:5173/login` in `apps/frontend/.env`
   - `GITHUB_CLIENT_ID=<client id>` in `apps/backend/.env`
   - `GITHUB_CLIENT_SECRET=<client secret>` in `apps/backend/.env`
   - `GITHUB_REDIRECT_URI=http://localhost:5173/login` in `apps/backend/.env`

Complete guide:
- `docs/auth/github-oauth-setup.md`

## 5. Run The Setup Check

From the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\check-friend-setup.ps1
```

Expected result:

```text
Setup check passed.
```

If it fails, fix the missing tool, missing `.env`, or wrong dataset path before continuing.

## 6. Run The Backend

Open terminal 1:

```powershell
cd C:\Users\<FRIEND_NAME>\Desktop\SkillBridge
.\mvnw.cmd -f apps\backend\pom.xml spring-boot:run
```

Backend URL:

```text
http://localhost:8081
```

Quick check:

```powershell
Invoke-WebRequest http://localhost:8081/api/courses?page=0&size=5 -UseBasicParsing
```

Expected:

- HTTP response is not a connection error.
- JSON contains paginated course data.

## 7. Run The Frontend

Open terminal 2:

```powershell
cd C:\Users\<FRIEND_NAME>\Desktop\SkillBridge\apps\frontend
npm install
npm run dev -- --host localhost --port 5173
```

Frontend URL:

```text
http://localhost:5173
```

Login with the admin account from `apps/backend/.env`.

## 8. Run The Local Big Data Pipeline

Open terminal 3:

```powershell
cd C:\Users\<FRIEND_NAME>\Desktop\SkillBridge\apps\bigdata
powershell -ExecutionPolicy Bypass -File .\scripts\10_run_mvp_pipeline.ps1 -Datanodes 2
```

This runs:

```text
datasets ZIP
-> catalog builder
-> local PostgreSQL mirror
-> Sqoop
-> HDFS
-> Flume
-> Hive
-> MapReduce
-> Python matching
-> HBase
-> bigdata-summary.json
```

This command does not write to Supabase.

## 9. Optional: Push Catalog To Supabase

Only do this if your friend is allowed to update the shared Supabase database.

Dry-run first:

```powershell
cd apps\bigdata
python .\scripts\13_push_catalog_to_supabase.py
```

Real apply:

```powershell
python .\scripts\13_push_catalog_to_supabase.py --apply
```

The script updates only catalog tables:

```text
providers
categories
skills
courses
course_skills
```

It does not delete users, projects, saved courses, progress, or recommendations.

## 10. Verify Big Data Containers

From `apps/bigdata`:

```powershell
docker compose ps
docker compose exec namenode hdfs dfsadmin -report
docker compose exec namenode hdfs dfs -ls -R /data/skillbridge/raw/sqoop
docker compose exec namenode hdfs dfs -ls -R /data/skillbridge/raw/flume/events
docker compose exec hive-server beeline -u jdbc:hive2://localhost:10000 --silent=true --showHeader=true --outputformat=table -e "use skillbridge_bigdata; select count(*) as hive_courses from hive_courses; select count(*) as hive_events from hive_events;"
docker compose exec namenode hdfs dfs -cat /data/skillbridge/processed/mapreduce/top_search_keywords/part-r-00000
```

Expected signs:

- `datanode` has 2 running replicas.
- HDFS report shows `Live datanodes (2)`.
- Sqoop folders contain `_SUCCESS`.
- Flume folders contain `events.*`.
- Hive returns course and event counts.
- MapReduce prints keyword counts.

## 11. Verify HBase

From `apps/bigdata`:

```powershell
docker compose restart hbase
Start-Sleep -Seconds 90
python .\scripts\09_load_course_stats_hbase.py
docker compose exec -T hbase /hbase/bin/hbase shell /opt/skillbridge/output/load_course_stats.hbase
```

Manual scan:

```powershell
docker compose exec -T hbase /hbase/bin/hbase shell -n
```

Inside the shell:

```ruby
scan 'course_stats', {LIMIT => 10}
exit
```

Expected columns:

```text
meta:title
activity:clicks
activity:saves
activity:avg_progress
```

## 12. Verify Web And Big Data Together

1. Open:

```text
http://localhost:5173
```

2. Login as admin.
3. Go to:

```text
http://localhost:5173/admin
```

4. Check:

- global metrics
- pipeline cards
- latest events
- recommendation analytics
- refresh commands

5. Create a project idea and generate recommendations.
6. Check that an event was written:

```powershell
Get-Content .\apps\bigdata\data\events\events.log -Tail 5
```

7. Check Flume/HDFS:

```powershell
cd apps\bigdata
docker compose exec namenode hdfs dfs -ls -R /data/skillbridge/raw/flume/events
```

## 13. Normal Daily Start Commands

After the first setup, your friend usually needs only this.

Terminal 1:

```powershell
.\mvnw.cmd -f apps\backend\pom.xml spring-boot:run
```

Terminal 2:

```powershell
cd apps\frontend
npm run dev -- --host localhost --port 5173
```

Terminal 3:

```powershell
cd apps\bigdata
docker compose up -d --scale datanode=2
```

## 14. Clean Rebuild Big Data

Use this only when Docker state is stale:

```powershell
cd apps\bigdata
docker compose down -v --remove-orphans
powershell -ExecutionPolicy Bypass -File .\scripts\10_run_mvp_pipeline.ps1 -Datanodes 2
```

This deletes local Docker volumes only. It does not touch Supabase.

## 15. Common Problems

### Backend cannot connect to Supabase

Check:

```properties
DB_URL=jdbc:postgresql://aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require
DB_USERNAME=postgres.kjhnukvekqkhixqymdgy
DB_PASSWORD=<real database password>
```

### Frontend calls the wrong backend port

Check:

```properties
VITE_API_BASE_URL=http://localhost:8081
```

Restart Vite after editing `.env`.

### Dataset path error

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\check-friend-setup.ps1
```

Fix the three paths in `apps/bigdata/.env`.

### HBase shell blocks or errors

Run:

```powershell
cd apps\bigdata
docker compose restart hbase
Start-Sleep -Seconds 90
python .\scripts\09_load_course_stats_hbase.py
docker compose exec -T hbase /hbase/bin/hbase shell /opt/skillbridge/output/load_course_stats.hbase
```

### Flume does not ingest new events

Run:

```powershell
cd apps\bigdata
docker compose restart flume-agent
docker compose logs --tail=100 flume-agent
docker compose exec namenode hdfs dfs -ls -R /data/skillbridge/raw/flume/events
```

## 16. What To Tell Your Friend

Short version:

```text
Clone the repo, copy the three .env.example files to .env, paste the private Supabase values, set your dataset ZIP paths, run check-friend-setup.ps1, then start backend, frontend, and apps/bigdata/scripts/10_run_mvp_pipeline.ps1.
```

