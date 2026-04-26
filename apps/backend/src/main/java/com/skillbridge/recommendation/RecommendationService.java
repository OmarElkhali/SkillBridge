package com.skillbridge.recommendation;

import com.skillbridge.common.exception.ResourceNotFoundException;
import com.skillbridge.course.dto.CourseResponse;
import com.skillbridge.course.entity.Course;
import com.skillbridge.course.repository.CourseRepository;
import com.skillbridge.projectidea.dto.ProjectIdeaResponse;
import com.skillbridge.projectidea.entity.MatchSource;
import com.skillbridge.projectidea.entity.ProjectDetectedSkill;
import com.skillbridge.projectidea.entity.ProjectIdea;
import com.skillbridge.projectidea.entity.RecommendationResult;
import com.skillbridge.projectidea.entity.RecommendationSnapshot;
import com.skillbridge.projectidea.repository.ProjectIdeaRepository;
import com.skillbridge.projectidea.repository.RecommendationSnapshotRepository;
import com.skillbridge.recommendation.dto.DetectedSkillResponse;
import com.skillbridge.recommendation.dto.RecommendationResponse;
import com.skillbridge.recommendation.dto.RecommendedCourseResponse;
import com.skillbridge.skill.entity.Skill;
import com.skillbridge.skill.repository.SkillRepository;
import com.skillbridge.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Service
@Transactional
public class RecommendationService {

    private static final Pattern NON_WORD_PATTERN = Pattern.compile("[^a-z0-9\\s]");
    private static final String ALGORITHM_VERSION = "rule-based-v1";
    private static final int MAX_DETECTED_SKILLS = 25;
    private static final int MAX_SAVED_RECOMMENDATIONS = 20;

    private final ProjectIdeaRepository projectIdeaRepository;
    private final RecommendationSnapshotRepository recommendationSnapshotRepository;
    private final SkillRepository skillRepository;
    private final CourseRepository courseRepository;

    public RecommendationService(
            ProjectIdeaRepository projectIdeaRepository,
            RecommendationSnapshotRepository recommendationSnapshotRepository,
            SkillRepository skillRepository,
            CourseRepository courseRepository
    ) {
        this.projectIdeaRepository = projectIdeaRepository;
        this.recommendationSnapshotRepository = recommendationSnapshotRepository;
        this.skillRepository = skillRepository;
        this.courseRepository = courseRepository;
    }

    public RecommendationResponse generateForProject(Long projectId, User user) {
        ProjectIdea projectIdea = getUserProject(projectId, user);
        projectIdea.getDetectedSkills().clear();

        String normalizedProjectText = normalizeText(projectIdea.getTitle() + " " + projectIdea.getDescription());
        Set<String> normalizedTokens = extractTokens(projectIdea.getTitle() + " " + projectIdea.getDescription());
        List<Skill> skills = skillRepository.findAll();
        List<ProjectDetectedSkill> detectedSkills = detectSkills(projectIdea, normalizedProjectText, skills);
        projectIdea.getDetectedSkills().addAll(detectedSkills);

        RecommendationSnapshot snapshot = new RecommendationSnapshot();
        snapshot.setProjectIdea(projectIdea);
        snapshot.setGeneratedAt(Instant.now());
        snapshot.setKeywordSummary(String.join(", ", normalizedTokens));
        snapshot.setAlgorithmVersion(ALGORITHM_VERSION);

        List<Course> candidateCourses = findCandidateCourses(detectedSkills);
        List<RecommendationResult> results = rankCourses(snapshot, candidateCourses, normalizedTokens, detectedSkills);
        snapshot.setResults(results);
        snapshot.setTotalResults(results.size());
        projectIdea.getRecommendationSnapshots().add(snapshot);

        projectIdeaRepository.save(projectIdea);
        return mapSnapshot(snapshot);
    }

    @Transactional(readOnly = true)
    public RecommendationResponse latestForProject(Long projectId, User user) {
        getUserProject(projectId, user);
        RecommendationSnapshot snapshot = recommendationSnapshotRepository.findFirstByProjectIdeaIdOrderByGeneratedAtDesc(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("No recommendation snapshot found for this project."));
        return mapSnapshot(snapshot);
    }

