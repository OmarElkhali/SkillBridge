package com.skillbridge.savedcourse.repository;

import com.skillbridge.savedcourse.entity.SavedCourse;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedCourseRepository extends JpaRepository<SavedCourse, Long> {

    @EntityGraph(attributePaths = {"course", "course.category", "course.provider", "course.skills"})
    List<SavedCourse> findByUserIdOrderBySavedAtDesc(Long userId);

    Optional<SavedCourse> findByUserIdAndCourseId(Long userId, Long courseId);
}
