package com.skillbridge.recommendation;

import java.util.Set;

public final class RecommendationKeywords {

    private RecommendationKeywords() {
    }

    public static final Set<String> STOP_WORDS = Set.of(
            "a", "an", "and", "the", "to", "for", "with", "of", "in", "on", "using", "build", "create",
            "want", "need", "application", "app", "project", "that", "this", "from", "by", "into", "or",
            "i", "my", "me", "is", "are", "be", "as", "at", "it", "learn", "make"
    );
}
