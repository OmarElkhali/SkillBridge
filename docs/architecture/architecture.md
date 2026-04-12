# SkillBridge Architecture

## Overview
SkillBridge is split into two applications:

- `Spring Boot backend` at the repository root
- `React + Vite frontend` in `apps/frontend/`

The system follows an API-first design. The frontend never talks directly to Supabase services; it only calls the Spring Boot REST API. The backend uses Supabase strictly as a PostgreSQL database.

## Backend Structure
- `config`: application properties and shared beans
- `security`: JWT creation, JWT request filter, auth entry point, and Spring Security setup
- `user`: registration, login, current user, admin user listing, role seeding
- `course`: courses, categories, providers, course CRUD
- `skill`: skills CRUD and lookup used by recommendations
- `projectidea`: project ideas, detected skills, recommendation snapshots
- `recommendation`: rule-based keyword extraction and ranking engine
- `savedcourse`: bookmarking functionality
- `progress`: course tracking
- `admin`: overview metrics for dashboard screens
- `common`: reusable exceptions, API error response, base entity timestamps, slug utility

## Frontend Structure
- `src/app`: router and auth provider
- `src/components`: layout shell
- `src/hooks`: auth hook
- `src/pages`: user and admin pages
- `src/services`: API client and backend calls
- `src/types`: shared frontend contracts aligned with backend responses

## Core User Flow
1. The user registers or logs in.
2. Spring Security validates credentials and returns a JWT.
3. The frontend stores the JWT and sends it on protected requests.
4. The user submits a project idea.
5. The recommendation engine:
   - normalizes text
   - removes stop words
   - detects matching known skills
   - scores courses by title, skills, category relevance, and bonus
6. The backend stores a recommendation snapshot for auditability.
7. The user can save recommended courses and start progress tracking.

## Why This Architecture Works
- The backend owns security, domain rules, and recommendation logic.
- The frontend stays focused on workflow, usability, and explainability.
- Skills are the bridge entity between ideas and courses.
- Stored snapshots make demos and jury defense easier because the result is reproducible.
