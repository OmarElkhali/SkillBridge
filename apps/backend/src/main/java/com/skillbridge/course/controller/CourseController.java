package com.skillbridge.course.controller;

import com.skillbridge.bigdata.service.BigDataEventService;
import com.skillbridge.common.dto.PageResponse;
import com.skillbridge.course.dto.CourseResponse;
import com.skillbridge.course.dto.CourseUpsertRequest;
import com.skillbridge.course.service.CourseService;
import com.skillbridge.security.AppUserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;
    private final BigDataEventService bigDataEventService;

    public CourseController(CourseService courseService, BigDataEventService bigDataEventService) {
        this.courseService = courseService;
        this.bigDataEventService = bigDataEventService;
    }

    @GetMapping
    public PageResponse<CourseResponse> listPublished(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false, name = "q") String query,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long providerId,
            @RequestParam(required = false) Long skillId,
            @RequestParam(required = false) String level,
            @RequestParam(defaultValue = "title") String sort,
            @AuthenticationPrincipal AppUserPrincipal principal
    ) {
        if (query != null && !query.isBlank()) {
            Map<String, Object> event = new LinkedHashMap<>();
            event.put("userId", principal == null ? null : principal.getId());
            event.put("query", query.trim());
            event.put("categoryId", categoryId);
            event.put("providerId", providerId);
            event.put("skillId", skillId);
            event.put("level", level);
            event.put("sort", sort);
            bigDataEventService.appendEvent("COURSE_SEARCH", event);
        }
        return courseService.publicCatalog(page, size, query, categoryId, providerId, skillId, level, sort);
    }

    @PostMapping("/{id}/click")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void recordClick(@PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal principal) {
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("userId", principal == null ? null : principal.getId());
        event.put("courseId", id);
        bigDataEventService.appendEvent("COURSE_CLICK", event);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<CourseResponse> listAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false, name = "q") String query,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long providerId,
            @RequestParam(required = false) Long skillId,
            @RequestParam(required = false) String level,
            @RequestParam(defaultValue = "title") String sort
    ) {
        return courseService.adminCatalog(page, size, query, categoryId, providerId, skillId, level, sort);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public CourseResponse create(@Valid @RequestBody CourseUpsertRequest request) {
        return courseService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CourseResponse update(@PathVariable Long id, @Valid @RequestBody CourseUpsertRequest request) {
        return courseService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        courseService.delete(id);
    }
}
