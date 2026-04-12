package com.skillbridge.user.controller;

import com.skillbridge.security.AppUserPrincipal;
import com.skillbridge.user.dto.UserSummaryResponse;
import com.skillbridge.user.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/api/users/me")
    public UserSummaryResponse me(@AuthenticationPrincipal AppUserPrincipal principal) {
        return userService.getCurrentUserSummary(principal);
    }

    @GetMapping("/api/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserSummaryResponse> listUsers() {
        return userService.listUsers();
    }
}
