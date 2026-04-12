package com.skillbridge.progress.repository;

import com.skillbridge.progress.entity.CourseProgress;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseProgressRepository extends JpaRepository<CourseProgress, Long> {

    @EntityGraph(attributePaths = {"course", "course.category", "course.provider", "course.skills"})
    List<CourseProgress> findByUserIdOrderByLastUpdatedAtDesc(Long userId);

    Optional<CourseProgress> findByUserIdAndCourseId(Long userId, Long courseId);
}
