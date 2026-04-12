package com.skillbridge.user;

import com.skillbridge.config.AppProperties;
import com.skillbridge.course.entity.Category;
import com.skillbridge.course.entity.Course;
import com.skillbridge.course.entity.CourseLevel;
import com.skillbridge.course.entity.Provider;
import com.skillbridge.course.repository.CategoryRepository;
import com.skillbridge.course.repository.CourseRepository;
import com.skillbridge.course.repository.ProviderRepository;
import com.skillbridge.skill.entity.Skill;
import com.skillbridge.skill.repository.SkillRepository;
import com.skillbridge.user.entity.Role;
import com.skillbridge.user.entity.RoleName;
import com.skillbridge.user.entity.User;
import com.skillbridge.user.repository.RoleRepository;
import com.skillbridge.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;
    private final CategoryRepository categoryRepository;
    private final ProviderRepository providerRepository;
    private final SkillRepository skillRepository;
    private final CourseRepository courseRepository;

    public DataSeeder(
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AppProperties appProperties,
            CategoryRepository categoryRepository,
            ProviderRepository providerRepository,
            SkillRepository skillRepository,
            CourseRepository courseRepository
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.appProperties = appProperties;
        this.categoryRepository = categoryRepository;
        this.providerRepository = providerRepository;
        this.skillRepository = skillRepository;
        this.courseRepository = courseRepository;
    }

    @Override
    public void run(String... args) {
        Role userRole = roleRepository.findByName(RoleName.USER).orElseGet(() -> roleRepository.save(new Role(RoleName.USER)));
        Role adminRole = roleRepository.findByName(RoleName.ADMIN).orElseGet(() -> roleRepository.save(new Role(RoleName.ADMIN)));

        if (!userRepository.existsByEmailIgnoreCase(appProperties.bootstrap().adminEmail())) {
            User admin = new User();
            admin.setFirstName(appProperties.bootstrap().adminFirstName());
            admin.setLastName(appProperties.bootstrap().adminLastName());
            admin.setEmail(appProperties.bootstrap().adminEmail().toLowerCase());
            admin.setPasswordHash(passwordEncoder.encode(appProperties.bootstrap().adminPassword()));
            admin.setRole(adminRole);
            admin.setActive(true);
            userRepository.save(admin);
        }

        if (skillRepository.count() > 0 || courseRepository.count() > 0) {
            return;
        }

        Category backendCategory = categoryRepository.save(new Category("Backend Development", "Spring, APIs, databases, and security."));
        Category securityCategory = categoryRepository.save(new Category("Application Security", "Security engineering and authentication."));
        Provider udemy = providerRepository.save(new Provider("Udemy", "https://www.udemy.com", "Popular online course marketplace."));
        Provider coursera = providerRepository.save(new Provider("Coursera", "https://www.coursera.org", "University-backed online courses."));

        Skill springBoot = skillRepository.save(new Skill("Spring Boot", "Build backend services with Spring Boot."));
        Skill restApi = skillRepository.save(new Skill("REST API", "Design and build RESTful APIs."));
        Skill database = skillRepository.save(new Skill("Database", "Relational database design and SQL."));
        Skill authentication = skillRepository.save(new Skill("Authentication", "Secure identity and access management."));
        Skill security = skillRepository.save(new Skill("Security", "Web application security fundamentals."));

        courseRepository.saveAll(List.of(
                createCourse(
                        "Spring Boot REST API Masterclass",
                        "Build secure REST APIs with Spring Boot, JPA, and PostgreSQL.",
                        CourseLevel.INTERMEDIATE,
                        "English",
                        "https://example.com/courses/spring-boot-rest-api",
                        backendCategory,
                        udemy,
                        Set.of(springBoot, restApi, database)
                ),
                createCourse(
                        "Secure Spring Applications",
                        "Learn authentication, authorization, and Spring Security best practices.",
                        CourseLevel.INTERMEDIATE,
                        "English",
                        "https://example.com/courses/secure-spring-applications",
                        securityCategory,
                        coursera,
                        Set.of(springBoot, security, authentication)
                ),
                createCourse(
                        "PostgreSQL for Java Developers",
                        "Master SQL, schema design, and persistence patterns for Java apps.",
                        CourseLevel.BEGINNER,
                        "English",
                        "https://example.com/courses/postgresql-java-developers",
                        backendCategory,
                        udemy,
                        Set.of(database, restApi)
                )
        ));
    }

    private Course createCourse(
            String title,
            String description,
            CourseLevel level,
            String language,
            String sourceUrl,
            Category category,
            Provider provider,
            Set<Skill> skills
    ) {
        Course course = new Course();
        course.setTitle(title);
        course.setDescription(description);
        course.setLevel(level);
        course.setLanguage(language);
        course.setSourceUrl(sourceUrl);
        course.setCategory(category);
        course.setProvider(provider);
        course.setPublished(true);
        course.setPopularityScore(3);
        course.setSkills(new LinkedHashSet<>(skills));
        return course;
    }
}
