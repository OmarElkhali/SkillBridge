package com.skillbridge.projectidea.repository;

import com.skillbridge.projectidea.entity.ProjectIdea;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectIdeaRepository extends JpaRepository<ProjectIdea, Long> {

    @EntityGraph(attributePaths = {"detectedSkills", "detectedSkills.skill"})
    List<ProjectIdea> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"detectedSkills", "detectedSkills.skill"})
    Optional<ProjectIdea> findDetailedById(Long id);
}
