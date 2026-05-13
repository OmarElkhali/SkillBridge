package com.skillbridge.admin.dto;

public record SkillCoverageResponse(
        long totalCourses,
        long coursesWithSkills,
        double coveragePercent
) {
}
