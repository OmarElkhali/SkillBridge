package com.skillbridge.recommendation;

import com.skillbridge.projectidea.entity.MatchSource;
import com.skillbridge.projectidea.entity.ProjectDetectedSkill;
import com.skillbridge.projectidea.entity.ProjectIdea;
import com.skillbridge.skill.entity.Skill;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RecommendationServiceTests {

    @Test
    void extractTokensRemovesStopWordsAndNormalizesText() {
        RecommendationService service = new RecommendationService(null, null, null, null, null, null);

        Set<String> tokens = service.extractTokens("I want to build a secure e-commerce application with Spring Boot and REST API.");

        assertTrue(tokens.contains("secure"));
        assertTrue(tokens.contains("commerce"));
        assertTrue(tokens.contains("spring"));
        assertTrue(tokens.contains("boot"));
        assertTrue(tokens.contains("rest"));
        assertFalse(tokens.contains("want"));
        assertFalse(tokens.contains("application"));
    }

    @Test
    void detectSkillsUsesAiAliasesWhenProjectMentionsAssistant() {
        RecommendationService service = new RecommendationService(null, null, null, null, null, null);
        ProjectIdea projectIdea = new ProjectIdea();

        List<ProjectDetectedSkill> detectedSkills = service.detectSkills(
                projectIdea,
                service.normalizeText("Create a small AI study assistant for students"),
                List.of(
                        skill(1L, "Generative AI"),
                        skill(2L, "Prompt Engineering"),
                        skill(3L, "Spring Boot")
                )
        );

        assertEquals(2, detectedSkills.size());
        assertTrue(detectedSkills.stream().map(item -> item.getSkill().getName()).toList().containsAll(List.of("Generative AI", "Prompt Engineering")));
        assertTrue(detectedSkills.stream().allMatch(item -> item.getMatchSource() == MatchSource.CATEGORY_HINT));
    }

    private static Skill skill(Long id, String name) {
        Skill skill = new Skill(name, "Test skill");
        skill.setId(id);
        return skill;
    }
}
