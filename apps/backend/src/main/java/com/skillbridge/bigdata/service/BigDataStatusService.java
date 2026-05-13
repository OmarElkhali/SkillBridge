package com.skillbridge.bigdata.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillbridge.bigdata.dto.BigDataFileResponse;
import com.skillbridge.bigdata.dto.BigDataRefreshResponse;
import com.skillbridge.bigdata.dto.BigDataStatusResponse;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class BigDataStatusService {

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;
    private final BigDataEventService bigDataEventService;

    public BigDataStatusService(ObjectMapper objectMapper, BigDataEventService bigDataEventService) {
        this.objectMapper = objectMapper;
        this.bigDataEventService = bigDataEventService;
    }

    public BigDataStatusResponse status() {
        Path output = outputRoot();
        Path catalogReport = output.resolve("catalog/catalog_build_report.json");
        Path summary = output.resolve("bigdata-summary.json");
        Path recommendation = output.resolve("recommendation_result.json");
        Path events = bigDataEventService.eventLogPath();

        return new BigDataStatusResponse(
                List.of(
                        file("catalog_build_report", catalogReport),
                        file("bigdata_summary", summary),
                        file("recommendation_result", recommendation),
                        file("events_log", events)
                ),
                readJson(catalogReport),
                readJson(summary),
                readJson(recommendation),
                latestEvents(20),
                pipelineHealth(catalogReport, summary, recommendation, events),
                BigDataEventService.FLUME_HDFS_EVENTS_PATH
        );
    }

    public Map<String, Object> catalogSummary() {
        return readJson(outputRoot().resolve("catalog/catalog_build_report.json"));
    }

    public Map<String, Object> outputJson(String relativePath) {
        return readJson(outputRoot().resolve(relativePath));
    }

    public BigDataFileResponse outputFile(String name, String relativePath) {
        return file(name, outputRoot().resolve(relativePath));
    }

    public List<Map<String, Object>> latestEvents(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        Path path = bigDataEventService.eventLogPath();
        if (!Files.exists(path)) {
            return List.of();
        }

        try {
            List<String> lines = Files.readAllLines(path, StandardCharsets.UTF_8);
            Collections.reverse(lines);
            List<Map<String, Object>> events = new ArrayList<>();
            for (String line : lines) {
                if (line.isBlank()) {
                    continue;
                }
                try {
                    events.add(objectMapper.readValue(line, MAP_TYPE));
                } catch (IOException ignored) {
                    Map<String, Object> invalid = new LinkedHashMap<>();
                    invalid.put("invalidLine", line);
                    events.add(invalid);
                }
                if (events.size() >= safeLimit) {
                    break;
                }
            }
            return events;
        } catch (IOException ex) {
            return List.of();
        }
    }

    public List<Map<String, Object>> allEvents() {
        Path path = bigDataEventService.eventLogPath();
        if (!Files.exists(path)) {
            return List.of();
        }

        try {
            List<Map<String, Object>> events = new ArrayList<>();
            for (String line : Files.readAllLines(path, StandardCharsets.UTF_8)) {
                if (line.isBlank()) {
                    continue;
                }
                try {
                    events.add(objectMapper.readValue(line, MAP_TYPE));
                } catch (IOException ignored) {
                    Map<String, Object> invalid = new LinkedHashMap<>();
                    invalid.put("invalidLine", line);
                    events.add(invalid);
                }
            }
            return events;
        } catch (IOException ex) {
            return List.of();
        }
    }

    public String eventLogPathString() {
        return bigDataEventService.eventLogPathString();
    }

    public Map<String, Object> latestRecommendation() {
        return readJson(outputRoot().resolve("recommendation_result.json"));
    }

    public Map<String, Object> hiveSummary() {
        Map<String, Object> summary = readJson(outputRoot().resolve("bigdata-summary.json"));
        Map<String, Object> hive = section(summary, "hive");
        if (!hive.isEmpty()) {
            return hive;
        }
        return Map.of(
                "status", "not generated yet",
                "queryCommand", "docker compose exec hive-server beeline -u jdbc:hive2://localhost:10000 -e \"use skillbridge_bigdata; select count(*) from hive_events;\""
        );
    }

    public Map<String, Object> topKeywords() {
        Map<String, Object> summary = readJson(outputRoot().resolve("bigdata-summary.json"));
        Map<String, Object> mapReduce = section(summary, "mapreduce");
        if (!mapReduce.isEmpty()) {
            return mapReduce;
        }
        Object topSearchKeywords = summary.get("topSearchKeywords");
        if (topSearchKeywords instanceof List<?>) {
            return Map.of(
                    "outputPath", "/data/skillbridge/processed/mapreduce/top_search_keywords",
                    "topSearchKeywords", topSearchKeywords
            );
        }
        return section(summary, "top_keywords");
    }

    public Map<String, Object> hbaseCourseStats() {
        Map<String, Object> summary = readJson(outputRoot().resolve("bigdata-summary.json"));
        Map<String, Object> hbase = section(summary, "hbase");
        if (!hbase.isEmpty()) {
            return hbase;
        }
        return section(summary, "course_stats");
    }

    public boolean latestAnalyticsAvailable() {
        return !readJson(outputRoot().resolve("bigdata-summary.json")).isEmpty();
    }

    public BigDataRefreshResponse refreshInstructions() {
        return new BigDataRefreshResponse(
                false,
                "Hadoop jobs remain terminal-first to avoid blocking the Spring Boot API. Run these commands from apps/bigdata, then reload the dashboard.",
                List.of(
                        "cd apps\\bigdata",
                        "docker compose up -d --scale datanode=2 namenode datanode flume-agent hive-metastore-postgresql hive-metastore hive-server hbase",
                        "docker compose exec namenode hdfs dfsadmin -report",
                        "docker compose exec namenode hdfs dfs -ls -R /data/skillbridge/raw/flume/events",
                        "docker compose exec hive-server beeline -u jdbc:hive2://localhost:10000 --silent=true --showHeader=true --outputformat=table -e \"use skillbridge_bigdata; select count(*) as hive_courses from hive_courses; select count(*) as hive_events from hive_events;\"",
                        "powershell -ExecutionPolicy Bypass -File .\\scripts\\07_run_mapreduce.ps1",
                        "docker compose exec namenode hdfs dfs -cat /data/skillbridge/processed/mapreduce/top_search_keywords/part-r-00000",
                        "python .\\scripts\\09_load_course_stats_hbase.py",
                        "docker compose exec hbase hbase shell /opt/skillbridge/output/load_course_stats.hbase",
                        "docker compose exec hbase bash -lc \"echo \\\"scan 'course_stats', {LIMIT => 10}\\\" | hbase shell -n\"",
                        "Get-Content .\\output\\bigdata-summary.json",
                        "Get-Content .\\output\\recommendation_result.json"
                )
        );
    }

    public Map<String, Object> pipelineTrace() {
        Map<String, Object> summary = readJson(outputRoot().resolve("bigdata-summary.json"));
        Map<String, Object> catalogReport = readJson(outputRoot().resolve("catalog/catalog_build_report.json"));
        Map<String, Object> trace = new LinkedHashMap<>();
        trace.put("executionMode", "web-fast-java-recommendation-plus-terminal-first-hadoop-refresh");
        trace.put("eventLogPath", bigDataEventService.eventLogPathString());
        trace.put("flumeHdfsPath", BigDataEventService.FLUME_HDFS_EVENTS_PATH);
        trace.put("namenode", Map.of(
                "role", "HDFS metadata manager",
                "verifyCommand", "docker compose exec namenode hdfs dfsadmin -report"
        ));
        trace.put("datanodes", Map.of(
                "role", "HDFS block storage workers",
                "defaultScale", 2,
                "scaleCommand", "docker compose up -d --scale datanode=2 namenode datanode"
        ));
        trace.put("flume", Map.of(
                "role", "streams events.log into HDFS",
                "source", bigDataEventService.eventLogPathString(),
                "sink", BigDataEventService.FLUME_HDFS_EVENTS_PATH
        ));
        trace.put("hdfs", Map.of(
                "rawEventsPath", BigDataEventService.FLUME_HDFS_EVENTS_PATH,
                "mapReduceOutputPath", "/data/skillbridge/processed/mapreduce/top_search_keywords",
                "verifyCommand", "docker compose exec namenode hdfs dfs -ls -R /data/skillbridge"
        ));
        trace.put("hive", section(summary, "hive"));
        trace.put("mapreduce", topKeywords());
        trace.put("hbase", hbaseCourseStats());
        trace.put("catalog", catalogReport);
        return trace;
    }

    public void writeRecommendationResult(Map<String, Object> result) {
        Path path = outputRoot().resolve("recommendation_result.json");
        Path tempPath = path.resolveSibling(path.getFileName() + ".tmp");
        try {
            Files.createDirectories(path.getParent());
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(tempPath.toFile(), result);
            Files.move(tempPath, path, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ignored) {
            // The API response should not fail just because the terminal-first artifact cannot be refreshed.
        }
    }

    public Map<String, Object> courseStatsForCourse(Long courseId) {
        Map<String, Object> stats = hbaseCourseStats();
        Object rows = stats.get("sample");
        if (rows instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> map && String.valueOf(courseId).equals(String.valueOf(map.get("courseId")))) {
                    Map<String, Object> result = new LinkedHashMap<>();
                    map.forEach((key, value) -> result.put(String.valueOf(key), value));
                    return result;
                }
            }
        }
        return Map.of();
    }

    private Path outputRoot() {
        Path userDir = Path.of("").toAbsolutePath();
        Path fromRepoRoot = userDir.resolve("apps/bigdata/output");
        if (Files.exists(fromRepoRoot)) {
            return fromRepoRoot;
        }
        Path fromBackend = userDir.resolveSibling("bigdata").resolve("output");
        if (Files.exists(fromBackend)) {
            return fromBackend;
        }
        return fromRepoRoot;
    }

    private BigDataFileResponse file(String name, Path path) {
        try {
            if (!Files.exists(path)) {
                return new BigDataFileResponse(name, path.toString(), false, 0, null);
            }
            return new BigDataFileResponse(name, path.toString(), true, Files.size(path), Files.getLastModifiedTime(path).toInstant());
        } catch (IOException ex) {
            return new BigDataFileResponse(name, path.toString(), false, 0, Instant.EPOCH);
        }
    }

    private Map<String, Object> pipelineHealth(Path catalogReport, Path summary, Path recommendation, Path events) {
        Map<String, Object> health = new LinkedHashMap<>();
        health.put("postgresMirrorStatus", "terminal-first");
        health.put("namenodeStatus", "verify with: docker compose exec namenode hdfs dfsadmin -report");
        health.put("datanodeStatus", "default demo scale is 2 DataNodes; verify with dfsadmin -report");
        health.put("eventsLogStatus", Files.exists(events) ? "available" : "missing");
        health.put("hdfsStatus", "verify with: docker compose exec namenode hdfs dfs -ls -R " + BigDataEventService.FLUME_HDFS_EVENTS_PATH);
        health.put("flumeStatus", "watches " + bigDataEventService.eventLogPathString());
        health.put("hiveStatus", Files.exists(summary) ? "summary available" : "summary not generated yet");
        health.put("mapReduceOutputStatus", Files.exists(summary) ? "latest summary available" : "run MapReduce refresh command");
        health.put("hbaseStatus", Files.exists(summary) ? "course_stats summary available" : "run HBase load command");
        health.put("catalogReportStatus", Files.exists(catalogReport) ? "available" : "missing");
        health.put("latestRecommendationStatus", Files.exists(recommendation) ? "available" : "missing");
        return health;
    }

    private Map<String, Object> readJson(Path path) {
        try {
            if (!Files.exists(path) || Files.size(path) == 0) {
                return Map.of();
            }
            return objectMapper.readValue(path.toFile(), MAP_TYPE);
        } catch (IOException ex) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("error", "Unable to read " + path.getFileName());
            return error;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> section(Map<String, Object> data, String key) {
        Object value = data.get(key);
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }
}
