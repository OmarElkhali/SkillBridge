package com.skillbridge.savedcourse.dto;

import com.skillbridge.course.dto.CourseResponse;
import com.skillbridge.savedcourse.entity.SavedCourse;

import java.time.Instant;

public record SavedCourseResponse(
        Long id,
        Instant savedAt,
        CourseResponse course
) {
    public static SavedCourseResponse from(SavedCourse savedCourse) {
        return new SavedCourseResponse(savedCourse.getId(), savedCourse.getSavedAt(), CourseResponse.from(savedCourse.getCourse()));
    }
}
