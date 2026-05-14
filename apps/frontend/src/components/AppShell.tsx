import type { PropsWithChildren, ReactNode } from "react";
import { useEffect, useState, type MouseEvent } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { BrandLogo } from "./BrandLogo";
import { cx } from "./ui";

const userLinks = [
  { to: "/dashboard", label: "Home", icon: <DashboardIcon /> },
  { to: "/courses", label: "Courses", icon: <CoursesIcon /> },
  { to: "/projects", label: "Project Ideas", icon: <ProjectsIcon /> },
  { to: "/saved-courses", label: "Saved", icon: <SavedIcon /> },
  { to: "/progress", label: "Progress", icon: <ProgressIcon /> },
];

const adminLinks = [
  { to: "/admin", label: "Admin Overview", icon: <AdminIcon /> },
  { to: "/admin/users", label: "Users", icon: <UsersIcon /> },
  { to: "/admin/courses", label: "Courses", icon: <CoursesIcon /> },
  { to: "/admin/categories", label: "Categories", icon: <CategoryIcon /> },
  { to: "/admin/providers", label: "Providers", icon: <ProviderIcon /> },
  { to: "/admin/skills", label: "Skills", icon: <SkillsIcon /> },
  { to: "/admin/bigdata", label: "Big Data & Analytics", icon: <PipelineIcon /> },
];

function SidebarLink({
  collapsed,
  label,
  icon,
  to,
  onClick,
}: {
  collapsed: boolean;
  label: string;
  icon: ReactNode;
  to: string;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <NavLink
      className={({ isActive }) =>
        cx(
          "group relative flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-[0.95rem] font-bold transition-all duration-300 overflow-hidden",
          isActive
            ? "border-transparent bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-dark)] text-white shadow-md shadow-[var(--color-accent)]/30"
            : "border-transparent text-[var(--color-text-muted)] hover:bg-black/5 hover:text-[var(--color-text-strong)]",
        )
      }
      onClick={onClick}
      to={to}
    >
      <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center text-current transition-transform group-hover:scale-110 group-active:scale-95">
        {icon}
      </span>
      <span className={cx("whitespace-nowrap transition-all duration-300", collapsed ? "pointer-events-none w-0 overflow-hidden opacity-0" : "opacity-100")}>
        {label}
      </span>
    </NavLink>
  );
}

