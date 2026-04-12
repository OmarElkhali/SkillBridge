package com.skillbridge.savedcourse.controller;

import com.skillbridge.savedcourse.dto.SavedCourseResponse;
import com.skillbridge.savedcourse.service.SavedCourseService;
import com.skillbridge.security.AppUserPrincipal;
import com.skillbridge.user.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/saved-courses")
public class SavedCourseController {

    private final SavedCourseService savedCourseService;
    private final UserService userService;

    public SavedCourseController(SavedCourseService savedCourseService, UserService userService) {
        this.savedCourseService = savedCourseService;
        this.userService = userService;
    }

    @GetMapping
    public List<SavedCourseResponse> list(@AuthenticationPrincipal AppUserPrincipal principal) {
        return savedCourseService.list(userService.getCurrentUser(principal));
    }

    @PostMapping("/{courseId}")
    @ResponseStatus(HttpStatus.CREATED)
    public SavedCourseResponse save(@PathVariable Long courseId, @AuthenticationPrincipal AppUserPrincipal principal) {
        return savedCourseService.save(courseId, userService.getCurrentUser(principal));
    }

    @DeleteMapping("/{courseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable Long courseId, @AuthenticationPrincipal AppUserPrincipal principal) {
        savedCourseService.remove(courseId, userService.getCurrentUser(principal));
    }
}
