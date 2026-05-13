package com.skillbridge.projectidea.service;

import com.skillbridge.bigdata.service.BigDataEventService;
import com.skillbridge.common.exception.ResourceNotFoundException;
import com.skillbridge.projectidea.dto.ProjectIdeaCreateRequest;
import com.skillbridge.projectidea.dto.ProjectIdeaResponse;
import com.skillbridge.projectidea.entity.ProjectIdea;
import com.skillbridge.projectidea.entity.ProjectStatus;
import com.skillbridge.projectidea.repository.ProjectIdeaRepository;
import com.skillbridge.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ProjectIdeaService {

    private final ProjectIdeaRepository projectIdeaRepository;
    private final BigDataEventService bigDataEventService;

    public ProjectIdeaService(ProjectIdeaRepository projectIdeaRepository, BigDataEventService bigDataEventService) {
        this.projectIdeaRepository = projectIdeaRepository;
        this.bigDataEventService = bigDataEventService;
    }

    public ProjectIdeaResponse create(ProjectIdeaCreateRequest request, User user) {
        ProjectIdea projectIdea = new ProjectIdea();
        projectIdea.setUser(user);
        projectIdea.setTitle(request.title().trim());
        projectIdea.setDescription(request.description().trim());
        projectIdea.setStatus(ProjectStatus.ACTIVE);
        ProjectIdea saved = projectIdeaRepository.save(projectIdea);
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("userId", user.getId());
        event.put("projectId", saved.getId());
        event.put("projectTitle", saved.getTitle());
        event.put("projectDescription", saved.getDescription());
        bigDataEventService.appendEvent("PROJECT_CREATED", event);
        return ProjectIdeaResponse.from(saved);
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
