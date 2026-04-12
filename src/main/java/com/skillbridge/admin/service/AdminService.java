package com.skillbridge.admin.service;

import com.skillbridge.admin.dto.AdminDashboardResponse;
import com.skillbridge.course.repository.CourseRepository;
import com.skillbridge.progress.repository.CourseProgressRepository;
import com.skillbridge.projectidea.repository.ProjectIdeaRepository;
import com.skillbridge.savedcourse.repository.SavedCourseRepository;
import com.skillbridge.skill.repository.SkillRepository;
import com.skillbridge.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final SkillRepository skillRepository;
    private final ProjectIdeaRepository projectIdeaRepository;
    private final SavedCourseRepository savedCourseRepository;
    private final CourseProgressRepository courseProgressRepository;

    public AdminService(
            UserRepository userRepository,
            CourseRepository courseRepository,
            SkillRepository skillRepository,
            ProjectIdeaRepository projectIdeaRepository,
            SavedCourseRepository savedCourseRepository,
            CourseProgressRepository courseProgressRepository
    ) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.skillRepository = skillRepository;
        this.projectIdeaRepository = projectIdeaRepository;
        this.savedCourseRepository = savedCourseRepository;
        this.courseProgressRepository = courseProgressRepository;
    }

    public AdminDashboardResponse overview() {
        return new AdminDashboardResponse(
                userRepository.count(),
                courseRepository.count(),
                skillRepository.count(),
                projectIdeaRepository.count(),
                savedCourseRepository.count(),
                courseProgressRepository.count()
        );
    }
}
