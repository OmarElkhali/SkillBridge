import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { PropsWithChildren } from "react";

const userLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/courses", label: "Courses" },
  { to: "/projects", label: "Project Ideas" },
  { to: "/saved-courses", label: "Saved" },
  { to: "/progress", label: "Progress" },
];

const adminLinks = [
  { to: "/admin", label: "Admin Overview" },
  { to: "/admin/courses", label: "Courses" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/providers", label: "Providers" },
  { to: "/admin/skills", label: "Skills" },
];

export function AppShell({ children }: PropsWithChildren) {
  const { user, logout } = useAuth();

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">SkillBridge</p>
          <h1>Idea to learning path.</h1>
          <p className="sidebar-copy">
            Turn a rough project concept into a clear set of skills, courses, and progress milestones.
          </p>
        </div>

        <nav className="nav-stack">
          {userLinks.map((link) => (
            <NavLink key={link.to} className="nav-link" to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {user?.role === "ADMIN" ? (
          <div className="admin-panel">
            <p className="eyebrow">Admin</p>
            <div className="nav-stack">
              {adminLinks.map((link) => (
                <NavLink key={link.to} className="nav-link" to={link.to}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        ) : null}

        <div className="profile-card">
          <div>
            <p className="profile-name">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="profile-role">{user?.role}</p>
          </div>
          <button className="ghost-button" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </aside>

      <main className="main-panel">{children}</main>
    </div>
  );
}
