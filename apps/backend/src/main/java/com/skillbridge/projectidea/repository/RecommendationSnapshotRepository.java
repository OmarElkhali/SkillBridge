package com.skillbridge.projectidea.repository;

import com.skillbridge.projectidea.entity.RecommendationSnapshot;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RecommendationSnapshotRepository extends JpaRepository<RecommendationSnapshot, Long> {

    @EntityGraph(attributePaths = {"results", "results.course", "results.course.category", "results.course.provider", "results.course.skills", "projectIdea"})
    Optional<RecommendationSnapshot> findFirstByProjectIdeaIdOrderByGeneratedAtDesc(Long projectIdeaId);
}
