package com.skillbridge.admin.controller;

import com.skillbridge.admin.dto.AdminDashboardResponse;
import com.skillbridge.admin.dto.CatalogAnalyticsResponse;
import com.skillbridge.admin.service.AdminService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/overview")
    public AdminDashboardResponse overview() {
        return adminService.overview();
    }

    @GetMapping("/catalog-analytics")
    public CatalogAnalyticsResponse catalogAnalytics() {
        return adminService.catalogAnalytics();
    }

    @GetMapping("/bigdata/pipeline")
    public Map<String, Object> bigDataPipeline() {
        return adminService.bigDataPipeline();
    }

    @GetMapping("/bigdata/catalog-analytics")
    public Map<String, Object> bigDataCatalogAnalytics() {
        return adminService.bigDataCatalogAnalytics();
    }

    @GetMapping("/bigdata/events-analytics")
    public Map<String, Object> bigDataEventsAnalytics() {
        return adminService.bigDataEventsAnalytics();
    }

    @GetMapping("/bigdata/recommendation-analytics")
    public Map<String, Object> bigDataRecommendationAnalytics() {
        return adminService.bigDataRecommendationAnalytics();
    }

    @GetMapping("/bigdata/commands")
    public Map<String, Object> bigDataCommands() {
        return adminService.bigDataCommands();
    }
}
