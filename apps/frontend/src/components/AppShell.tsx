import type { PropsWithChildren, ReactNode } from "react";
import { useEffect, useState, type MouseEvent } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
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
  { to: "/admin/courses", label: "Courses", icon: <CoursesIcon /> },
  { to: "/admin/categories", label: "Categories", icon: <CategoryIcon /> },
  { to: "/admin/providers", label: "Providers", icon: <ProviderIcon /> },
  { to: "/admin/skills", label: "Skills", icon: <SkillsIcon /> },
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
          "group flex items-center gap-3 rounded-[1.15rem] border px-3 py-3 text-sm font-medium transition",
          isActive
            ? "border-[var(--accent-border-strong)] bg-[var(--accent-wash-strong)] text-[var(--color-accent-dark)]"
            : "border-transparent text-[var(--color-text-muted)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-wash)] hover:text-[var(--color-accent-dark)]",
        )
      }
      onClick={onClick}
      to={to}
    >
      <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center text-current">
        {icon}
      </span>
      <span className={cx("whitespace-nowrap transition", collapsed ? "pointer-events-none w-0 overflow-hidden opacity-0" : "opacity-100")}>
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

  const collapsed = !mobileOpen && desktopCollapsed;

  return (
    <div className="min-h-screen">
      <button
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        className="fixed left-4 top-4 z-40 inline-grid gap-1 rounded-2xl border border-[var(--line)] bg-[var(--color-surface-strong)] p-3 shadow-[0_14px_32px_rgba(48,25,17,0.12)] lg:hidden"
        onClick={() => setMobileOpen((value) => !value)}
        type="button"
      >
        <span className="h-0.5 w-5 rounded-full bg-[var(--color-text)]" />
        <span className="h-0.5 w-5 rounded-full bg-[var(--color-text)]" />
        <span className="h-0.5 w-5 rounded-full bg-[var(--color-text)]" />
      </button>

      {mobileOpen ? (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-[rgba(28,18,14,0.32)] lg:hidden"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 flex min-h-screen flex-col justify-between border-r border-[var(--line)] bg-[rgba(248,241,232,0.9)] px-3 py-5 shadow-[24px_0_60px_rgba(48,25,17,0.08)] backdrop-blur-2xl transition-all duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "w-[84px]" : "w-[292px]",
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
        <div className="grid gap-6">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--brand-gradient)] font-bold tracking-[0.08em] text-white">
              SB
            </div>
            <div className={cx("min-w-0 transition", collapsed ? "w-0 overflow-hidden opacity-0" : "opacity-100")}>
              <h1 className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-[1.65rem] text-[var(--color-text)]">
                SkillBridge
              </h1>
            </div>
          </div>

          <nav className="grid gap-2">
            {userLinks.map((link) => (
              <SidebarLink collapsed={collapsed} icon={link.icon} key={link.to} label={link.label} onClick={handleNavClick} to={link.to} />
            ))}
          </nav>

          {user?.role === "ADMIN" ? (
            <div className="grid gap-3 border-t border-[var(--line)] pt-4">
              <p className={cx("text-xs uppercase tracking-[0.3em] text-[var(--color-accent-dark)] transition", collapsed ? "opacity-0" : "opacity-100")}>
                Admin
              </p>
              <div className="grid gap-2">
                {adminLinks.map((link) => (
                  <SidebarLink collapsed={collapsed} icon={link.icon} key={link.to} label={link.label} onClick={handleNavClick} to={link.to} />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 border-t border-[var(--line)] pt-4">
          <button
            className="inline-flex items-center gap-3 rounded-full border border-[var(--line)] bg-white/50 px-3 py-3 text-sm font-medium text-[var(--color-text-strong)] transition hover:-translate-y-0.5 hover:bg-white/80"
            onClick={logout}
            type="button"
          >
            <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center text-[var(--color-accent-dark)]">
              <LogoutIcon />
            </span>
            <span className={cx("whitespace-nowrap transition", collapsed ? "w-0 overflow-hidden opacity-0" : "opacity-100")}>Logout</span>
          </button>

          <div className="grid grid-cols-[2.8rem_minmax(0,1fr)] items-center gap-3">
            <div
              aria-hidden="true"
              className="grid size-[2.8rem] shrink-0 place-items-center rounded-full bg-[var(--brand-gradient)] font-bold tracking-[0.08em] text-white"
            >
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className={cx("min-w-0 transition", collapsed ? "w-0 overflow-hidden opacity-0" : "opacity-100")}>
              <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-sm text-[var(--color-text-muted)]">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className={cx("min-h-screen px-4 py-20 transition-all sm:px-6 lg:px-8 lg:py-8", collapsed ? "lg:ml-[84px]" : "lg:ml-[292px]")}>
        {children}
      </main>
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
      <circle cx="8.5" cy="8.5" fill="currentColor" r=".5" stroke="none" />
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
