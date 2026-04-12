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
  skills: string[];
  published: boolean;
  popularityScore: number;
  createdAt: string;
  updatedAt: string;
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
  score: number;
  titleMatchScore: number;
  skillMatchScore: number;
  categoryMatchScore: number;
  bonusScore: number;
  explanation: string;
  course: Course;
}

export interface RecommendationResponse {
  snapshotId: number;
  generatedAt: string;
  algorithmVersion: string;
  keywordSummary: string;
  project: ProjectIdea;
  detectedSkills: DetectedSkill[];
  recommendations: RecommendedCourse[];
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
  totalSkills: number;
  totalProjects: number;
  savedCourses: number;
  progressEntries: number;
}

export interface ApiErrorPayload {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  details?: string[];
}
