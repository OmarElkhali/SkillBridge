package com.skillbridge.course.repository;

import com.skillbridge.course.entity.Course;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {

    @Override
    @EntityGraph(attributePaths = {"category", "provider", "skills"})
    List<Course> findAll();

    @EntityGraph(attributePaths = {"category", "provider", "skills"})
    List<Course> findByPublishedTrueOrderByTitleAsc();

    @EntityGraph(attributePaths = {"category", "provider", "skills"})
    List<Course> findDistinctByPublishedTrueAndSkillsIdInOrderByTitleAsc(Collection<Long> skillIds);
}
