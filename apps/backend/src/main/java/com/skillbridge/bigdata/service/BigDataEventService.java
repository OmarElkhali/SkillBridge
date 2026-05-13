package com.skillbridge.bigdata.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class BigDataEventService {

    public static final String FLUME_HDFS_EVENTS_PATH = "/data/skillbridge/raw/flume/events";

    private static final Logger log = LoggerFactory.getLogger(BigDataEventService.class);

    private final ObjectMapper objectMapper;
    private final Lock writeLock = new ReentrantLock();

    public BigDataEventService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public boolean appendEvent(String eventType, Map<String, Object> fields) {
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("eventType", eventType);
        event.put("source", "web-app");
        event.put("timestamp", Instant.now().toString());
        event.putAll(fields);

        writeLock.lock();
        try {
            Path path = eventLogPath();
            Files.createDirectories(path.getParent());
            Files.writeString(
                    path,
                    toJsonLine(event),
                    StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.APPEND
            );
            return true;
        } catch (IOException ex) {
            log.warn("Unable to append Big Data event {}", eventType, ex);
            return false;
        } finally {
            writeLock.unlock();
        }
    }

    public Path eventLogPath() {
        Path userDir = Path.of("").toAbsolutePath();
        Path fromRepoRoot = userDir.resolve("apps/bigdata/data/events/events.log");
        Path backendParent = userDir.resolveSibling("bigdata").resolve("data/events/events.log");
        if (Files.exists(userDir.resolve("apps/bigdata")) || !Files.exists(backendParent.getParent())) {
            return fromRepoRoot;
        }
        return backendParent;
    }

    public String eventLogPathString() {
        return eventLogPath().toString();
    }

    private String toJsonLine(Map<String, Object> event) throws JsonProcessingException {
        return objectMapper.writeValueAsString(event) + System.lineSeparator();
    }
}
