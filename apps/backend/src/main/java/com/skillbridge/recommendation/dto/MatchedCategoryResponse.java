package com.skillbridge.recommendation.dto;

import java.util.List;

public record MatchedCategoryResponse(
        Long categoryId,
        String name,
        List<String> matchedKeywords
) {
}
