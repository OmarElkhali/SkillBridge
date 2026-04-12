package com.skillbridge.course.dto;

import com.skillbridge.course.entity.CourseLevel;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CourseUpsertRequest(
        @NotBlank @Size(max = 180) String title,
        @NotBlank String description,
        @NotNull CourseLevel level,
        @NotBlank @Size(max = 80) String language,
        @NotBlank @Size(max = 500) String sourceUrl,
        @Size(max = 500) String thumbnailUrl,
        @NotNull Long categoryId,
        @NotNull Long providerId,
        @NotEmpty Set<Long> skillIds,
        boolean published,
        @Min(0) int popularityScore
) {
}
