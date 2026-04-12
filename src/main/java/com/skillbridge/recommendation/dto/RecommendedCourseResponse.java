package com.skillbridge.recommendation.dto;

import com.skillbridge.course.dto.CourseResponse;

public record RecommendedCourseResponse(
        int rank,
        int score,
        int titleMatchScore,
        int skillMatchScore,
        int categoryMatchScore,
        int bonusScore,
        String explanation,
        CourseResponse course
) {
}
