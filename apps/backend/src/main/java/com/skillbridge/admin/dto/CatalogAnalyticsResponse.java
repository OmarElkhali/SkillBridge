package com.skillbridge.admin.dto;

import java.util.List;

public record CatalogAnalyticsResponse(
        List<CatalogMetricResponse> topCategories,
        List<CatalogMetricResponse> topProviders,
        List<CatalogMetricResponse> topSkills,
        List<CatalogMetricResponse> levelDistribution,
        SkillCoverageResponse skillCoverage
) {
}
