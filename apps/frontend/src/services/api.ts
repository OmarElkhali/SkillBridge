import type {
  AdminOverview,
  ApiErrorPayload,
  AuthResponse,
  Category,
  Course,
  ProgressEntry,
  ProjectIdea,
  Provider,
  RecommendationResponse,
  SavedCourse,
  Skill,
  UserSummary,
} from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8081";
const TOKEN_STORAGE_KEY = "skillbridge.access-token";

let accessToken = localStorage.getItem(TOKEN_STORAGE_KEY);

function getHeaders(init?: HeadersInit) {
  const headers = new Headers(init);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return headers;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: getHeaders(init?.headers),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json()) as T | ApiErrorPayload;
  if (!response.ok) {
    const error = data as ApiErrorPayload;
    throw new Error(error.details?.join(" ") || error.message || "Request failed.");
  }

  return data as T;
}

export function persistAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getPersistedAccessToken() {
  return accessToken;
}

export const api = {
  login(email: string, password: string) {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  register(firstName: string, lastName: string, email: string, password: string) {
    return request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ firstName, lastName, email, password }),
    });
  },
  getCurrentUser() {
    return request<UserSummary>("/api/users/me");
  },
  getCourses(admin = false) {
    return request<Course[]>(admin ? "/api/courses/admin" : "/api/courses");
  },
  getCategories() {
    return request<Category[]>("/api/categories");
  },
  createCategory(payload: { name: string; description: string }) {
    return request<Category>("/api/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateCategory(id: number, payload: { name: string; description: string }) {
    return request<Category>(`/api/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteCategory(id: number) {
    return request<void>(`/api/categories/${id}`, { method: "DELETE" });
  },
  getProviders() {
    return request<Provider[]>("/api/providers");
  },
  createProvider(payload: { name: string; websiteUrl: string; description: string }) {
    return request<Provider>("/api/providers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateProvider(id: number, payload: { name: string; websiteUrl: string; description: string }) {
    return request<Provider>(`/api/providers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteProvider(id: number) {
    return request<void>(`/api/providers/${id}`, { method: "DELETE" });
  },
  getSkills() {
    return request<Skill[]>("/api/skills");
  },
  createSkill(payload: { name: string; description: string }) {
    return request<Skill>("/api/skills", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateSkill(id: number, payload: { name: string; description: string }) {
    return request<Skill>(`/api/skills/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteSkill(id: number) {
    return request<void>(`/api/skills/${id}`, { method: "DELETE" });
  },
  createCourse(payload: Record<string, unknown>) {
    return request<Course>("/api/courses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateCourse(id: number, payload: Record<string, unknown>) {
    return request<Course>(`/api/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteCourse(id: number) {
    return request<void>(`/api/courses/${id}`, { method: "DELETE" });
  },
  getProjects() {
    return request<ProjectIdea[]>("/api/projects");
  },
  getProject(id: number) {
    return request<ProjectIdea>(`/api/projects/${id}`);
  },
  createProject(payload: { title: string; description: string }) {
    return request<ProjectIdea>("/api/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  generateRecommendations(projectId: number) {
    return request<RecommendationResponse>(`/api/projects/${projectId}/recommendations`, {
      method: "POST",
    });
  },
  getLatestRecommendations(projectId: number) {
    return request<RecommendationResponse>(`/api/projects/${projectId}/recommendations/latest`);
  },
  getSavedCourses() {
    return request<SavedCourse[]>("/api/saved-courses");
  },
  saveCourse(courseId: number) {
    return request<SavedCourse>(`/api/saved-courses/${courseId}`, { method: "POST" });
  },
  unsaveCourse(courseId: number) {
    return request<void>(`/api/saved-courses/${courseId}`, { method: "DELETE" });
  },
  getProgress() {
    return request<ProgressEntry[]>("/api/progress");
  },
  updateProgress(courseId: number, payload: { status: string; progressPercent: number }) {
    return request<ProgressEntry>(`/api/progress/${courseId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  getAdminOverview() {
    return request<AdminOverview>("/api/admin/overview");
  },
  getAdminUsers() {
    return request<UserSummary[]>("/api/admin/users");
  },
};
