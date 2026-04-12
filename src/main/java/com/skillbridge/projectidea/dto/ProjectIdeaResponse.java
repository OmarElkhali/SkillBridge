package com.skillbridge.projectidea.dto;

import com.skillbridge.projectidea.entity.ProjectIdea;

import java.time.Instant;
import java.util.List;

public record ProjectIdeaResponse(
        Long id,
        String title,
        String description,
        String status,
        Instant createdAt,
        Instant updatedAt,
        List<String> detectedSkills
) {
    public static ProjectIdeaResponse from(ProjectIdea projectIdea) {
        return new ProjectIdeaResponse(
                projectIdea.getId(),
                projectIdea.getTitle(),
                projectIdea.getDescription(),
                projectIdea.getStatus().name(),
                projectIdea.getCreatedAt(),
                projectIdea.getUpdatedAt(),
                projectIdea.getDetectedSkills().stream().map(skill -> skill.getSkill().getName()).distinct().toList()
        );
    }
}
