USE skillbridge_bigdata;

SELECT COUNT(*) AS total_courses FROM hive_courses;

SELECT COUNT(*) AS total_events FROM hive_events;

SELECT level, COUNT(*) AS total
FROM hive_courses
GROUP BY level
ORDER BY total DESC;

SELECT p.name AS provider_name, COUNT(*) AS total_courses
FROM hive_courses c
JOIN hive_providers p ON p.id = c.provider_id
GROUP BY p.name
ORDER BY total_courses DESC
LIMIT 10;

SELECT cat.name AS category_name, COUNT(*) AS total_courses
FROM hive_courses c
JOIN hive_categories cat ON cat.id = c.category_id
GROUP BY cat.name
ORDER BY total_courses DESC
LIMIT 10;

SELECT s.name, COUNT(*) AS total_courses
FROM hive_course_skills cs
JOIN hive_skills s ON s.id = cs.skill_id
GROUP BY s.name
ORDER BY total_courses DESC
LIMIT 10;

SELECT c.title, COUNT(*) AS total_saves
FROM hive_saved_courses sc
JOIN hive_courses c ON c.id = sc.course_id
GROUP BY c.title
ORDER BY total_saves DESC, c.title
LIMIT 10;

SELECT get_json_object(raw_line, '$.eventType') AS event_type, COUNT(*) AS total
FROM hive_events
GROUP BY get_json_object(raw_line, '$.eventType')
ORDER BY total DESC;

SELECT get_json_object(raw_line, '$.query') AS query, COUNT(*) AS total
FROM hive_events
WHERE get_json_object(raw_line, '$.eventType') = 'COURSE_SEARCH'
GROUP BY get_json_object(raw_line, '$.query')
ORDER BY total DESC
LIMIT 10;
