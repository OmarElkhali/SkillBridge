package com.skillbridge.course.service;

import com.skillbridge.common.exception.ResourceNotFoundException;
import com.skillbridge.course.dto.CourseResponse;
import com.skillbridge.course.dto.CourseUpsertRequest;
import com.skillbridge.course.entity.Course;
import com.skillbridge.course.repository.CourseRepository;
import com.skillbridge.skill.service.SkillService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
    public List<CourseResponse> publicCatalog() {
        return courseRepository.findByPublishedTrueOrderByTitleAsc().stream().map(CourseResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<CourseResponse> adminCatalog() {
        return courseRepository.findAll().stream().map(CourseResponse::from).toList();
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
}
