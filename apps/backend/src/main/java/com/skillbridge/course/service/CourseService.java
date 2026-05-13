package com.skillbridge.course.service;

import com.skillbridge.common.dto.PageResponse;
import com.skillbridge.common.exception.ResourceNotFoundException;
import com.skillbridge.course.dto.CourseResponse;
import com.skillbridge.course.dto.CourseUpsertRequest;
import com.skillbridge.course.entity.Course;
import com.skillbridge.course.repository.CourseRepository;
import com.skillbridge.skill.service.SkillService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class CourseService {

    private final CourseRepository courseRepository;
    private final CategoryService categoryService;
    private final ProviderService providerService;
    private final SkillService skillService;

    public CourseService(
            CourseRepository courseRepository,
            CategoryService categoryService,
            ProviderService providerService,
            SkillService skillService
    ) {
        this.courseRepository = courseRepository;
        this.categoryService = categoryService;
        this.providerService = providerService;
        this.skillService = skillService;
    }

    @Transactional(readOnly = true)
    public PageResponse<CourseResponse> publicCatalog(int page, int size, String query, Long categoryId, Long providerId, Long skillId, String level, String sort) {
        return searchCatalog(true, page, size, query, categoryId, providerId, skillId, level, sort);
    }

    @Transactional(readOnly = true)
    public PageResponse<CourseResponse> adminCatalog(int page, int size, String query, Long categoryId, Long providerId, Long skillId, String level, String sort) {
        return searchCatalog(false, page, size, query, categoryId, providerId, skillId, level, sort);
    }

    public CourseResponse create(CourseUpsertRequest request) {
        Course course = new Course();
        apply(course, request);
        return CourseResponse.from(courseRepository.save(course));
    }

    public CourseResponse update(Long id, CourseUpsertRequest request) {
        Course course = getEntity(id);
        apply(course, request);
        return CourseResponse.from(courseRepository.save(course));
    }

    public void delete(Long id) {
        courseRepository.delete(getEntity(id));
    }

    public Course getEntity(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found."));
    }

    private void apply(Course course, CourseUpsertRequest request) {
        course.setTitle(request.title().trim());
        course.setDescription(request.description().trim());
        course.setLevel(request.level());
        course.setLanguage(request.language().trim());
        course.setSourceUrl(request.sourceUrl().trim());
        course.setThumbnailUrl(request.thumbnailUrl());
        course.setCategory(categoryService.getEntity(request.categoryId()));
        course.setProvider(providerService.getEntity(request.providerId()));
        course.setSkills(skillService.findAllByIds(request.skillIds()));
        course.setPublished(request.published());
        course.setPopularityScore(request.popularityScore());
    }

    private PageResponse<CourseResponse> searchCatalog(
            boolean publishedOnly,
            int page,
            int size,
            String query,
            Long categoryId,
            Long providerId,
            Long skillId,
            String level,
            String sort
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size, 50));
        String normalizedQuery = normalizeQuery(query);
        String normalizedLevel = normalizeLevel(level);
        String normalizedSort = "popularity".equalsIgnoreCase(sort) ? "popularity" : "title";
        PageRequest pageRequest = PageRequest.of(safePage, safeSize);
        Page<Long> idPage = courseRepository.searchCourseIds(publishedOnly, normalizedQuery, categoryId, providerId, skillId, normalizedLevel, normalizedSort, pageRequest);

        if (idPage.isEmpty()) {
            return PageResponse.from(idPage, List.of());
        }

        Map<Long, Course> coursesById = courseRepository.findDistinctByIdIn(idPage.getContent())
                .stream()
                .collect(Collectors.toMap(Course::getId, Function.identity()));

        List<CourseResponse> content = idPage.getContent()
                .stream()
                .map(coursesById::get)
                .filter(java.util.Objects::nonNull)
                .sorted(Comparator.comparing(Course::getTitle, String.CASE_INSENSITIVE_ORDER))
                .map(CourseResponse::from)
                .toList();

        return PageResponse.from(idPage, content);
    }

    private String normalizeQuery(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }
        return query.trim();
    }

    private String normalizeLevel(String level) {
        if (level == null || level.isBlank() || "ALL".equalsIgnoreCase(level)) {
            return null;
        }
        return level.trim().toUpperCase(java.util.Locale.ROOT);
    }
}
