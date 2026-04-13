# Supabase Integration Guide

## Goal
In SkillBridge, Supabase is used only as a managed PostgreSQL database.

The application flow remains:

`React frontend -> Spring Boot API -> Supabase PostgreSQL`

This means:
- the frontend never talks directly to Supabase tables
- `@supabase/supabase-js` is not required for the production architecture
- authentication stays in Spring Security with JWT
- business rules stay in the backend

## Why This Design Is Better For SkillBridge
- Security is centralized in Spring Boot.
- Recommendation logic stays private and testable.
- Role-based authorization remains consistent for `USER` and `ADMIN`.
- Later Big Data ingestion can enrich PostgreSQL without changing the frontend contract.

## Required Supabase Data
To run the backend against your real Supabase project, you need PostgreSQL credentials, not only the project URL and publishable key.

Minimum required values:
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`

For your project, the PostgreSQL host information you shared is:

```text
host: db.kjhnukvekqkhixqymdgy.supabase.co
port: 5432
database: postgres
user: postgres
```

The missing value is the database password.

## Backend Environment File
Create `apps/backend/.env` from `apps/backend/.env.example`.

Example:

```env
DB_URL=jdbc:postgresql://db.kjhnukvekqkhixqymdgy.supabase.co:5432/postgres
DB_USERNAME=postgres
DB_PASSWORD=your-real-supabase-db-password
JWT_SECRET=replace-with-a-long-random-jwt-secret
CORS_ALLOWED_ORIGINS=http://localhost:5173
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=dev
JPA_DDL_AUTO=update
SHOW_SQL=true
ADMIN_EMAIL=admin@skillbridge.local
ADMIN_PASSWORD=Admin123!
ADMIN_FIRST_NAME=Platform
ADMIN_LAST_NAME=Admin
```

## Frontend Environment File
Create `apps/frontend/.env` from `apps/frontend/.env.example`.

```env
VITE_API_BASE_URL=http://localhost:8080
```

## What Happens At Runtime
1. Spring Boot reads `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`.
2. Hibernate connects to Supabase PostgreSQL through the standard PostgreSQL driver.
3. JPA creates or updates the schema according to the entities.
4. `DataSeeder` can bootstrap the admin account, sample skills, categories, providers, and starter courses.
5. React calls the backend API only.

## Why The Publishable Key Is Not Used Here
The publishable key is useful when a browser application must call Supabase services directly.

That is not our architecture.

If we used direct frontend access:
- we would duplicate security rules between Spring and Supabase
- recommendation logic would become harder to protect
- course save/progress/project ownership checks would be split across two systems

For SkillBridge, that would make the project weaker, not stronger.

## Common Connection Problems
### 1. Backend starts tests but not the real app
That is normal when tests use H2 and runtime expects PostgreSQL credentials.

### 2. Hibernate cannot determine the dialect
That usually means the datasource URL or password is missing or invalid.

### 3. App cannot reach Supabase from a local IPv4 network
Based on the note from your Supabase screen, you may need the Session Pooler connection instead of the direct database host if your network does not support direct IPv6-style access.

In that case, replace `DB_URL` with the pooler JDBC connection string provided by Supabase.

### 4. Authentication works but CORS fails
Check `CORS_ALLOWED_ORIGINS` and make sure it matches the frontend URL exactly.

## Recommended Next Step
Once you send the real `DB_PASSWORD` or the full JDBC URL, run:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'
$env:Path='C:\Program Files\Java\jdk-21\bin;' + $env:Path
.\mvnw.cmd -f apps\backend\pom.xml spring-boot:run
```

Then start the frontend:

```powershell
cd apps/frontend
cmd /c npm.cmd run dev
```

At that point, the full project will run against your real Supabase PostgreSQL database.
