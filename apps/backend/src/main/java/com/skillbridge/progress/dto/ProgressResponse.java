package com.skillbridge.progress.dto;

import com.skillbridge.course.dto.CourseResponse;
import com.skillbridge.progress.entity.CourseProgress;

import java.time.Instant;

public record ProgressResponse(
        Long id,
        String status,
        int progressPercent,
        Instant startedAt,
        Instant completedAt,
        Instant lastUpdatedAt,
        CourseResponse course
) {
    public static ProgressResponse from(CourseProgress progress) {
        return new ProgressResponse(
                progress.getId(),
                progress.getStatus().name(),
                progress.getProgressPercent(),
                progress.getStartedAt(),
                progress.getCompletedAt(),
                progress.getLastUpdatedAt(),
                CourseResponse.from(progress.getCourse())
        );
    }
}
