package com.skillbridge.recommendation;

import com.skillbridge.bigdata.dto.BigDataTraceResponse;
import com.skillbridge.bigdata.service.BigDataEventService;
import com.skillbridge.bigdata.service.BigDataStatusService;
import com.skillbridge.common.exception.BadRequestException;
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
import com.skillbridge.recommendation.dto.MatchedCategoryResponse;
import com.skillbridge.recommendation.dto.RecommendationResponse;
import com.skillbridge.recommendation.dto.RecommendedCourseResponse;
import com.skillbridge.skill.entity.Skill;
import com.skillbridge.skill.repository.SkillRepository;
import com.skillbridge.user.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;

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
    private static final String ALGORITHM_VERSION = "bigdata-ready-rule-based-v2";
    private static final int MAX_DETECTED_SKILLS = 25;
    private static final int DEFAULT_RECOMMENDATION_LIMIT = 10;
    private static final int MAX_RECOMMENDATION_LIMIT = 100;
    private static final Map<String, List<String>> CATEGORY_RULES = Map.ofEntries(
            Map.entry("Big Data", List.of("hadoop", "hdfs", "hive", "hbase", "sqoop", "flume", "mapreduce", "big data")),
            Map.entry("Data Engineering", List.of("data engineer", "data pipeline", "etl", "airflow", "spark", "warehouse", "data lake")),
            Map.entry("Application Security", List.of("security", "secure", "jwt", "oauth", "authentication", "authorization", "cyber")),
            Map.entry("Backend Development", List.of("spring", "spring boot", "java", "rest api", "api", "backend", "microservice")),
            Map.entry("Databases", List.of("postgresql", "postgres", "mysql", "sql", "database", "mongodb", "nosql")),
            Map.entry("Cloud Computing", List.of("aws", "azure", "cloud", "kubernetes", "serverless", "terraform")),
            Map.entry("DevOps", List.of("docker", "ci/cd", "devops", "linux", "jenkins", "ansible", "deployment")),
            Map.entry("Web Development", List.of("react", "angular", "vue", "javascript", "typescript", "html", "css", "frontend")),
            Map.entry("Machine Learning", List.of("machine learning", "deep learning", "neural", "ai", "tensorflow", "pytorch", "data science")),
            Map.entry("Product and UX", List.of("ux", "ui", "user experience", "product", "figma")),
            Map.entry("Business and Management", List.of("business", "management", "marketing", "finance", "leadership"))
    );
    private static final Map<String, List<String>> SKILL_ALIAS_RULES = Map.ofEntries(
            Map.entry("ai", List.of("ai", "artificial intelligence", "generative ai", "machine learning", "deep learning", "data science", "openai", "chatgpt", "gpt", "llm", "large language model", "large language models", "prompt engineering")),
            Map.entry("assistant", List.of("ai assistant", "ai assistants", "assistant", "chatbot", "chat bot", "conversational ai", "openai", "chatgpt", "gpt", "llm", "large language model", "large language models", "prompt engineering")),
            Map.entry("gpt", List.of("gpt", "chatgpt", "openai", "generative ai", "llm", "large language model", "large language models", "prompt engineering")),
            Map.entry("llm", List.of("llm", "large language model", "large language models", "generative ai", "openai", "chatgpt", "gpt", "prompt engineering")),
            Map.entry("chatbot", List.of("chatbot", "chat bot", "conversational ai", "ai assistant", "openai", "chatgpt", "gpt", "llm", "large language model", "large language models"))
    );

    private final ProjectIdeaRepository projectIdeaRepository;
    private final RecommendationSnapshotRepository recommendationSnapshotRepository;
    private final SkillRepository skillRepository;
    private final CourseRepository courseRepository;
    private final BigDataEventService bigDataEventService;
    private final BigDataStatusService bigDataStatusService;

    public RecommendationService(
            ProjectIdeaRepository projectIdeaRepository,
            RecommendationSnapshotRepository recommendationSnapshotRepository,
            SkillRepository skillRepository,
            CourseRepository courseRepository,
            BigDataEventService bigDataEventService,
            BigDataStatusService bigDataStatusService
    ) {
        this.projectIdeaRepository = projectIdeaRepository;
        this.recommendationSnapshotRepository = recommendationSnapshotRepository;
        this.skillRepository = skillRepository;
        this.courseRepository = courseRepository;
        this.bigDataEventService = bigDataEventService;
        this.bigDataStatusService = bigDataStatusService;
    }

    public RecommendationResponse generateForProject(Long projectId, User user) {
        return generateForProject(projectId, user, DEFAULT_RECOMMENDATION_LIMIT);
    }

    public RecommendationResponse generateForProject(Long projectId, User user, int requestedLimit) {
        int limit = validateLimit(requestedLimit);
        ProjectIdea projectIdea = getUserProject(projectId, user);
        projectIdea.getDetectedSkills().clear();

        String projectText = projectIdea.getTitle() + " " + projectIdea.getDescription();
        String normalizedProjectText = normalizeText(projectText);
        Set<String> normalizedTokens = extractTokens(projectText);
        Map<String, List<String>> matchedCategoryKeywords = detectCategories(projectText);
        List<Skill> skills = skillRepository.findAll();
        List<ProjectDetectedSkill> detectedSkills = detectSkills(projectIdea, normalizedProjectText, skills);
        projectIdea.getDetectedSkills().addAll(detectedSkills);

        RecommendationSnapshot snapshot = new RecommendationSnapshot();
        snapshot.setProjectIdea(projectIdea);
        snapshot.setGeneratedAt(Instant.now());
        snapshot.setKeywordSummary(String.join(", ", normalizedTokens));
        snapshot.setAlgorithmVersion(ALGORITHM_VERSION);

        List<Course> candidateCourses = findCandidateCourses(detectedSkills, normalizedTokens, limit);
        List<RecommendationResult> results = rankCourses(snapshot, candidateCourses, normalizedTokens, detectedSkills, matchedCategoryKeywords, limit);
        snapshot.setResults(results);
        snapshot.setTotalResults(results.size());
        projectIdea.getRecommendationSnapshots().add(snapshot);

        projectIdeaRepository.saveAndFlush(projectIdea);
        recommendationSnapshotRepository.saveAndFlush(snapshot);
        boolean eventRecorded = recordRecommendationEvent(projectIdea, user, limit, snapshot);
        RecommendationResponse response = mapSnapshot(snapshot, bigDataTrace(eventRecorded));
        bigDataStatusService.writeRecommendationResult(recommendationOutput(response));
        return response;
    }

    @Transactional(readOnly = true)
    public RecommendationResponse latestForProject(Long projectId, User user) {
        getUserProject(projectId, user);
        RecommendationSnapshot snapshot = recommendationSnapshotRepository.findFirstByProjectIdeaIdOrderByGeneratedAtDesc(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("No recommendation snapshot found for this project."));
        return mapSnapshot(snapshot, bigDataTrace(false));
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

    List<ProjectDetectedSkill> detectSkills(ProjectIdea projectIdea, String normalizedProjectText, List<Skill> skills) {
        String boundedProjectText = " " + normalizedProjectText + " ";
        Set<String> projectTokens = extractTokens(normalizedProjectText);
        Map<Long, ProjectDetectedSkill> detectedBySkill = new LinkedHashMap<>();
        skills.stream()
                .sorted(Comparator.comparingInt((Skill skill) -> normalizeText(skill.getName()).length()).reversed())
                .forEach(skill -> {
                    SkillDetectionMatch match = detectSkillMatch(boundedProjectText, projectTokens, skill);
                    if (match == null) {
                        return;
                    }
                    ProjectDetectedSkill detected = new ProjectDetectedSkill();
                    detected.setProjectIdea(projectIdea);
                    detected.setSkill(skill);
                    detected.setMatchedKeyword(match.matchedKeyword());
                    detected.setMatchSource(match.matchSource());
                    detected.setConfidenceScore(match.confidenceScore());
                    detectedBySkill.put(skill.getId(), detected);
                });

        List<ProjectDetectedSkill> detected = new ArrayList<>(detectedBySkill.values());
        if (detected.size() > MAX_DETECTED_SKILLS) {
            return new ArrayList<>(detected.subList(0, MAX_DETECTED_SKILLS));
        }
        return detected;
    }

    private SkillDetectionMatch detectSkillMatch(String boundedProjectText, Set<String> projectTokens, Skill skill) {
        String normalizedSkillName = normalizeText(skill.getName());
        Set<String> skillTokens = extractTokens(skill.getName());
        if (normalizedSkillName.isBlank() || skillTokens.isEmpty()) {
            return null;
        }

        String boundedSkillName = " " + normalizedSkillName + " ";
        if (normalizedSkillName.length() > 3 && boundedProjectText.contains(" " + normalizedSkillName + " ")) {
            return new SkillDetectionMatch(normalizedSkillName, MatchSource.SKILL_NAME, 0.95d);
        }

        if (skillTokens.size() <= 4 && projectTokens.containsAll(skillTokens)) {
            return new SkillDetectionMatch(String.join(" ", skillTokens), MatchSource.SKILL_NAME, 0.85d);
        }

        for (Map.Entry<String, List<String>> entry : SKILL_ALIAS_RULES.entrySet()) {
            String alias = normalizeText(entry.getKey());
            if (!projectTextContainsAlias(boundedProjectText, projectTokens, alias)) {
                continue;
            }
            for (String target : entry.getValue()) {
                if (skillNameMatchesAliasTarget(boundedSkillName, skillTokens, target)) {
                    return new SkillDetectionMatch(alias, MatchSource.CATEGORY_HINT, 0.72d);
                }
            }
        }

        return null;
    }

    private boolean projectTextContainsAlias(String boundedProjectText, Set<String> projectTokens, String alias) {
        if (alias.length() <= 3) {
            return projectTokens.contains(alias);
        }
        return boundedProjectText.contains(" " + alias + " ");
    }

    private boolean skillNameMatchesAliasTarget(String boundedSkillName, Set<String> skillTokens, String target) {
        String normalizedTarget = normalizeText(target);
        if (normalizedTarget.length() <= 3) {
            return skillTokens.contains(normalizedTarget);
        }
        return boundedSkillName.contains(" " + normalizedTarget + " ");
    }

    private int validateLimit(int requestedLimit) {
        if (requestedLimit < 1 || requestedLimit > MAX_RECOMMENDATION_LIMIT) {
            throw new BadRequestException("Recommendation limit must be between 1 and 100.");
        }
        return requestedLimit;
    }

    private List<Course> findCandidateCourses(List<ProjectDetectedSkill> detectedSkills, Set<String> tokens, int limit) {
        if (detectedSkills.isEmpty()) {
            Map<Long, Course> fallback = new LinkedHashMap<>();
            findKeywordCandidateCourses(tokens, limit).forEach(course -> fallback.putIfAbsent(course.getId(), course));
            if (fallback.size() < limit) {
                findPopularFallbackCourses(limit).forEach(course -> fallback.putIfAbsent(course.getId(), course));
            }
            return new ArrayList<>(fallback.values());
        }

        List<Long> detectedSkillIds = detectedSkills.stream()
                .map(item -> item.getSkill().getId())
                .distinct()
                .toList();

        Map<Long, Course> uniqueCourses = new LinkedHashMap<>();
        for (Course course : courseRepository.findDistinctByPublishedTrueAndSkillsIdInOrderByTitleAsc(detectedSkillIds)) {
            uniqueCourses.putIfAbsent(course.getId(), course);
        }
        if (uniqueCourses.size() < Math.max(30, limit * 2)) {
            findKeywordCandidateCourses(tokens, limit).forEach(course -> uniqueCourses.putIfAbsent(course.getId(), course));
        }
        if (uniqueCourses.size() < limit) {
            findPopularFallbackCourses(limit).forEach(course -> uniqueCourses.putIfAbsent(course.getId(), course));
        }
        return new ArrayList<>(uniqueCourses.values());
    }

    private List<Course> findKeywordCandidateCourses(Set<String> tokens, int limit) {
        Map<Long, Course> uniqueCourses = new LinkedHashMap<>();
        tokens.stream()
                .filter(token -> token.length() >= 3)
                .limit(8)
                .forEach(token -> {
                    List<Long> ids = courseRepository.searchCourseIds(
                            true,
                            token,
                            null,
                            null,
                            null,
                            null,
                            "popularity",
                            PageRequest.of(0, Math.max(20, limit))
                    ).getContent();
                    if (!ids.isEmpty()) {
                        courseRepository.findDistinctByIdIn(ids).forEach(course -> uniqueCourses.putIfAbsent(course.getId(), course));
                    }
                });
        return new ArrayList<>(uniqueCourses.values());
    }

    private List<Course> findPopularFallbackCourses(int limit) {
        List<Long> ids = courseRepository.searchCourseIds(
                true,
                null,
                null,
                null,
                null,
                null,
                "popularity",
                PageRequest.of(0, Math.max(20, limit))
        ).getContent();
        return ids.isEmpty() ? List.of() : courseRepository.findDistinctByIdIn(ids);
    }

    private List<RecommendationResult> rankCourses(
            RecommendationSnapshot snapshot,
            List<Course> courses,
            Set<String> tokens,
            List<ProjectDetectedSkill> detectedSkills,
            Map<String, List<String>> matchedCategoryKeywords,
            int limit
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
            CourseScoreDetails details = scoreCourse(tokens, detectedSkillIds, detectedSkillNames, matchedCategoryKeywords, course);
            if (details.totalScore() > 0) {
                ranked.add(toRecommendationResult(snapshot, course, details));
            }
        }

        if (ranked.size() < limit) {
            Set<Long> rankedCourseIds = ranked.stream()
                    .map(result -> result.getCourse().getId())
                    .collect(java.util.stream.Collectors.toSet());
            for (Course course : findPopularFallbackCourses(limit * 2)) {
                if (rankedCourseIds.contains(course.getId())) {
                    continue;
                }
                CourseScoreDetails details = scoreCourse(tokens, detectedSkillIds, detectedSkillNames, matchedCategoryKeywords, course);
                if (details.totalScore() > 0) {
                    ranked.add(toRecommendationResult(snapshot, course, details));
                    rankedCourseIds.add(course.getId());
                }
                if (ranked.size() >= limit) {
                    break;
                }
            }
        }

        ranked.sort(Comparator.comparingInt(RecommendationResult::getScore).reversed()
                .thenComparing(result -> result.getCourse().getTitle()));

        if (ranked.size() > limit) {
            ranked = new ArrayList<>(ranked.subList(0, limit));
        }

        for (int index = 0; index < ranked.size(); index++) {
            ranked.get(index).setRankPosition(index + 1);
        }
        return ranked;
    }

    private RecommendationResult toRecommendationResult(RecommendationSnapshot snapshot, Course course, CourseScoreDetails details) {
        RecommendationResult result = new RecommendationResult();
        result.setSnapshot(snapshot);
        result.setCourse(course);
        result.setTitleMatchScore(details.titleMatchScore());
        result.setSkillMatchScore(details.skillMatchScore());
        result.setCategoryMatchScore(details.categoryMatchScore());
        result.setBonusScore(details.bonusScore());
        result.setScore(details.totalScore());
        result.setExplanation(buildExplanation(details));
        return result;
    }

    private CourseScoreDetails scoreCourse(
            Set<String> tokens,
            Set<Long> detectedSkillIds,
            Set<String> detectedSkillNames,
            Map<String, List<String>> matchedCategoryKeywords,
            Course course
    ) {
        List<String> titleKeywords = matchedTitleKeywords(tokens, course);
        List<String> matchedSkills = course.getSkills().stream()
                .filter(skill -> detectedSkillIds.contains(skill.getId()))
                .map(Skill::getName)
                .sorted()
                .toList();
        List<String> descriptionSkillHits = detectedSkillNames.stream()
                .filter(skill -> !skill.isBlank() && normalizeText(course.getDescription()).contains(skill))
                .sorted()
                .toList();
        List<String> matchedCategories = matchedCourseCategories(matchedCategoryKeywords, course);

        int titleScore = Math.min(30, titleKeywords.size() * 6 + matchedSkills.stream()
                .filter(skill -> normalizeText(course.getTitle()).contains(normalizeText(skill)))
                .mapToInt(ignored -> 8)
                .sum());
        int skillScore = Math.min(40, matchedSkills.size() * 10 + descriptionSkillHits.size() * 4);
        int categoryScore = matchedCategories.isEmpty() ? 0 : 20;
        if (categoryScore == 0 && matchedCategoryKeywords.values().stream()
                .flatMap(List::stream)
                .anyMatch(keyword -> normalizeText(course.getTitle() + " " + course.getDescription()).contains(normalizeText(keyword)))) {
            categoryScore = 10;
        }
        int bonusScore = bonusScore(course);
        int totalScore = Math.min(100, titleScore + skillScore + categoryScore + bonusScore);
        return new CourseScoreDetails(totalScore, titleScore, skillScore, categoryScore, bonusScore, titleKeywords, matchedSkills, matchedCategories);
    }

    private List<String> matchedTitleKeywords(Set<String> tokens, Course course) {
        String normalizedTitle = course.getTitle().toLowerCase(Locale.ROOT);
        return tokens.stream()
                .filter(token -> token.length() >= 2)
                .filter(normalizedTitle::contains)
                .limit(8)
                .toList();
    }

    private List<String> matchedCourseCategories(Map<String, List<String>> matchedCategoryKeywords, Course course) {
        String categoryName = course.getCategory().getName();
        if (matchedCategoryKeywords.containsKey(categoryName)) {
            return List.of(categoryName);
        }
        return List.of();
    }

    private int bonusScore(Course course) {
        int popularityBonus = Math.min(8, Math.max(0, course.getPopularityScore()) / 10);
        Map<String, Object> stats = bigDataStatusService.courseStatsForCourse(course.getId());
        int activityBonus = 0;
        if (!stats.isEmpty()) {
            activityBonus = 2;
        }
        return Math.min(10, popularityBonus + activityBonus);
    }

    private String buildExplanation(CourseScoreDetails details) {
        List<String> reasons = new ArrayList<>();
        if (details.titleMatchScore() > 0) {
            reasons.add("title keywords: " + String.join(", ", details.matchedTitleKeywords()));
        }
        if (details.skillMatchScore() > 0) {
            reasons.add("matched skills: " + String.join(", ", details.matchedSkills()));
        }
        if (details.categoryMatchScore() > 0) {
            reasons.add("matched category: " + String.join(", ", details.matchedCategories()));
        }
        if (details.bonusScore() > 0) {
            reasons.add("Big Data/catalog popularity bonus: " + details.bonusScore());
        }
        return "Recommended because " + String.join(", ", reasons) + ".";
    }

    private Map<String, List<String>> detectCategories(String projectText) {
        String normalized = " " + normalizeText(projectText) + " ";
        Set<String> projectTokens = extractTokens(projectText);
        Map<String, List<String>> result = new LinkedHashMap<>();
        CATEGORY_RULES.forEach((category, keywords) -> {
            List<String> matched = keywords.stream()
                    .filter(keyword -> {
                        String normalizedKeyword = normalizeText(keyword);
                        if (normalizedKeyword.length() <= 3) {
                            return projectTokens.contains(normalizedKeyword);
                        }
                        return normalized.contains(" " + normalizedKeyword + " ") || normalized.contains(normalizedKeyword);
                    })
                    .toList();
            if (!matched.isEmpty()) {
                result.put(category, matched);
            }
        });
        return result;
    }

    private RecommendationResponse mapSnapshot(RecommendationSnapshot snapshot, BigDataTraceResponse bigDataTrace) {
        Map<Long, RecommendationResult> uniqueResults = new LinkedHashMap<>();
        snapshot.getResults().stream()
                .sorted(Comparator.comparingInt(RecommendationResult::getRankPosition))
                .forEach(result -> uniqueResults.putIfAbsent(result.getCourse().getId(), result));

        Set<String> tokens = extractTokens(snapshot.getProjectIdea().getTitle() + " " + snapshot.getProjectIdea().getDescription());
        Set<Long> detectedSkillIds = snapshot.getProjectIdea().getDetectedSkills().stream()
                .map(item -> item.getSkill().getId())
                .collect(java.util.stream.Collectors.toSet());
        Set<String> detectedSkillNames = snapshot.getProjectIdea().getDetectedSkills().stream()
                .map(item -> item.getSkill().getName().toLowerCase(Locale.ROOT))
                .collect(java.util.stream.Collectors.toSet());
        Map<String, List<String>> matchedCategoryKeywords = detectCategories(snapshot.getProjectIdea().getTitle() + " " + snapshot.getProjectIdea().getDescription());

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
                mapMatchedCategories(uniqueResults.values()),
                uniqueResults.values().stream()
                        .map(result -> mapRecommendedCourse(result, tokens, detectedSkillIds, detectedSkillNames, matchedCategoryKeywords))
                        .toList(),
                bigDataTrace
        );
    }

    private RecommendedCourseResponse mapRecommendedCourse(
            RecommendationResult result,
            Set<String> tokens,
            Set<Long> detectedSkillIds,
            Set<String> detectedSkillNames,
            Map<String, List<String>> matchedCategoryKeywords
    ) {
        Course course = result.getCourse();
        CourseScoreDetails details = scoreCourse(tokens, detectedSkillIds, detectedSkillNames, matchedCategoryKeywords, course);
        return new RecommendedCourseResponse(
                result.getRankPosition(),
                result.getRankPosition(),
                result.getScore(),
                result.getTitleMatchScore(),
                result.getSkillMatchScore(),
                result.getCategoryMatchScore(),
                result.getBonusScore(),
                details.matchedTitleKeywords(),
                details.matchedSkills(),
                details.matchedCategories(),
                course.getPopularityScore(),
                course.getSourceUrl(),
                result.getExplanation(),
                CourseResponse.from(course)
        );
    }

    private boolean recordRecommendationEvent(ProjectIdea projectIdea, User user, int limit, RecommendationSnapshot snapshot) {
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("userId", user.getId());
        event.put("projectId", projectIdea.getId());
        event.put("projectTitle", projectIdea.getTitle());
        event.put("projectDescription", projectIdea.getDescription());
        event.put("requestedLimit", limit);
        event.put("detectedSkills", projectIdea.getDetectedSkills().stream().map(item -> item.getSkill().getName()).toList());
        event.put("matchedCategories", mapMatchedCategories(snapshot.getResults()).stream().map(MatchedCategoryResponse::name).toList());
        event.put("topRecommendedCourseIds", snapshot.getResults().stream().map(result -> result.getCourse().getId()).toList());
        event.put("scores", snapshot.getResults().stream().map(RecommendationResult::getScore).toList());
        return bigDataEventService.appendEvent("PROJECT_RECOMMENDATION", event);
    }

    private Map<String, Object> recommendationOutput(RecommendationResponse response) {
        Map<String, Object> output = new LinkedHashMap<>();
        output.put("source", "web-app");
        output.put("algorithmVersion", response.algorithmVersion());
        output.put("snapshotId", response.snapshotId());
        output.put("generatedAt", response.generatedAt() == null ? null : response.generatedAt().toString());
        output.put("project", Map.of(
                "id", response.project().id(),
                "title", response.project().title(),
                "description", response.project().description()
        ));
        output.put("keywordSummary", response.keywordSummary());
        output.put("detectedSkills", response.detectedSkills());
        output.put("matchedCategories", response.matchedCategories());
        output.put("recommendations", response.recommendations().stream()
                .map(item -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("rankPosition", item.rankPosition());
                    row.put("courseId", item.course().id());
                    row.put("title", item.course().title());
                    row.put("provider", item.course().provider().name());
                    row.put("category", item.course().category().name());
                    row.put("level", item.course().level());
                    row.put("sourceUrl", item.sourceUrl());
                    row.put("score", item.score());
                    row.put("scoreBreakdown", Map.of(
                            "titleMatchScore", item.titleMatchScore(),
                            "skillMatchScore", item.skillMatchScore(),
                            "categoryMatchScore", item.categoryMatchScore(),
                            "bonusScore", item.bonusScore()
                    ));
                    row.put("matchedTitleKeywords", item.matchedTitleKeywords());
                    row.put("matchedSkills", item.matchedSkills());
                    row.put("matchedCategories", item.matchedCategories());
                    row.put("popularityScore", item.popularityScore());
                    row.put("explanation", item.explanation());
                    return row;
                })
                .toList());
        output.put("bigDataTrace", response.bigDataTrace());
        output.put("pipelineTrace", bigDataStatusService.pipelineTrace());
        return output;
    }

    private BigDataTraceResponse bigDataTrace(boolean eventRecorded) {
        return new BigDataTraceResponse(
                eventRecorded,
                bigDataEventService.eventLogPathString(),
                BigDataEventService.FLUME_HDFS_EVENTS_PATH,
                eventRecorded
                        ? "Big Data event recorded. Flume will ingest this event into HDFS."
                        : "This response uses the latest saved recommendation snapshot. Generate again to record a new Big Data event.",
                bigDataStatusService.latestAnalyticsAvailable()
        );
    }

    private List<MatchedCategoryResponse> mapMatchedCategories(java.util.Collection<RecommendationResult> results) {
        Map<Long, Set<String>> keywordsByCategory = new LinkedHashMap<>();
        Map<Long, String> categoryNames = new LinkedHashMap<>();

        for (RecommendationResult result : results) {
            Course course = result.getCourse();
            if (result.getCategoryMatchScore() <= 0 && result.getSkillMatchScore() <= 0) {
                continue;
            }
            Long categoryId = course.getCategory().getId();
            categoryNames.put(categoryId, course.getCategory().getName());
            Set<String> keywords = keywordsByCategory.computeIfAbsent(categoryId, ignored -> new LinkedHashSet<>());
            course.getSkills().stream()
                    .limit(6)
                    .map(Skill::getName)
                    .forEach(keywords::add);
        }

        return keywordsByCategory.entrySet().stream()
                .map(entry -> new MatchedCategoryResponse(entry.getKey(), categoryNames.get(entry.getKey()), new ArrayList<>(entry.getValue())))
                .toList();
    }

    private record SkillDetectionMatch(
            String matchedKeyword,
            MatchSource matchSource,
            double confidenceScore
    ) {
    }

    private record CourseScoreDetails(
            int totalScore,
            int titleMatchScore,
            int skillMatchScore,
            int categoryMatchScore,
            int bonusScore,
            List<String> matchedTitleKeywords,
            List<String> matchedSkills,
            List<String> matchedCategories
    ) {
    }
}
