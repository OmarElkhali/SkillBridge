package com.skillbridge.recommendation.dto;

import com.skillbridge.course.dto.CourseResponse;

import java.util.List;

public record RecommendedCourseResponse(
        int rank,
        int rankPosition,
        int score,
        int titleMatchScore,
        int skillMatchScore,
        int categoryMatchScore,
        int bonusScore,
        List<String> matchedTitleKeywords,
        List<String> matchedSkills,
        List<String> matchedCategories,
        int popularityScore,
        String sourceUrl,
        String explanation,
        CourseResponse course
) {
}
