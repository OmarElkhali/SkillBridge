package com.skillbridge.savedcourse.service;

import com.skillbridge.common.exception.BadRequestException;
import com.skillbridge.course.service.CourseService;
import com.skillbridge.savedcourse.dto.SavedCourseResponse;
import com.skillbridge.savedcourse.entity.SavedCourse;
import com.skillbridge.savedcourse.repository.SavedCourseRepository;
import com.skillbridge.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class SavedCourseService {

    private final SavedCourseRepository savedCourseRepository;
    private final CourseService courseService;

    public SavedCourseService(SavedCourseRepository savedCourseRepository, CourseService courseService) {
        this.savedCourseRepository = savedCourseRepository;
        this.courseService = courseService;
    }

    @Transactional(readOnly = true)
    public List<SavedCourseResponse> list(User user) {
        return savedCourseRepository.findByUserIdOrderBySavedAtDesc(user.getId()).stream().map(SavedCourseResponse::from).toList();
    }

    public SavedCourseResponse save(Long courseId, User user) {
        if (savedCourseRepository.findByUserIdAndCourseId(user.getId(), courseId).isPresent()) {
            throw new BadRequestException("Course is already saved.");
        }
        SavedCourse savedCourse = new SavedCourse();
        savedCourse.setUser(user);
        savedCourse.setCourse(courseService.getEntity(courseId));
        savedCourse.setSavedAt(Instant.now());
        return SavedCourseResponse.from(savedCourseRepository.save(savedCourse));
    }

    public void remove(Long courseId, User user) {
        SavedCourse savedCourse = savedCourseRepository.findByUserIdAndCourseId(user.getId(), courseId)
                .orElseThrow(() -> new BadRequestException("Saved course not found."));
        savedCourseRepository.delete(savedCourse);
    }
}
