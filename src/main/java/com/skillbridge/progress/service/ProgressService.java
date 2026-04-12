package com.skillbridge.progress.service;

import com.skillbridge.common.exception.BadRequestException;
import com.skillbridge.course.service.CourseService;
import com.skillbridge.progress.dto.ProgressResponse;
import com.skillbridge.progress.dto.ProgressUpdateRequest;
import com.skillbridge.progress.entity.CourseProgress;
import com.skillbridge.progress.entity.ProgressStatus;
import com.skillbridge.progress.repository.CourseProgressRepository;
import com.skillbridge.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class ProgressService {

    private final CourseProgressRepository courseProgressRepository;
    private final CourseService courseService;

    public ProgressService(CourseProgressRepository courseProgressRepository, CourseService courseService) {
        this.courseProgressRepository = courseProgressRepository;
        this.courseService = courseService;
    }

    @Transactional(readOnly = true)
    public List<ProgressResponse> list(User user) {
        return courseProgressRepository.findByUserIdOrderByLastUpdatedAtDesc(user.getId()).stream()
                .map(ProgressResponse::from)
                .toList();
    }

    public ProgressResponse update(Long courseId, ProgressUpdateRequest request, User user) {
        ProgressStatus status;
        try {
            status = ProgressStatus.valueOf(request.status().trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid progress status.");
        }

        CourseProgress progress = courseProgressRepository.findByUserIdAndCourseId(user.getId(), courseId)
                .orElseGet(CourseProgress::new);
        if (progress.getId() == null) {
            progress.setUser(user);
            progress.setCourse(courseService.getEntity(courseId));
        }

        progress.setStatus(status);
        progress.setProgressPercent(request.progressPercent());
        progress.setLastUpdatedAt(Instant.now());
        if (status == ProgressStatus.STARTED && progress.getStartedAt() == null) {
            progress.setStartedAt(Instant.now());
        }
        if (status == ProgressStatus.COMPLETED) {
            progress.setProgressPercent(100);
            if (progress.getStartedAt() == null) {
                progress.setStartedAt(Instant.now());
            }
            progress.setCompletedAt(Instant.now());
        } else {
            progress.setCompletedAt(null);
        }
        return ProgressResponse.from(courseProgressRepository.save(progress));
    }
}
