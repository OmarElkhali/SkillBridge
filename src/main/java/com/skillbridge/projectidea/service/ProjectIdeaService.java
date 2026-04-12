package com.skillbridge.projectidea.service;

import com.skillbridge.common.exception.ResourceNotFoundException;
import com.skillbridge.projectidea.dto.ProjectIdeaCreateRequest;
import com.skillbridge.projectidea.dto.ProjectIdeaResponse;
import com.skillbridge.projectidea.entity.ProjectIdea;
import com.skillbridge.projectidea.entity.ProjectStatus;
import com.skillbridge.projectidea.repository.ProjectIdeaRepository;
import com.skillbridge.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProjectIdeaService {

    private final ProjectIdeaRepository projectIdeaRepository;

    public ProjectIdeaService(ProjectIdeaRepository projectIdeaRepository) {
        this.projectIdeaRepository = projectIdeaRepository;
    }

    public ProjectIdeaResponse create(ProjectIdeaCreateRequest request, User user) {
        ProjectIdea projectIdea = new ProjectIdea();
        projectIdea.setUser(user);
        projectIdea.setTitle(request.title().trim());
        projectIdea.setDescription(request.description().trim());
        projectIdea.setStatus(ProjectStatus.ACTIVE);
        return ProjectIdeaResponse.from(projectIdeaRepository.save(projectIdea));
    }

    @Transactional(readOnly = true)
    public List<ProjectIdeaResponse> listForUser(User user) {
        return projectIdeaRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(ProjectIdeaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectIdeaResponse findByIdForUser(Long id, User user) {
        ProjectIdea projectIdea = projectIdeaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project idea not found."));
        if (!projectIdea.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Project idea not found.");
        }
        return ProjectIdeaResponse.from(projectIdea);
    }
}
