# SkillBridge API Overview

## Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/github`
- `GET /api/users/me`

Auth notes:
- Send JWT as `Authorization: Bearer <token>` for protected endpoints.
- `POST /api/auth/login` can return HTTP `429 Too Many Requests` when temporary lockout is active after repeated failed attempts.
- Protected endpoints return `401` when auth is missing/invalid and `403` when role/authorization checks fail.

## Public Catalog Reads
- `GET /api/courses`
- `GET /api/categories`
- `GET /api/providers`
- `GET /api/skills`

## Admin Catalog Management
- `POST|PUT|DELETE /api/courses`
- `POST|PUT|DELETE /api/categories`
- `POST|PUT|DELETE /api/providers`
- `POST|PUT|DELETE /api/skills`
- `GET /api/courses/admin`
- `GET /api/admin/overview`
- `GET /api/admin/users`

## Project Ideas and Recommendations
- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/{id}`
- `POST /api/projects/{id}/recommendations`
- `GET /api/projects/{id}/recommendations/latest`

## Saved Courses
- `GET /api/saved-courses`
- `POST /api/saved-courses/{courseId}`
- `DELETE /api/saved-courses/{courseId}`

## Progress
- `GET /api/progress`
- `PUT /api/progress/{courseId}`

## Recommendation Scoring
- `+4` if project keywords appear in the course title
- `+3` for each overlap between detected project skills and course skills
- `+2` if the course category text matches the project context
- `+1` if the course qualifies for the completeness/popularity bonus

The backend stores the generated result in `recommendation_snapshots` and `recommendation_results`, which makes the recommendation explainable and replayable later.
