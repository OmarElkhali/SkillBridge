import { useEffect, type ReactElement } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { useAuth } from "../hooks/useAuth";
import { AdminCatalogPage } from "../pages/AdminCatalogPage";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { CoursesPage } from "../pages/CoursesPage";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { ProgressPage } from "../pages/ProgressPage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { RegisterPage } from "../pages/RegisterPage";
import { SavedCoursesPage } from "../pages/SavedCoursesPage";

const loadingScreenClassName =
  "flex min-h-screen items-center justify-center px-6 text-center font-medium text-[var(--color-text-muted)]";

function RouteMeta({ title }: { title: string }) {
  useEffect(() => {
    document.title = `${title} | SkillBridge`;
  }, [title]);

  return <Outlet />;
}

function AuthGate() {
  const { initialized, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!initialized) {
    return <div className={loadingScreenClassName}>Preparing SkillBridge...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function AdminGate() {
  const { user } = useAuth();
  if (user?.role !== "ADMIN") {
    return <Navigate replace to="/dashboard" />;
  }
  return <Outlet />;
}

function PublicOnly({ children }: { children: ReactElement }) {
  const { initialized, isAuthenticated } = useAuth();
  if (!initialized) {
    return <div className={loadingScreenClassName}>Preparing SkillBridge...</div>;
  }
  return isAuthenticated ? <Navigate replace to="/dashboard" /> : children;
}

export function App() {
  return (
    <Routes>
      <Route element={<Navigate replace to="/dashboard" />} path="/" />

      <Route element={<RouteMeta title="Login" />}>
        <Route
          element={
            <PublicOnly>
              <LoginPage />
            </PublicOnly>
          }
          path="/login"
        />
      </Route>
      <Route element={<RouteMeta title="Register" />}>
        <Route
          element={
            <PublicOnly>
              <RegisterPage />
            </PublicOnly>
          }
          path="/register"
        />
      </Route>

      <Route element={<AuthGate />}>
        <Route element={<RouteMeta title="Welcome" />}>
          <Route element={<DashboardPage />} path="/dashboard" />
        </Route>
        <Route element={<RouteMeta title="Courses" />}>
          <Route element={<CoursesPage />} path="/courses" />
        </Route>
        <Route element={<RouteMeta title="Projects" />}>
          <Route element={<ProjectsPage />} path="/projects" />
        </Route>
        <Route element={<RouteMeta title="Project Details" />}>
          <Route element={<ProjectDetailPage />} path="/projects/:id" />
        </Route>
        <Route element={<RouteMeta title="Saved Courses" />}>
          <Route element={<SavedCoursesPage />} path="/saved-courses" />
        </Route>
        <Route element={<RouteMeta title="Progress" />}>
          <Route element={<ProgressPage />} path="/progress" />
        </Route>

        <Route element={<AdminGate />}>
          <Route element={<RouteMeta title="Admin Overview" />}>
            <Route element={<AdminDashboardPage />} path="/admin" />
          </Route>
          <Route element={<RouteMeta title="Admin Courses" />}>
            <Route element={<AdminCatalogPage resource="courses" />} path="/admin/courses" />
          </Route>
          <Route element={<RouteMeta title="Admin Categories" />}>
            <Route element={<AdminCatalogPage resource="categories" />} path="/admin/categories" />
          </Route>
          <Route element={<RouteMeta title="Admin Providers" />}>
            <Route element={<AdminCatalogPage resource="providers" />} path="/admin/providers" />
          </Route>
          <Route element={<RouteMeta title="Admin Skills" />}>
            <Route element={<AdminCatalogPage resource="skills" />} path="/admin/skills" />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
