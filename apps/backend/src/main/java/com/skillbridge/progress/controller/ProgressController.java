package com.skillbridge.progress.controller;

import com.skillbridge.progress.dto.ProgressResponse;
import com.skillbridge.progress.dto.ProgressUpdateRequest;
import com.skillbridge.progress.service.ProgressService;
import com.skillbridge.security.AppUserPrincipal;
import com.skillbridge.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final ProgressService progressService;
    private final UserService userService;

    public ProgressController(ProgressService progressService, UserService userService) {
        this.progressService = progressService;
        this.userService = userService;
    }

    @GetMapping
    public List<ProgressResponse> list(@AuthenticationPrincipal AppUserPrincipal principal) {
        return progressService.list(userService.getCurrentUser(principal));
    }

    @PutMapping("/{courseId}")
    public ProgressResponse update(
            @PathVariable Long courseId,
            @Valid @RequestBody ProgressUpdateRequest request,
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        return progressService.update(courseId, request, userService.getCurrentUser(principal));
    }
}
