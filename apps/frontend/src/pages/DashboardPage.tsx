import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  cx,
  emptyText,
  errorText,
  eyebrow,
  heroPanel,
  listCard,
  mutedText,
  pageStack,
  panel,
  primaryButton,
  sectionTitle,
  textarea,
  tag,
} from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import type { ProgressEntry, ProjectIdea, SavedCourse, Course, PageResponse } from "../types/api";

const rotatingPrompts = [
  "What do you want to build today?",
  "What do you want to learn next?",
  "What idea has been stuck in your head lately?",
  "What would feel exciting to ship this week?",
];

const suggestionPrompts = [
  "Build a portfolio site for a freelance designer",
  "Learn the backend skills needed for a booking app",
  "Create a small AI study assistant for students",
  "Figure out the roadmap for a mobile fitness tracker",
];

const promptVisitStorageKey = "skillbridge.welcome-prompt-index";

function createProjectTitle(prompt: string) {
  const trimmed = prompt.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return "New project idea";
  }
  const words = trimmed.split(" ");
  const shortTitle = words.slice(0, 6).join(" ");
  return shortTitle.length === trimmed.length ? shortTitle : `${shortTitle}...`;
}

function getPromptIndexForVisit() {
  if (typeof window === "undefined") return 0;
  const currentValue = Number(window.sessionStorage.getItem(promptVisitStorageKey) ?? "-1");
  const nextValue = Number.isFinite(currentValue) ? (currentValue + 1) % rotatingPrompts.length : 0;
  window.sessionStorage.setItem(promptVisitStorageKey, String(nextValue));
  return nextValue;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectIdea[]>([]);
  const [saved, setSaved] = useState<SavedCourse[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [topCourses, setTopCourses] = useState<Course[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phraseIndex] = useState(getPromptIndexForVisit);

  useEffect(() => {
    Promise.all([
      api.getProjects(),
      api.getSavedCourses().catch(() => [] as SavedCourse[]),
      api.getProgress().catch(() => [] as ProgressEntry[]),
      api.getCourses({ size: 4, sort: "popularity" }).catch(() => ({ content: [], totalElements: 0 } as unknown as PageResponse<Course>)),
    ])
      .then(([projectItems, savedItems, progressItems, coursesPage]) => {
        setProjects(projectItems);
        setSaved(savedItems);
        setProgress(progressItems);
        setTopCourses(coursesPage.content);
        setTotalCourses(coursesPage.totalElements);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load your workspace."));
  }, []);

  const recentProjects = useMemo(() => projects.slice(0, 3), [projects]);
  const recentSaved = useMemo(() => saved.slice(0, 3), [saved]);
  const activeProgress = useMemo(() => progress.filter((item) => item.status !== "COMPLETED").slice(0, 4), [progress]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;
    setLoading(true);
    setError("");
    try {
      const project = await api.createProject({ title: createProjectTitle(trimmedPrompt), description: trimmedPrompt });
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your idea right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cx(pageStack, "max-w-screen-2xl")}>
      {/* ── Hero ── */}
      <section className={cx(heroPanel, "grid gap-8 overflow-hidden px-6 py-12 sm:px-10 lg:px-14")}>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-[var(--color-accent)] opacity-20 blur-[80px]" />
        <div className="absolute bottom-0 left-[20%] -mb-16 h-48 w-48 rounded-full bg-[var(--color-accent-dark)] opacity-10 blur-[60px]" />

        <div className="relative z-10 mx-auto grid w-full max-w-5xl gap-4">
          <p className={eyebrow}>Welcome back</p>
          <h2 className={cx(sectionTitle, "max-w-4xl text-4xl leading-tight sm:text-5xl lg:text-[3.5rem] tracking-tight")}>
            {user?.firstName}, <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-dark)] bg-clip-text text-transparent">{rotatingPrompts[phraseIndex]}</span>
          </h2>
          <p className={cx(mutedText, "max-w-2xl text-lg leading-relaxed mt-2")}>
            Start with one sentence. We&apos;ll turn it into a full project idea, map out what you need to learn, and connect you to the right courses to make it happen.
          </p>
        </div>

        <form className={cx(panel, "relative z-10 mx-auto grid w-full max-w-5xl gap-6 border-[var(--accent-border)] bg-[var(--color-surface-strong)] p-6 shadow-2xl sm:p-10")} onSubmit={handleSubmit}>
          <div className="relative">
            <textarea className={textarea} id="welcome-prompt" placeholder="I want to build a community platform for local artists with profiles, events, and messaging..." rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button className={primaryButton} disabled={loading || prompt.trim().length === 0} type="submit">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Saving...
                  </span>
                ) : "Start from this idea"}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--color-text-muted)]">Or try a suggestion:</p>
              <Link className="text-sm font-bold text-[var(--color-accent)] hover:underline" to="/projects">Browse all ideas &rarr;</Link>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {suggestionPrompts.map((item) => (
                <button key={item} className="rounded-full border border-[var(--line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)] transition-all hover:-translate-y-0.5 hover:border-[var(--accent-border)] hover:bg-[var(--accent-wash)] hover:text-[var(--color-accent-dark)]" onClick={() => setPrompt(item)} type="button">{item}</button>
              ))}
            </div>
          </div>
          {error ? <p className={errorText}>{error}</p> : null}
        </form>
      </section>

      {/* ── Stats Strip ── */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Courses" value={totalCourses} icon={<IconBook />} />
        <StatCard label="My Projects" value={projects.length} icon={<IconLightbulb />} />
        <StatCard label="Saved Courses" value={saved.length} icon={<IconBookmark />} />
        <StatCard label="In Progress" value={progress.length} icon={<IconTrendingUp />} />
      </section>

      {/* ── Recent Ideas + Active Paths ── */}
      <section className="grid gap-6 lg:grid-cols-2">
        <article className={panel}>
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <p className={eyebrow}>Recent ideas</p>
              <h3 className="mt-1.5 font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl font-bold text-[var(--color-text)]">Pick up where you left off</h3>
            </div>
            <Link className="rounded-full bg-white/50 px-4 py-2 text-sm font-bold text-[var(--color-accent-dark)] transition hover:bg-[var(--accent-wash)]" to="/projects">See all</Link>
          </div>
          <div className="grid gap-3">
            {recentProjects.map((project) => (
              <Link className={listCard} key={project.id} to={`/projects/${project.id}`}>
                <div className="flex items-start justify-between">
                  <strong className="text-lg font-bold text-[var(--color-text-strong)]">{project.title}</strong>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-wash)] text-[var(--color-accent)] group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors">&rarr;</span>
                </div>
                <p className="text-sm leading-relaxed text-[var(--color-text-muted)] line-clamp-2">{project.description}</p>
                {project.detectedSkills?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {project.detectedSkills.slice(0, 4).map((skill) => (
                      <span key={skill} className={cx(tag, "text-[0.65rem] px-2 py-0.5")}>{skill}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
            {recentProjects.length === 0 && (
              <div className="rounded-[1.25rem] border border-dashed border-[var(--line)] bg-[var(--color-surface-muted)] p-8 text-center">
                <p className={emptyText}>No saved ideas yet. Your first prompt above can start the whole flow.</p>
              </div>
            )}
          </div>
        </article>

        <article className={panel}>
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <p className={eyebrow}>Continue learning</p>
              <h3 className="mt-1.5 font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl font-bold text-[var(--color-text)]">Your active paths</h3>
            </div>
            <Link className="rounded-full bg-white/50 px-4 py-2 text-sm font-bold text-[var(--color-accent-dark)] transition hover:bg-[var(--accent-wash)]" to="/progress">Open progress</Link>
          </div>
          <div className="grid gap-3">
            {activeProgress.map((item) => (
              <div className={listCard} key={item.id}>
                <strong className="text-lg font-bold text-[var(--color-text-strong)]">{item.course.title}</strong>
                <p className="text-xs font-semibold text-[var(--color-text-muted)] mt-1">{item.course.category?.name} · {item.course.provider?.name}</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--line-soft)] shadow-inner">
                    <div className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-dark)] rounded-full transition-all" style={{ width: `${item.progressPercent}%` }} />
                  </div>
                  <span className="text-xs font-bold text-[var(--color-accent-dark)] min-w-[3ch]">{item.progressPercent}%</span>
                </div>
              </div>
            ))}
            {activeProgress.length === 0 && recentSaved.length > 0 && recentSaved.map((item) => (
              <div className={listCard} key={item.id}>
                <strong className="text-lg font-bold text-[var(--color-text-strong)]">{item.course.title}</strong>
                <span className="mt-1 inline-block w-fit rounded-full bg-[var(--accent-wash)] px-2.5 py-1 text-xs font-bold text-[var(--color-accent-dark)]">Saved for later</span>
              </div>
            ))}
            {activeProgress.length === 0 && recentSaved.length === 0 && (
              <div className="rounded-[1.25rem] border border-dashed border-[var(--line)] bg-[var(--color-surface-muted)] p-8 text-center">
                <p className={emptyText}>Once you save or start a course, it will show up here.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      {/* ── Popular Courses ── */}
      {topCourses.length > 0 && (
        <section className={panel}>
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <p className={eyebrow}>Popular courses</p>
              <h3 className="mt-1.5 font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl font-bold text-[var(--color-text)]">Trending in the catalog</h3>
            </div>
            <Link className="rounded-full bg-white/50 px-4 py-2 text-sm font-bold text-[var(--color-accent-dark)] transition hover:bg-[var(--accent-wash)]" to="/courses">Browse all &rarr;</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topCourses.map((course) => (
              <div key={course.id} className="group grid gap-2.5 rounded-[1.5rem] border-2 border-white/60 bg-gradient-to-br from-white/70 to-white/40 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-border)] hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <span className={cx(tag, "text-[0.65rem]")}>{course.category?.name || "General"}</span>
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--color-accent-dark)]">{course.level}</span>
                </div>
                <strong className="font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-lg text-[var(--color-text-strong)] line-clamp-2">{course.title}</strong>
                <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">{course.description}</p>
                <div className="mt-auto pt-3 flex items-center justify-between border-t border-[var(--line-faint)]">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)]">{course.provider?.name}</span>
                  <Link to="/courses" className="text-xs font-bold text-[var(--color-accent)] hover:underline">View &rarr;</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Navigation Cards ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NavCard to="/projects" icon={<IconLightbulb />} title="Project ideas" description="Describe something you want to build and get moving." color="var(--accent-wash)" />
        <NavCard to="/courses" icon={<IconBook />} title="Course catalog" description={`Browse over ${totalCourses > 0 ? totalCourses.toLocaleString() : "17,000"} courses in the library.`} color="rgba(99, 102, 241, 0.08)" />
        <NavCard to="/saved-courses" icon={<IconBookmark />} title="Saved courses" description="Come back to the courses you marked for later." color="rgba(20, 184, 166, 0.08)" />
        <NavCard to="/progress" icon={<IconTrendingUp />} title="Your progress" description="Track your learning journey and milestones." color="rgba(245, 158, 11, 0.08)" />
      </section>
    </div>
  );
}

/* ─── Sub-components ─── */

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border-2 border-white/60 bg-gradient-to-br from-white/80 to-white/50 p-5 shadow-[0_12px_40px_-10px_rgba(62,39,35,0.08)] backdrop-blur-xl transition-all hover:border-[var(--accent-border)] hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-wash)] text-[var(--color-accent)]">{icon}</div>
        <div>
          <strong className="block font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-3xl text-[var(--color-text-strong)]">{value > 0 ? value.toLocaleString() : "–"}</strong>
          <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-[var(--color-accent-dark)]">{label}</span>
        </div>
      </div>
    </div>
  );
}

function NavCard({ to, icon, title, description, color }: { to: string; icon: React.ReactNode; title: string; description: string; color: string }) {
  return (
    <Link className={cx(listCard, "hover:-translate-y-2")} to={to}>
      <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: color }}>{icon}</div>
      <strong className="text-lg font-bold text-[var(--color-text)]">{title}</strong>
      <span className="text-sm leading-relaxed text-[var(--color-text-muted)]">{description}</span>
    </Link>
  );
}

/* ─── SVG Icons (no emojis) ─── */

function IconBook() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  );
}

function IconLightbulb() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M9 18h6" /><path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconTrendingUp() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
