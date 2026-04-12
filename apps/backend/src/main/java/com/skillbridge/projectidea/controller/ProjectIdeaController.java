package com.skillbridge.projectidea.controller;

import com.skillbridge.projectidea.dto.ProjectIdeaCreateRequest;
import com.skillbridge.projectidea.dto.ProjectIdeaResponse;
import com.skillbridge.projectidea.service.ProjectIdeaService;
import com.skillbridge.recommendation.RecommendationService;
import com.skillbridge.recommendation.dto.RecommendationResponse;
import com.skillbridge.security.AppUserPrincipal;
import com.skillbridge.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectIdeaController {

    private final ProjectIdeaService projectIdeaService;
    private final RecommendationService recommendationService;
    private final UserService userService;

    public ProjectIdeaController(
            ProjectIdeaService projectIdeaService,
            RecommendationService recommendationService,
            UserService userService
    ) {
        this.projectIdeaService = projectIdeaService;
        this.recommendationService = recommendationService;
        this.userService = userService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectIdeaResponse create(
            @Valid @RequestBody ProjectIdeaCreateRequest request,
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        return projectIdeaService.create(request, userService.getCurrentUser(principal));
    }

    @GetMapping
    public List<ProjectIdeaResponse> list(@AuthenticationPrincipal AppUserPrincipal principal) {
        return projectIdeaService.listForUser(userService.getCurrentUser(principal));
    }

    @GetMapping("/{id}")
    public ProjectIdeaResponse detail(@PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal principal) {
        return projectIdeaService.findByIdForUser(id, userService.getCurrentUser(principal));
    }

    @PostMapping("/{id}/recommendations")
    public com.skillbridge.recommendation.dto.RecommendationResponse generateRecommendations(
            @PathVariable Long id,
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        return recommendationService.generateForProject(id, userService.getCurrentUser(principal));
    }

    @GetMapping("/{id}/recommendations/latest")
    public com.skillbridge.recommendation.dto.RecommendationResponse latestRecommendations(
            @PathVariable Long id,
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        return recommendationService.latestForProject(id, userService.getCurrentUser(principal));
    }
}