    ProjectIdea getUserProject(Long projectId, User user) {
        ProjectIdea projectIdea = projectIdeaRepository.findDetailedById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project idea not found."));
        if (!projectIdea.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Project idea not found.");
        }
        return projectIdea;
    }

    Set<String> extractTokens(String text) {
        String normalized = normalizeText(text);
        Set<String> tokens = new LinkedHashSet<>();
        for (String token : normalized.split("\\s+")) {
            if (token.length() < 2 || RecommendationKeywords.STOP_WORDS.contains(token)) {
                continue;
            }
            tokens.add(token);
        }
        return tokens;
    }

    String normalizeText(String text) {
        String normalized = NON_WORD_PATTERN.matcher(text.toLowerCase(Locale.ROOT)).replaceAll(" ");
        return normalized.replaceAll("\\s+", " ").trim();
    }

    private List<ProjectDetectedSkill> detectSkills(ProjectIdea projectIdea, String normalizedProjectText, List<Skill> skills) {
        String boundedProjectText = " " + normalizedProjectText + " ";
        Map<Long, ProjectDetectedSkill> detectedBySkill = new LinkedHashMap<>();
        skills.stream()
                .sorted(Comparator.comparingInt((Skill skill) -> normalizeText(skill.getName()).length()).reversed())
                .forEach(skill -> {
                    Set<String> skillTokens = extractTokens(skill.getName());
                    if (skillTokens.isEmpty()) {
                        return;
                    }
                    String normalizedSkillName = String.join(" ", skillTokens);
                    if (normalizedSkillName.isBlank()) {
                        return;
                    }
                    if (!boundedProjectText.contains(" " + normalizedSkillName + " ")) {
                        return;
                    }
                    ProjectDetectedSkill detected = new ProjectDetectedSkill();
                    detected.setProjectIdea(projectIdea);
                    detected.setSkill(skill);
                    detected.setMatchedKeyword(normalizedSkillName);
                    detected.setMatchSource(MatchSource.SKILL_NAME);
                    detected.setConfidenceScore(0.95d);
                    detectedBySkill.put(skill.getId(), detected);
                });

        List<ProjectDetectedSkill> detected = new ArrayList<>(detectedBySkill.values());
        if (detected.size() > MAX_DETECTED_SKILLS) {
            return new ArrayList<>(detected.subList(0, MAX_DETECTED_SKILLS));
        }
        return detected;
    }

    private List<Course> findCandidateCourses(List<ProjectDetectedSkill> detectedSkills) {
        if (detectedSkills.isEmpty()) {
            return List.of();
        }

        List<Long> detectedSkillIds = detectedSkills.stream()
                .map(item -> item.getSkill().getId())
                .distinct()
                .toList();

        Map<Long, Course> uniqueCourses = new LinkedHashMap<>();
        for (Course course : courseRepository.findDistinctByPublishedTrueAndSkillsIdInOrderByTitleAsc(detectedSkillIds)) {
            uniqueCourses.putIfAbsent(course.getId(), course);
        }
        return new ArrayList<>(uniqueCourses.values());
    }

