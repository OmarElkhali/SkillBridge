package com.skillbridge.recommendation.dto;

public record DetectedSkillResponse(
        Long skillId,
        String skillName,
        String matchedKeyword,
        String matchSource,
        double confidenceScore
) {
}
