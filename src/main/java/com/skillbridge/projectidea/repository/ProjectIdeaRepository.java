package com.skillbridge.projectidea.repository;

import com.skillbridge.projectidea.entity.ProjectIdea;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectIdeaRepository extends JpaRepository<ProjectIdea, Long> {

    @EntityGraph(attributePaths = {"detectedSkills", "detectedSkills.skill"})
    List<ProjectIdea> findByUserIdOrderByCreatedAtDesc(Long userId);
}
