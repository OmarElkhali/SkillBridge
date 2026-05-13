package com.skillbridge.admin.dto;

public record AdminDashboardResponse(
        long totalUsers,
        long totalCourses,
        long totalProviders,
        long totalCategories,
        long totalSkills,
        long totalProjects,
        long savedCourses,
        long progressEntries,
        long totalRecommendationSnapshots,
        long totalRecommendationResults
) {
}
