import type { ReactElement } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { AppShell } from "../components/AppShell";
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
    return <div className="loading-screen">Preparing SkillBridge…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
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
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

function PublicOnly({ children }: { children: ReactElement }) {
  const { initialized, isAuthenticated } = useAuth();
  if (!initialized) {
    return <div className="loading-screen">Preparing SkillBridge…</div>;
  }
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<RouteMeta title="Login" />}>
        <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      </Route>
      <Route element={<RouteMeta title="Register" />}>
        <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      </Route>

      <Route element={<AuthGate />}>
        <Route element={<RouteMeta title="Dashboard" />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        <Route element={<RouteMeta title="Courses" />}>
          <Route path="/courses" element={<CoursesPage />} />
        </Route>
        <Route element={<RouteMeta title="Projects" />}>
          <Route path="/projects" element={<ProjectsPage />} />
        </Route>
        <Route element={<RouteMeta title="Project Details" />}>
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
        </Route>
        <Route element={<RouteMeta title="Saved Courses" />}>
          <Route path="/saved-courses" element={<SavedCoursesPage />} />
        </Route>
        <Route element={<RouteMeta title="Progress" />}>
          <Route path="/progress" element={<ProgressPage />} />
        </Route>

        <Route element={<AdminGate />}>
          <Route element={<RouteMeta title="Admin Overview" />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Route>
          <Route element={<RouteMeta title="Admin Courses" />}>
            <Route path="/admin/courses" element={<AdminCatalogPage resource="courses" />} />
          </Route>
          <Route element={<RouteMeta title="Admin Categories" />}>
            <Route path="/admin/categories" element={<AdminCatalogPage resource="categories" />} />
          </Route>
          <Route element={<RouteMeta title="Admin Providers" />}>
            <Route path="/admin/providers" element={<AdminCatalogPage resource="providers" />} />
          </Route>
          <Route element={<RouteMeta title="Admin Skills" />}>
            <Route path="/admin/skills" element={<AdminCatalogPage resource="skills" />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
