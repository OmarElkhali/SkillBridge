package com.skillbridge.admin.dto;

public record AdminDashboardResponse(
        long totalUsers,
        long totalCourses,
        long totalSkills,
        long totalProjects,
        long savedCourses,
        long progressEntries
) {
}