    private List<RecommendationResult> rankCourses(
            RecommendationSnapshot snapshot,
            List<Course> courses,
            Set<String> tokens,
            List<ProjectDetectedSkill> detectedSkills
    ) {
        if (courses.isEmpty()) {
            return List.of();
        }

        Set<Long> detectedSkillIds = detectedSkills.stream().map(item -> item.getSkill().getId()).collect(java.util.stream.Collectors.toSet());
        Set<String> detectedSkillNames = detectedSkills.stream()
                .map(item -> item.getSkill().getName().toLowerCase(Locale.ROOT))
                .collect(java.util.stream.Collectors.toSet());

        List<RecommendationResult> ranked = new ArrayList<>();
        for (Course course : courses) {
            int titleScore = scoreTitle(tokens, course);
            int skillScore = (int) course.getSkills().stream().filter(skill -> detectedSkillIds.contains(skill.getId())).count() * 3;
            int categoryScore = scoreCategory(detectedSkillNames, course);
            int bonusScore = course.getPopularityScore() > 0 && !course.getDescription().isBlank() ? 1 : 0;
            int total = titleScore + skillScore + categoryScore + bonusScore;
            if (total == 0) {
                continue;
            }

            RecommendationResult result = new RecommendationResult();
            result.setSnapshot(snapshot);
            result.setCourse(course);
            result.setTitleMatchScore(titleScore);
            result.setSkillMatchScore(skillScore);
            result.setCategoryMatchScore(categoryScore);
            result.setBonusScore(bonusScore);
            result.setScore(total);
            result.setExplanation(buildExplanation(titleScore, skillScore, categoryScore, bonusScore));
            ranked.add(result);
        }

        ranked.sort(Comparator.comparingInt(RecommendationResult::getScore).reversed()
                .thenComparing(result -> result.getCourse().getTitle()));

        if (ranked.size() > MAX_SAVED_RECOMMENDATIONS) {
            ranked = new ArrayList<>(ranked.subList(0, MAX_SAVED_RECOMMENDATIONS));
        }

        for (int index = 0; index < ranked.size(); index++) {
            ranked.get(index).setRankPosition(index + 1);
        }
        return ranked;
    }

    private int scoreTitle(Set<String> tokens, Course course) {
        String normalizedTitle = course.getTitle().toLowerCase(Locale.ROOT);
        int titleMatches = (int) tokens.stream().filter(normalizedTitle::contains).count();
        return titleMatches > 0 ? 4 : 0;
    }

    private int scoreCategory(Set<String> detectedSkillNames, Course course) {
        String categoryText = (course.getCategory().getName() + " " + course.getCategory().getDescription()).toLowerCase(Locale.ROOT);
        return detectedSkillNames.stream().anyMatch(categoryText::contains) ? 2 : 0;
    }

    private String buildExplanation(int titleScore, int skillScore, int categoryScore, int bonusScore) {
        List<String> reasons = new ArrayList<>();
        if (titleScore > 0) {
            reasons.add("course title aligns with the project keywords");
        }
        if (skillScore > 0) {
            reasons.add("course skills overlap with detected project skills");
        }
        if (categoryScore > 0) {
            reasons.add("course category is relevant to the project context");
        }
        if (bonusScore > 0) {
            reasons.add("course has a completeness/popularity bonus");
        }
        return "Recommended because " + String.join(", ", reasons) + ".";
    }

    private RecommendationResponse mapSnapshot(RecommendationSnapshot snapshot) {
        Map<Long, RecommendationResult> uniqueResults = new LinkedHashMap<>();
        snapshot.getResults().stream()
                .sorted(Comparator.comparingInt(RecommendationResult::getRankPosition))
                .forEach(result -> uniqueResults.putIfAbsent(result.getId(), result));

        return new RecommendationResponse(
                snapshot.getId(),
                snapshot.getGeneratedAt(),
                snapshot.getAlgorithmVersion(),
                snapshot.getKeywordSummary(),
                ProjectIdeaResponse.from(snapshot.getProjectIdea()),
                snapshot.getProjectIdea().getDetectedSkills().stream()
                        .map(item -> new DetectedSkillResponse(
                                item.getSkill().getId(),
                                item.getSkill().getName(),
                                item.getMatchedKeyword(),
                                item.getMatchSource().name(),
                                item.getConfidenceScore()
                        ))
                        .toList(),
                uniqueResults.values().stream()
                        .map(result -> new RecommendedCourseResponse(
                                result.getRankPosition(),
                                result.getScore(),
                                result.getTitleMatchScore(),
                                result.getSkillMatchScore(),
                                result.getCategoryMatchScore(),
                                result.getBonusScore(),
                                result.getExplanation(),
                                CourseResponse.from(result.getCourse())
                        ))
                        .toList()
        );
    }
}
