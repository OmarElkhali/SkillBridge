package com.skillbridge.course.dto;

import com.skillbridge.course.entity.Course;

import java.time.Instant;
import java.util.Set;

public record CourseResponse(
        Long id,
        String title,
        String slug,
        String description,
        String level,
        String language,
        String sourceUrl,
        String thumbnailUrl,
        CategoryResponse category,
        ProviderResponse provider,
        Set<String> skills,
        boolean published,
        int popularityScore,
        Instant createdAt,
        Instant updatedAt
) {
    public static CourseResponse from(Course course) {
        return new CourseResponse(
                course.getId(),
                course.getTitle(),
                course.getSlug(),
                course.getDescription(),
                course.getLevel().name(),
                course.getLanguage(),
                course.getSourceUrl(),
                course.getThumbnailUrl(),
                CategoryResponse.from(course.getCategory()),
                ProviderResponse.from(course.getProvider()),
                course.getSkills().stream().map(skill -> skill.getName()).collect(java.util.stream.Collectors.toCollection(java.util.LinkedHashSet::new)),
                course.isPublished(),
                course.getPopularityScore(),
                course.getCreatedAt(),
                course.getUpdatedAt()
        );
    }
}
