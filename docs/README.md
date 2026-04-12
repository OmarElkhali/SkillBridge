# SkillBridge

SkillBridge is a full-stack educational platform that transforms a project idea into a structured learning path:

`Project idea -> required skills -> recommended courses`

This phase focuses only on the web application. It does **not** include Big Data tooling or machine learning.

## Stack
- Backend: Java, Spring Boot, Spring Security, Spring Data JPA
- Database: Supabase PostgreSQL used strictly as a PostgreSQL database
- Frontend: React + Vite
- Auth: email/password with JWT handled by Spring Boot

## Important Architecture Rule
Supabase is used here only as the PostgreSQL database.

- No Supabase Auth
- No direct frontend database access
- No `supabase-js` dependency required for the application flow
- The React app talks only to the Spring Boot API

## Project Structure
- `apps/backend/src/main/java/com/skillbridge`: backend source
- `apps/backend/src/main/resources`: backend config
- `apps/frontend/`: React frontend
- `docs/`: architecture, database, and API notes

## Backend Configuration
Create a local `.env`-style setup or export environment variables before running Spring Boot.

Main variables:
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `CORS_ALLOWED_ORIGINS`

An example is available in [apps/backend/.env.example](../apps/backend/.env.example).

## Frontend Configuration
Create `apps/frontend/.env` from [apps/frontend/.env.example](../apps/frontend/.env.example):

```env
VITE_API_BASE_URL=http://localhost:8080
```

## Run Locally

### Backend
```powershell
..\..\mvnw.cmd spring-boot:run
```

### Frontend
```powershell
cd apps/frontend
cmd /c npm.cmd install
cmd /c npm.cmd run dev
```

## Verification
Backend tests:

```powershell
cd apps/backend
..\..\mvnw.cmd test
```

Frontend production build:

```powershell
cd apps/frontend
cmd /c npm.cmd run build
```

## Supabase Data Needed
To connect the backend to your real Supabase database, one of these is needed:

1. The full PostgreSQL JDBC URL
2. Or these five values:
   - host
   - port
   - database name
   - username
   - database password

The public project URL and publishable key are not enough for Spring Boot database access.
