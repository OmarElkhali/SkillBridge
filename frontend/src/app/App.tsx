import type { ReactElement } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
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
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />

      <Route element={<AuthGate />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/saved-courses" element={<SavedCoursesPage />} />
        <Route path="/progress" element={<ProgressPage />} />

        <Route element={<AdminGate />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/courses" element={<AdminCatalogPage resource="courses" />} />
          <Route path="/admin/categories" element={<AdminCatalogPage resource="categories" />} />
          <Route path="/admin/providers" element={<AdminCatalogPage resource="providers" />} />
          <Route path="/admin/skills" element={<AdminCatalogPage resource="skills" />} />
        </Route>
      </Route>
    </Routes>
  );
}
