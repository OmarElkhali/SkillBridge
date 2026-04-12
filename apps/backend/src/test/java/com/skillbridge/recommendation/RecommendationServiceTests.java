package com.skillbridge.recommendation;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RecommendationServiceTests {

    @Test
    void extractTokensRemovesStopWordsAndNormalizesText() {
        RecommendationService service = new RecommendationService(null, null, null, null);

        Set<String> tokens = service.extractTokens("I want to build a secure e-commerce application with Spring Boot and REST API.");

        assertTrue(tokens.contains("secure"));
        assertTrue(tokens.contains("commerce"));
        assertTrue(tokens.contains("spring"));
        assertTrue(tokens.contains("boot"));
        assertTrue(tokens.contains("rest"));
        assertFalse(tokens.contains("want"));
        assertFalse(tokens.contains("application"));
    }
}
