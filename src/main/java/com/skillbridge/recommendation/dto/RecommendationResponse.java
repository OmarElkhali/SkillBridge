package com.skillbridge.recommendation.dto;

import com.skillbridge.projectidea.dto.ProjectIdeaResponse;

import java.time.Instant;
import java.util.List;

public record RecommendationResponse(
        Long snapshotId,
        Instant generatedAt,
        String algorithmVersion,
        String keywordSummary,
        ProjectIdeaResponse project,
        List<DetectedSkillResponse> detectedSkills,
        List<RecommendedCourseResponse> recommendations
) {
}