export function AppShell({ children }: PropsWithChildren) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(true);

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
      const timer = window.setTimeout(() => setMobileOpen(false), 0);
      return () => window.clearTimeout(timer);
    }
  }, [location.pathname]);

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>) {
    setMobileOpen(false);

    if (window.innerWidth > 1100) {
      setDesktopCollapsed(true);
      event.currentTarget.blur();
    }
  }

  const collapsed = !mobileOpen && desktopCollapsed;

  return (
    <div className="min-h-screen">
      <button
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        className="fixed left-4 top-4 z-40 inline-grid gap-1.5 rounded-[1.25rem] border border-[var(--line-soft)] bg-[var(--color-surface-strong)] p-3.5 shadow-lg backdrop-blur-xl lg:hidden"
        onClick={() => setMobileOpen((value) => !value)}
        type="button"
      >
        <span className="h-0.5 w-6 rounded-full bg-[var(--color-text)]" />
        <span className="h-0.5 w-6 rounded-full bg-[var(--color-text)]" />
        <span className="h-0.5 w-6 rounded-full bg-[var(--color-text)]" />
      </button>

      {mobileOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden transition-all"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 flex min-h-screen flex-col justify-between overflow-x-hidden border-r border-[var(--line-soft)] bg-white/70 px-4 py-8 shadow-[12px_0_40px_rgba(62,39,35,0.03)] backdrop-blur-3xl transition-all duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "w-[92px]" : "w-[300px]",
        )}
        onMouseEnter={() => {
          if (window.innerWidth > 1100) {
            setDesktopCollapsed(false);
          }
        }}
        onMouseLeave={() => {
          if (window.innerWidth > 1100) {
            setDesktopCollapsed(true);
          }
        }}
      >
        <div className="grid gap-8">
          <div className={cx("overflow-hidden", collapsed ? "flex justify-center px-0" : "px-2")}>
            <div className={cx("min-w-0 transition-all duration-300", collapsed ? "w-10" : "w-[260px]")}>
              <BrandLogo compact={collapsed} />
            </div>
          </div>

          <nav className="grid gap-2.5">
            {userLinks.map((link) => (
              <SidebarLink collapsed={collapsed} icon={link.icon} key={link.to} label={link.label} onClick={handleNavClick} to={link.to} />
            ))}
          </nav>

          {user?.role === "ADMIN" ? (
            <div className="grid gap-3.5 border-t border-[var(--line-soft)] pt-6">
              <p className={cx("px-3 text-[0.7rem] font-bold uppercase tracking-[0.35em] text-[var(--color-accent-dark)] transition-all", collapsed ? "opacity-0" : "opacity-100")}>
                Admin Center
              </p>
              <div className="grid gap-2.5">
                {adminLinks.map((link) => (
                  <SidebarLink collapsed={collapsed} icon={link.icon} key={link.to} label={link.label} onClick={handleNavClick} to={link.to} />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 border-t border-[var(--line-soft)] pt-6">
          <button
            className="group flex items-center justify-center gap-3.5 rounded-[1.25rem] border border-[var(--line)] bg-white/60 px-4 py-3.5 text-[0.95rem] font-bold text-[var(--color-text-strong)] transition-all hover:-translate-y-1 hover:border-[var(--line-soft)] hover:bg-white hover:shadow-md"
            onClick={logout}
            type="button"
          >
            <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center text-[var(--color-danger)] transition-transform group-hover:scale-110">
              <LogoutIcon />
            </span>
            <span className={cx("whitespace-nowrap transition-all duration-300", collapsed ? "w-0 overflow-hidden opacity-0" : "opacity-100")}>Log out securely</span>
          </button>

          <div className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-3.5 px-1">
            <div
              aria-hidden="true"
              className="grid size-[3rem] shrink-0 place-items-center rounded-full bg-[var(--brand-gradient)] font-bold text-white shadow-md shadow-[var(--accent-wash-strong)]"
            >
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className={cx("min-w-0 transition-all duration-300", collapsed ? "w-0 overflow-hidden opacity-0" : "opacity-100")}>
              <p className="truncate text-[0.95rem] font-bold text-[var(--color-text)]">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-[0.8rem] font-semibold text-[var(--color-text-muted)]">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen min-w-0 overflow-x-hidden px-4 py-24 transition-all duration-300 sm:px-8 lg:ml-[92px] lg:px-12 lg:py-12 flex flex-col items-center">
        <div className="w-full min-w-0 max-w-[1600px] flex-grow">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarIcon({ children }: { children: ReactNode }) {
  return (
    <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20">
      {children}
    </svg>
  );
}

function DashboardIcon() {
  return (
    <SidebarIcon>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </SidebarIcon>
  );
}

function CoursesIcon() {
  return (
    <SidebarIcon>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </SidebarIcon>
  );
}

function ProjectsIcon() {
  return (
    <SidebarIcon>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </SidebarIcon>
  );
}

function SavedIcon() {
  return (
    <SidebarIcon>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </SidebarIcon>
  );
}

function ProgressIcon() {
  return (
    <SidebarIcon>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </SidebarIcon>
  );
}

function AdminIcon() {
  return (
    <SidebarIcon>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </SidebarIcon>
  );
}

function CategoryIcon() {
  return (
    <SidebarIcon>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </SidebarIcon>
  );
}

function ProviderIcon() {
  return (
    <SidebarIcon>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </SidebarIcon>
  );
}

function SkillsIcon() {
  return (
    <SidebarIcon>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </SidebarIcon>
  );
}

function PipelineIcon() {
  return (
    <SidebarIcon>
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </SidebarIcon>
  );
}

function UsersIcon() {
  return (
    <SidebarIcon>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </SidebarIcon>
  );
}

function LogoutIcon() {
  return (
    <SidebarIcon>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </SidebarIcon>
  );
}
