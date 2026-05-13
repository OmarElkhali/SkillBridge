export interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "USER" | "ADMIN";
  active: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: UserSummary;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface Provider {
  id: number;
  name: string;
  websiteUrl: string | null;
  description: string | null;
}

export interface Skill {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  level: string;
  language: string;
  sourceUrl: string;
  thumbnailUrl: string | null;
  category: Category;
  provider: Provider;
  skillIds: number[];
  skills: string[];
  published: boolean;
  popularityScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogMetric {
  name: string;
  count: number;
}

export interface SkillCoverage {
  totalCourses: number;
  coursesWithSkills: number;
  coveragePercent: number;
}

export interface CatalogAnalytics {
  topCategories: CatalogMetric[];
  topProviders: CatalogMetric[];
  topSkills: CatalogMetric[];
  levelDistribution: CatalogMetric[];
  skillCoverage: SkillCoverage;
}

export interface ProjectIdea {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  detectedSkills: string[];
}

export interface DetectedSkill {
  skillId: number;
  skillName: string;
  matchedKeyword: string;
  matchSource: string;
  confidenceScore: number;
}

export interface RecommendedCourse {
  rank: number;
  rankPosition: number;
  score: number;
  titleMatchScore: number;
  skillMatchScore: number;
  categoryMatchScore: number;
  bonusScore: number;
  matchedTitleKeywords: string[];
  matchedSkills: string[];
  matchedCategories: string[];
  popularityScore: number;
  sourceUrl: string;
  explanation: string;
  course: Course;
}

export interface MatchedCategory {
  categoryId: number;
  name: string;
  matchedKeywords: string[];
}

export interface RecommendationResponse {
  snapshotId: number;
  generatedAt: string;
  algorithmVersion: string;
  keywordSummary: string;
  project: ProjectIdea;
  detectedSkills: DetectedSkill[];
  matchedCategories: MatchedCategory[];
  recommendations: RecommendedCourse[];
  bigDataTrace: BigDataTrace;
}

export interface BigDataTrace {
  eventRecorded: boolean;
  eventPath: string;
  flumeHdfsPath: string;
  message: string;
  latestAnalyticsAvailable: boolean;
}

export interface SavedCourse {
  id: number;
  savedAt: string;
  course: Course;
}

export interface ProgressEntry {
  id: number;
  status: string;
  progressPercent: number;
  startedAt: string | null;
  completedAt: string | null;
  lastUpdatedAt: string;
  course: Course;
}

export interface AdminOverview {
  totalUsers: number;
  totalCourses: number;
  totalProviders: number;
  totalCategories: number;
  totalSkills: number;
  totalProjects: number;
  savedCourses: number;
  progressEntries: number;
  totalRecommendationSnapshots: number;
  totalRecommendationResults: number;
}

export type AdminBigDataPayload = Record<string, unknown>;

export interface BigDataFile {
  name: string;
  path: string;
  available: boolean;
  sizeBytes: number;
  lastModified: string | null;
}

export interface BigDataStatus {
  files: BigDataFile[];
  catalogBuildReport: Record<string, unknown>;
  bigDataSummary: Record<string, unknown>;
  recommendationResult: Record<string, unknown>;
  latestEvents: Record<string, unknown>[];
  pipelineHealth: Record<string, unknown>;
  flumeHdfsPath: string;
}

export interface BigDataRefreshResponse {
  canRunAutomatically: boolean;
  reason: string;
  commands: string[];
}

export interface ApiErrorPayload {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  details?: string[];
}
