import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { PropsWithChildren, ReactNode } from "react";
import { useEffect, useState, type MouseEvent } from "react";

const userLinks = [
  { to: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/courses", label: "Courses", icon: <CoursesIcon /> },
  { to: "/projects", label: "Project Ideas", icon: <ProjectsIcon /> },
  { to: "/saved-courses", label: "Saved", icon: <SavedIcon /> },
  { to: "/progress", label: "Progress", icon: <ProgressIcon /> },
];

const adminLinks = [
  { to: "/admin", label: "Admin Overview", icon: <AdminIcon /> },
  { to: "/admin/courses", label: "Courses", icon: <CoursesIcon /> },
  { to: "/admin/categories", label: "Categories", icon: <CategoryIcon /> },
  { to: "/admin/providers", label: "Providers", icon: <ProviderIcon /> },
  { to: "/admin/skills", label: "Skills", icon: <SkillsIcon /> },
];

export function AppShell({ children }: PropsWithChildren) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  useEffect(() => {
    const closeOnResize = () => {
      if (window.innerWidth > 1100) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", closeOnResize);
    return () => window.removeEventListener("resize", closeOnResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth <= 1100) {
      setMobileOpen(false);
    }
  }, [location.pathname]);

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>) {
    setMobileOpen(false);

    if (window.innerWidth > 1100) {
      setDesktopCollapsed(true);
      event.currentTarget.blur();
    }
  }

  return (
    <div className="app-frame">
      <button
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        className="sidebar-burger"
        onClick={() => setMobileOpen((value) => !value)}
        type="button"
      >
        <span />
        <span />
        <span />
      </button>

      {mobileOpen ? <button aria-label="Close navigation" className="sidebar-backdrop" onClick={() => setMobileOpen(false)} type="button" /> : null}

      <aside
        className={`sidebar ${mobileOpen ? "mobile-open" : ""} ${desktopCollapsed ? "desktop-collapsed" : ""}`}
        onMouseLeave={() => setDesktopCollapsed(false)}
      >
        <div className="sidebar-top">
          <div className="brand-lockup">
            <div className="brand-mark">SB</div>
            <div className="sidebar-copy">
              <p className="eyebrow">Learning Navigator</p>
              <h1>SkillBridge</h1>
            </div>
          </div>

          <nav className="nav-stack">
            {userLinks.map((link) => (
              <NavLink key={link.to} className="nav-link" onClick={handleNavClick} to={link.to}>
                <span className="nav-icon" aria-hidden="true">{link.icon}</span>
                <span className="nav-label">{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {user?.role === "ADMIN" ? (
          <div className="admin-panel">
            <p className="eyebrow sidebar-section-label">Admin</p>
            <div className="nav-stack">
              {adminLinks.map((link) => (
                <NavLink key={link.to} className="nav-link" onClick={handleNavClick} to={link.to}>
                  <span className="nav-icon" aria-hidden="true">{link.icon}</span>
                  <span className="nav-label">{link.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ) : null}

        <div className="profile-card">
          <div className="profile-summary">
            <div className="profile-avatar" aria-hidden="true">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="profile-copy">
              <p className="profile-name">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="profile-role">{user?.role}</p>
            </div>
          </div>

          <button className="ghost-button sidebar-action" onClick={logout} type="button">
            <span className="nav-icon" aria-hidden="true">
              <LogoutIcon />
            </span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-panel">{children}</main>
    </div>
  );
}

function SidebarIcon({ children }: { children: ReactNode }) {
  return (
    <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24" width="20">
      {children}
    </svg>
  );
}

function DashboardIcon() {
  return (
    <SidebarIcon>
      <path d="M4 5h7v6H4z" />
      <path d="M13 5h7v4h-7z" />
      <path d="M13 11h7v8h-7z" />
      <path d="M4 13h7v6H4z" />
    </SidebarIcon>
  );
}

function CoursesIcon() {
  return (
    <SidebarIcon>
      <path d="M5 4.5h11a3 3 0 0 1 3 3v12H8a3 3 0 0 0-3 3z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </SidebarIcon>
  );
}

function ProjectsIcon() {
  return (
    <SidebarIcon>
      <path d="M6 4h12l2 4-8 12L4 8z" />
      <path d="M9 8h6" />
    </SidebarIcon>
  );
}

function SavedIcon() {
  return (
    <SidebarIcon>
      <path d="M7 4h10a2 2 0 0 1 2 2v14l-7-4-7 4V6a2 2 0 0 1 2-2z" />
    </SidebarIcon>
  );
}

function ProgressIcon() {
  return (
    <SidebarIcon>
      <path d="M4 12a8 8 0 1 0 8-8" />
      <path d="M12 8v5l3 2" />
    </SidebarIcon>
  );
}

function AdminIcon() {
  return (
    <SidebarIcon>
      <path d="M12 3l7 4v5c0 4.5-2.8 7-7 9-4.2-2-7-4.5-7-9V7z" />
      <path d="M9.5 12l1.5 1.5 3.5-3.5" />
    </SidebarIcon>
  );
}

function CategoryIcon() {
  return (
    <SidebarIcon>
      <path d="M4 7h7v5H4z" />
      <path d="M13 7h7v5h-7z" />
      <path d="M4 14h7v5H4z" />
      <path d="M13 14h7v5h-7z" />
    </SidebarIcon>
  );
}

function ProviderIcon() {
  return (
    <SidebarIcon>
      <path d="M4 19V9l8-5 8 5v10" />
      <path d="M9 19v-5h6v5" />
    </SidebarIcon>
  );
}

function SkillsIcon() {
  return (
    <SidebarIcon>
      <path d="M7 7h7l3 3-7 7-3-3z" />
      <path d="M14 7l3-3" />
      <circle cx="8.5" cy="8.5" r=".5" fill="currentColor" stroke="none" />
    </SidebarIcon>
  );
}

function LogoutIcon() {
  return (
    <SidebarIcon>
      <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
      <path d="M14 16l4-4-4-4" />
      <path d="M18 12h-8" />
    </SidebarIcon>
  );
}
