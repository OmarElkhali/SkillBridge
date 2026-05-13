package com.skillbridge.admin.service;

import com.skillbridge.admin.dto.AdminDashboardResponse;
import com.skillbridge.admin.dto.CatalogAnalyticsResponse;
import com.skillbridge.admin.dto.CatalogMetricResponse;
import com.skillbridge.admin.dto.SkillCoverageResponse;
import com.skillbridge.bigdata.dto.BigDataFileResponse;
import com.skillbridge.bigdata.service.BigDataEventService;
import com.skillbridge.bigdata.service.BigDataStatusService;
import com.skillbridge.course.repository.CourseRepository;
import com.skillbridge.progress.repository.CourseProgressRepository;
import com.skillbridge.projectidea.repository.ProjectIdeaRepository;
import com.skillbridge.savedcourse.repository.SavedCourseRepository;
import com.skillbridge.skill.repository.SkillRepository;
import com.skillbridge.user.repository.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final SkillRepository skillRepository;
    private final ProjectIdeaRepository projectIdeaRepository;
    private final SavedCourseRepository savedCourseRepository;
    private final CourseProgressRepository courseProgressRepository;
    private final JdbcTemplate jdbcTemplate;
    private final BigDataStatusService bigDataStatusService;

    public AdminService(
            UserRepository userRepository,
            CourseRepository courseRepository,
            SkillRepository skillRepository,
            ProjectIdeaRepository projectIdeaRepository,
            SavedCourseRepository savedCourseRepository,
            CourseProgressRepository courseProgressRepository,
            JdbcTemplate jdbcTemplate,
            BigDataStatusService bigDataStatusService
    ) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.skillRepository = skillRepository;
        this.projectIdeaRepository = projectIdeaRepository;
        this.savedCourseRepository = savedCourseRepository;
        this.courseProgressRepository = courseProgressRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.bigDataStatusService = bigDataStatusService;
    }

    public AdminDashboardResponse overview() {
        return new AdminDashboardResponse(
                userRepository.count(),
                courseRepository.count(),
                countLong("select count(*) from providers"),
                countLong("select count(*) from categories"),
                skillRepository.count(),
                projectIdeaRepository.count(),
                savedCourseRepository.count(),
                courseProgressRepository.count(),
                countLong("select count(*) from recommendation_snapshots"),
                countLong("select count(*) from recommendation_results")
        );
    }

    public CatalogAnalyticsResponse catalogAnalytics() {
        long totalCourses = courseRepository.count();
        long coursesWithSkills = countLong("""
                select count(distinct c.id)
                from courses c
                join course_skills cs on cs.course_id = c.id
                """);
        double coverage = totalCourses == 0 ? 0 : Math.round((coursesWithSkills * 10000.0 / totalCourses)) / 100.0;

        return new CatalogAnalyticsResponse(
                queryMetrics("""
                        select category.name, count(c.id) as item_count
                        from categories category
                        left join courses c on c.category_id = category.id
                        group by category.name
                        order by item_count desc, category.name asc
                        limit 8
                        """),
                queryMetrics("""
                        select provider.name, count(c.id) as item_count
                        from providers provider
                        left join courses c on c.provider_id = provider.id
                        group by provider.name
                        order by item_count desc, provider.name asc
                        limit 8
                        """),
                queryMetrics("""
                        select skill.name, count(cs.course_id) as item_count
                        from skills skill
                        join course_skills cs on cs.skill_id = skill.id
                        group by skill.name
                        order by item_count desc, skill.name asc
                        limit 12
                        """),
                queryMetrics("""
                        select c.level, count(*) as item_count
                        from courses c
                        group by c.level
                        order by item_count desc, c.level asc
                        """),
                new SkillCoverageResponse(totalCourses, coursesWithSkills, coverage)
        );
    }

    public Map<String, Object> bigDataPipeline() {
        Map<String, Object> data = new LinkedHashMap<>();
        Map<String, Object> catalogReport = bigDataStatusService.catalogSummary();
        Map<String, Object> importReport = bigDataStatusService.outputJson("catalog/supabase_import_report.json");
        Map<String, Object> summary = bigDataStatusService.outputJson("bigdata-summary.json");
        Map<String, Object> latestRecommendation = bigDataStatusService.latestRecommendation();
        List<Map<String, Object>> events = bigDataStatusService.allEvents();

        data.put("components", List.of(
                component(
                        "Catalog Builder",
                        "Builds the clean course catalog from raw CSV/JSON/ZIP datasets.",
                        statusFromFile(bigDataStatusService.outputFile("catalog_build_report", "catalog/catalog_build_report.json")),
                        catalogCounts(catalogReport),
                        "output/catalog/catalog_build_report.json",
                        List.of("python .\\scripts\\12_merge_and_enrich_catalog.py")
                ),
                component(
                        "Supabase Safe Upsert",
                        "Safely pushes curated catalog rows into Supabase PostgreSQL without replacing user data.",
                        statusFromFile(bigDataStatusService.outputFile("supabase_import_report", "catalog/supabase_import_report.json")),
                        importMetrics(importReport),
                        "output/catalog/supabase_import_report.json",
                        List.of("python .\\scripts\\13_push_catalog_to_supabase.py")
                ),
                component(
                        "PostgreSQL Mirror",
                        "Local relational mirror used by Sqoop and the terminal Big Data lab.",
                        courseRepository.count() > 0 ? "OK" : "WARNING",
                        Map.of(
                                "courses", courseRepository.count(),
                                "skills", skillRepository.count(),
                                "course_skills", countLong("select count(*) from course_skills"),
                                "project_ideas", projectIdeaRepository.count()
                        ),
                        "postgres-mirror:5432 / Supabase live database",
                        List.of("docker compose ps postgres-mirror")
                ),
                component(
                        "Sqoop Batch Ingestion",
                        "Batch ingestion from PostgreSQL mirror into HDFS.",
                        summary.isEmpty() ? "NOT GENERATED YET" : "OK",
                        Map.of(
                                "importedTables", List.of("courses", "skills", "course_skills", "providers", "categories", "project_ideas", "saved_courses", "course_progress"),
                                "expectedPaths", List.of("/data/skillbridge/raw/sqoop/courses", "/data/skillbridge/raw/sqoop/skills", "/data/skillbridge/raw/sqoop/course_skills")
                        ),
                        "/data/skillbridge/raw/sqoop",
                        List.of("docker compose exec namenode hdfs dfs -ls -R /data/skillbridge/raw/sqoop")
                ),
                component(
                        "Flume Streaming Ingestion",
                        "Streaming ingestion from events.log into HDFS.",
                        events.isEmpty() ? "WARNING" : "OK",
                        Map.of(
                                "eventCount", events.size(),
                                "latestEventType", latestEventValue(events, "eventType"),
                                "latestEventTimestamp", latestEventValue(events, "timestamp"),
                                "eventTypes", eventCounts(events)
                        ),
                        BigDataEventService.FLUME_HDFS_EVENTS_PATH,
                        List.of("docker compose logs flume-agent --tail=80", "docker compose exec namenode hdfs dfs -ls -R /data/skillbridge/raw/flume/events")
                ),
                component(
                        "HDFS Storage",
                        "Distributed storage for raw and processed files.",
                        summary.isEmpty() ? "WARNING" : "OK",
                        Map.of(
                                "rawSqoop", "/data/skillbridge/raw/sqoop",
                                "rawFlume", BigDataEventService.FLUME_HDFS_EVENTS_PATH,
                                "processedMapReduce", "/data/skillbridge/processed/mapreduce/top_search_keywords",
                                "exportHBase", "/opt/skillbridge/output/load_course_stats.hbase"
                        ),
                        "/data/skillbridge",
                        List.of("docker compose exec namenode hdfs dfsadmin -report", "docker compose exec namenode hdfs dfs -ls -R /data/skillbridge")
                ),
                component(
                        "Hive Analytics",
                        "SQL analytics layer over HDFS files.",
                        bigDataStatusService.hiveSummary().containsKey("status") ? "NOT GENERATED YET" : "OK",
                        bigDataStatusService.hiveSummary(),
                        "skillbridge_bigdata Hive database",
                        List.of("docker compose exec hive-server beeline -u jdbc:hive2://localhost:10000 -e \"use skillbridge_bigdata; select count(*) from hive_courses;\"")
                ),
                component(
                        "MapReduce Processing",
                        "Batch processing job that computes top search keywords.",
                        bigDataStatusService.topKeywords().isEmpty() ? "NOT GENERATED YET" : "OK",
                        bigDataStatusService.topKeywords(),
                        "/data/skillbridge/processed/mapreduce/top_search_keywords/part-r-00000",
                        List.of("powershell -ExecutionPolicy Bypass -File .\\scripts\\07_run_mapreduce.ps1")
                ),
                component(
                        "HBase Serving Layer",
                        "Fast NoSQL serving layer for course statistics.",
                        bigDataStatusService.hbaseCourseStats().isEmpty() ? "NOT GENERATED YET" : "OK",
                        bigDataStatusService.hbaseCourseStats(),
                        "course_stats",
                        List.of("docker compose exec hbase bash -lc \"echo \\\"scan 'course_stats', {LIMIT => 10}\\\" | hbase shell -n\"")
                ),
                component(
                        "Python Recommendation Engine",
                        "Rule-based engine that detects skills, matches categories, scores courses, and ranks recommendations.",
                        latestRecommendation.isEmpty() ? "NOT GENERATED YET" : "OK",
                        latestRecommendation,
                        "output/recommendation_result.json",
                        List.of("python .\\scripts\\15_run_project_recommendation.py --source supabase --limit 10")
                ),
                component(
                        "Web App",
                        "React admin interface that visualizes the summarized Big Data pipeline through Spring Boot APIs.",
                        "OK",
                        Map.of(
                                "frontend", "React + Vite",
                                "backendApi", "Spring Boot /api/admin/bigdata/*",
                                "directHadoopCalls", "disabled"
                        ),
                        "http://localhost:5173/admin",
                        List.of("cmd /c npm.cmd run dev -- --host localhost --port 5173")
                )
        ));
        data.put("pipelineDiagram", List.of("Catalog Builder", "Supabase", "PostgreSQL Mirror", "Sqoop", "HDFS", "Flume", "Hive", "MapReduce", "HBase", "Recommendation Engine", "Web App"));
        data.put("files", List.of(
                bigDataStatusService.outputFile("catalog_build_report", "catalog/catalog_build_report.json"),
                bigDataStatusService.outputFile("supabase_import_report", "catalog/supabase_import_report.json"),
                bigDataStatusService.outputFile("bigdata_summary", "bigdata-summary.json"),
                bigDataStatusService.outputFile("recommendation_result", "recommendation_result.json")
        ));
        return data;
    }

    public Map<String, Object> bigDataCatalogAnalytics() {
        CatalogAnalyticsResponse analytics = catalogAnalytics();
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("coursesByCategory", analytics.topCategories());
        data.put("coursesByProvider", analytics.topProviders());
        data.put("coursesByLevel", analytics.levelDistribution());
        data.put("topSkills", analytics.topSkills());
        data.put("skillCoverage", analytics.skillCoverage());
        data.put("missingMetadata", Map.of(
                "coursesMissingSkills", countLong("""
                        select count(*)
                        from courses c
                        where not exists (select 1 from course_skills cs where cs.course_id = c.id)
                        """),
                "coursesMissingDescription", countLong("select count(*) from courses where description is null or trim(description) = ''"),
                "coursesMissingSourceUrl", countLong("select count(*) from courses where source_url is null or trim(source_url) = ''")
        ));
        return data;
    }

    public Map<String, Object> bigDataEventsAnalytics() {
        List<Map<String, Object>> events = bigDataStatusService.allEvents();
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("latestEvents", bigDataStatusService.latestEvents(20));
        data.put("eventCount", events.size());
        data.put("eventCountByType", eventCounts(events));
        data.put("searchQueriesCount", countEvents(events, "COURSE_SEARCH"));
        data.put("recommendationEventsCount", countEvents(events, "PROJECT_RECOMMENDATION"));
        data.put("courseClickEvents", countEvents(events, "COURSE_CLICK"));
        data.put("courseSaveEvents", countEvents(events, "COURSE_SAVE"));
        data.put("mostSearchedKeywords", bigDataStatusService.topKeywords());
        data.put("eventsLogPath", bigDataStatusService.eventLogPathString());
        data.put("flumeHdfsPath", BigDataEventService.FLUME_HDFS_EVENTS_PATH);
        return data;
    }

    public Map<String, Object> bigDataRecommendationAnalytics() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("latestRecommendation", bigDataStatusService.latestRecommendation());
        data.put("snapshotsCount", countLong("select count(*) from recommendation_snapshots"));
        data.put("resultsCount", countLong("select count(*) from recommendation_results"));
        data.put("averageScore", decimal("select coalesce(avg(score), 0) from recommendation_results"));
        data.put("topRecommendedCourses", queryMap("""
                select c.title as name, count(rr.id) as count
                from recommendation_results rr
                join courses c on c.id = rr.course_id
                group by c.title
                order by count desc, c.title asc
                limit 8
                """));
        data.put("topDetectedSkills", queryMap("""
                select s.name as name, count(pds.id) as count
                from project_detected_skills pds
                join skills s on s.id = pds.skill_id
                group by s.name
                order by count desc, s.name asc
                limit 10
                """));
        data.put("topMatchedCategories", queryMap("""
                select cat.name as name, count(rr.id) as count
                from recommendation_results rr
                join courses c on c.id = rr.course_id
                join categories cat on cat.id = c.category_id
                where rr.category_match_score > 0
                group by cat.name
                order by count desc, cat.name asc
                limit 8
                """));
        data.put("scoreDistribution", queryMap("""
                select bucket as name, count(*) as count
                from (
                    select case
                        when score < 20 then '0-20'
                        when score < 40 then '20-40'
                        when score < 60 then '40-60'
                        when score < 80 then '60-80'
                        else '80-100'
                    end as bucket
                    from recommendation_results
                ) scored
                group by bucket
                order by bucket
                """));
        data.put("scoreBreakdownSample", jdbcTemplate.query("""
                select c.title, rr.score, rr.title_match_score, rr.skill_match_score, rr.category_match_score, rr.bonus_score, rr.explanation
                from recommendation_results rr
                join courses c on c.id = rr.course_id
                order by rr.id desc
                limit 8
                """, (rs, rowNum) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("title", rs.getString("title"));
            item.put("score", rs.getInt("score"));
            item.put("titleMatchScore", rs.getInt("title_match_score"));
            item.put("skillMatchScore", rs.getInt("skill_match_score"));
            item.put("categoryMatchScore", rs.getInt("category_match_score"));
            item.put("bonusScore", rs.getInt("bonus_score"));
            item.put("explanation", rs.getString("explanation"));
            return item;
        }));
        return data;
    }

    public Map<String, Object> bigDataCommands() {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("reason", bigDataStatusService.refreshInstructions().reason());
        data.put("commands", bigDataStatusService.refreshInstructions().commands());
        data.put("quickChecks", List.of(
                "docker compose -f apps\\bigdata\\docker-compose.yml ps",
                "docker compose -f apps\\bigdata\\docker-compose.yml exec namenode hdfs dfsadmin -report",
                "docker compose -f apps\\bigdata\\docker-compose.yml exec namenode hdfs dfs -ls -R /data/skillbridge/raw/flume/events",
                "docker compose -f apps\\bigdata\\docker-compose.yml logs flume-agent --tail=80"
        ));
        return data;
    }

    private List<CatalogMetricResponse> queryMetrics(String sql) {
        return jdbcTemplate.query(sql, (rs, rowNum) -> new CatalogMetricResponse(rs.getString(1), rs.getLong(2)));
    }

    private List<Map<String, Object>> queryMap(String sql) {
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("name", rs.getString("name"));
            item.put("count", rs.getLong("count"));
            return item;
        });
    }

    private long countLong(String sql) {
        Long value = jdbcTemplate.queryForObject(sql, Long.class);
        return value == null ? 0 : value;
    }

    private double decimal(String sql) {
        Number value = jdbcTemplate.queryForObject(sql, Number.class);
        return value == null ? 0 : Math.round(value.doubleValue() * 100.0) / 100.0;
    }

    private Map<String, Object> component(
            String name,
            String description,
            String status,
            Object metrics,
            String source,
            List<String> commands
    ) {
        Map<String, Object> component = new LinkedHashMap<>();
        component.put("name", name);
        component.put("description", description);
        component.put("status", status);
        component.put("metrics", metrics);
        component.put("source", source);
        component.put("commands", commands);
        return component;
    }

    private String statusFromFile(BigDataFileResponse file) {
        return file.available() ? "OK" : "MISSING";
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> catalogCounts(Map<String, Object> catalogReport) {
        Object finalCounts = catalogReport.get("final_counts");
        if (finalCounts instanceof Map<?, ?> map) {
            Map<String, Object> result = new LinkedHashMap<>();
            map.forEach((key, value) -> result.put(String.valueOf(key), value));
            return result;
        }
        return Map.of(
                "unified_courses", "missing",
                "providers", "missing",
                "categories", "missing",
                "skills", "missing",
                "course_skills", "missing"
        );
    }

    private Map<String, Object> importMetrics(Map<String, Object> importReport) {
        if (importReport.isEmpty()) {
            return Map.of("inserted", "missing", "updated", "missing", "touchedTables", List.of(), "untouchedTables", List.of());
        }
        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("inserted", importReport.getOrDefault("inserted", importReport.getOrDefault("total_inserted", "unknown")));
        metrics.put("updated", importReport.getOrDefault("updated", importReport.getOrDefault("total_updated", "unknown")));
        metrics.put("touchedTables", importReport.getOrDefault("touched_tables", importReport.getOrDefault("tables", List.of())));
        metrics.put("untouchedTables", importReport.getOrDefault("untouched_tables", List.of("users", "saved_courses", "course_progress")));
        return metrics;
    }

    private Map<String, Long> eventCounts(List<Map<String, Object>> events) {
        return events.stream()
                .map(event -> String.valueOf(event.getOrDefault("eventType", "UNKNOWN")))
                .collect(Collectors.groupingBy(item -> item, LinkedHashMap::new, Collectors.counting()));
    }

    private long countEvents(List<Map<String, Object>> events, String type) {
        return events.stream().filter(event -> type.equals(String.valueOf(event.get("eventType")))).count();
    }

    private String latestEventValue(List<Map<String, Object>> events, String key) {
        if (events.isEmpty()) {
            return "none";
        }
        Object value = events.get(events.size() - 1).get(key);
        return value == null ? "unknown" : String.valueOf(value);
    }
}
