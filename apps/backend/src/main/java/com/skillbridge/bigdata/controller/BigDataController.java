package com.skillbridge.bigdata.controller;

import com.skillbridge.bigdata.dto.BigDataRefreshResponse;
import com.skillbridge.bigdata.dto.BigDataStatusResponse;
import com.skillbridge.bigdata.service.BigDataStatusService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bigdata")
@PreAuthorize("hasRole('ADMIN')")
public class BigDataController {

    private final BigDataStatusService bigDataStatusService;

    public BigDataController(BigDataStatusService bigDataStatusService) {
        this.bigDataStatusService = bigDataStatusService;
    }

    @GetMapping("/status")
    public BigDataStatusResponse status() {
        return bigDataStatusService.status();
    }

    @GetMapping("/catalog-summary")
    public Map<String, Object> catalogSummary() {
        return bigDataStatusService.catalogSummary();
    }

    @GetMapping("/events/latest")
    public List<Map<String, Object>> latestEvents(@RequestParam(defaultValue = "20") int limit) {
        return bigDataStatusService.latestEvents(limit);
    }

    @GetMapping("/hive/summary")
    public Map<String, Object> hiveSummary() {
        return bigDataStatusService.hiveSummary();
    }

    @GetMapping("/mapreduce/top-keywords")
    public Map<String, Object> topKeywords() {
        return bigDataStatusService.topKeywords();
    }

    @GetMapping("/hbase/course-stats")
    public Map<String, Object> hbaseCourseStats() {
        return bigDataStatusService.hbaseCourseStats();
    }

    @GetMapping("/recommendation/latest")
    public Map<String, Object> latestRecommendation() {
        return bigDataStatusService.latestRecommendation();
    }

    @PostMapping("/analytics/refresh")
    public BigDataRefreshResponse refreshAnalytics() {
        return bigDataStatusService.refreshInstructions();
    }
}
