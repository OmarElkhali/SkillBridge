# SkillBridge Database Schema

## Core Tables

### `roles`
- `id`
- `name` unique

### `users`
- `id`
- `first_name`
- `last_name`
- `email` unique
- `password_hash`
- `role_id`
- `active`
- `created_at`
- `updated_at`

### `categories`
- `id`
- `name` unique
- `slug` unique
- `description`
- `created_at`
- `updated_at`

### `providers`
- `id`
- `name` unique
- `website_url`
- `description`
- `created_at`
- `updated_at`

### `skills`
- `id`
- `name` unique
- `slug` unique
- `description`
- `created_at`
- `updated_at`

### `courses`
- `id`
- `title`
- `slug` unique
- `description`
- `level`
- `language`
- `source_url`
- `thumbnail_url`
- `category_id`
- `provider_id`
- `published`
- `popularity_score`
- `created_at`
- `updated_at`

### `course_skills`
- `course_id`
- `skill_id`

## Project and Recommendation Tables

### `project_ideas`
- `id`
- `user_id`
- `title`
- `description`
- `status`
- `created_at`
- `updated_at`

### `project_detected_skills`
- `id`
- `project_idea_id`
- `skill_id`
- `matched_keyword`
- `match_source`
- `confidence_score`
- `created_at`
- `updated_at`

### `recommendation_snapshots`
- `id`
- `project_idea_id`
- `generated_at`
- `keyword_summary`
- `algorithm_version`
- `total_results`

### `recommendation_results`
- `id`
- `snapshot_id`
- `course_id`
- `score`
- `rank_position`
- `title_match_score`
- `skill_match_score`
- `category_match_score`
- `bonus_score`
- `explanation`

## User Activity Tables

### `saved_courses`
- `id`
- `user_id`
- `course_id`
- `saved_at`

### `course_progress`
- `id`
- `user_id`
- `course_id`
- `status`
- `progress_percent`
- `started_at`
- `completed_at`
- `last_updated_at`

## Relationship Summary
- one role -> many users
- one category -> many courses
- one provider -> many courses
- many courses <-> many skills
- one user -> many project ideas
- one project idea -> many detected skills
- one project idea -> many recommendation snapshots
- one snapshot -> many recommendation results
- one user -> many saved courses
- one user -> many progress entries
