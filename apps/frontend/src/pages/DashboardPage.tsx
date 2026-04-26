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
  secondaryButton,
  sectionTitle,
  textarea,
} from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import type { ProgressEntry, ProjectIdea, SavedCourse } from "../types/api";

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
  if (typeof window === "undefined") {
    return 0;
  }

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
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phraseIndex] = useState(getPromptIndexForVisit);

  useEffect(() => {
    Promise.all([api.getProjects(), api.getSavedCourses(), api.getProgress()])
      .then(([projectItems, savedItems, progressItems]) => {
        setProjects(projectItems);
        setSaved(savedItems);
        setProgress(progressItems);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load your workspace."));
  }, []);

  const recentProjects = useMemo(() => projects.slice(0, 3), [projects]);
  const recentSaved = useMemo(() => saved.slice(0, 3), [saved]);
  const activeProgress = useMemo(() => progress.filter((item) => item.status !== "COMPLETED").slice(0, 3), [progress]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const project = await api.createProject({
        title: createProjectTitle(trimmedPrompt),
        description: trimmedPrompt,
      });
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your idea right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cx(pageStack, "max-w-screen-2xl")}>
      <section className={cx(heroPanel, "grid gap-6 overflow-hidden px-6 py-8 sm:px-8 lg:px-12")}>
        <div className="mx-auto grid w-full max-w-5xl gap-2">
          <p className={eyebrow}>Welcome back</p>
          <h2 className={cx(sectionTitle, "max-w-4xl text-3xl leading-tight sm:text-4xl lg:text-5xl")}>
            {user?.firstName}, <span className="text-[var(--color-accent-dark)]">{rotatingPrompts[phraseIndex]}</span>
          </h2>
          <p className={cx(mutedText, "justify-center text-base leading-7")}>
            Start with one sentence. We&apos;ll turn it into a project idea you can build on, explore, and connect to the right learning path.
          </p>
        </div>

        <form
          className={cx(
            panel,
            "mx-auto grid w-full max-w-5xl gap-5 border-[var(--accent-border)] bg-[var(--color-surface-strong)] p-6 shadow-[0_28px_80px_rgba(48,25,17,0.1)] sm:p-8",
          )}
          onSubmit={handleSubmit}
        >

          <textarea
            className={textarea}
            id="welcome-prompt"
            placeholder="I want to build a community platform for local artists with profiles, events, and messaging..."
            rows={4}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <button className={primaryButton} disabled={loading || prompt.trim().length === 0} type="submit">
              {loading ? "Saving your idea..." : "Start from this idea"}
            </button>
            <Link className={secondaryButton} to="/projects">
              Browse all ideas
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {suggestionPrompts.map((item) => (
              <button
                key={item}
                className="rounded-full border border-[var(--accent-border)] bg-[var(--color-surface-strong)] px-4 py-2 text-sm font-medium text-[var(--color-accent-dark)] transition hover:-translate-y-0.5 hover:border-[var(--accent-border-strong)] hover:bg-[var(--color-card-strong)]"
                onClick={() => setPrompt(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
          {error ? <p className={errorText}>{error}</p> : null}
        </form>
      </section>

      <section className="flex flex-wrap gap-5">
        <article className={cx(panel, "min-w-80 flex-1")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={eyebrow}>Recent ideas</p>
              <h3 className="mt-1 font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[var(--color-text)]">Pick up where you left off</h3>
            </div>
            <Link className="text-sm font-medium text-[var(--color-accent-dark)] underline-offset-4 hover:underline" to="/projects">
              See all
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {recentProjects.map((project) => (
              <Link className={listCard} key={project.id} to={`/projects/${project.id}`}>
                <strong className="text-[var(--color-text)]">{project.title}</strong>
                <p className="text-sm leading-6 text-[var(--color-text-muted)]">{project.description.slice(0, 110)}...</p>
              </Link>
            ))}
            {recentProjects.length === 0 ? <p className={emptyText}>No saved ideas yet. Your first prompt can start the whole flow.</p> : null}
          </div>
        </article>

        <article className={cx(panel, "min-w-80 flex-1")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={eyebrow}>Continue learning</p>
              <h3 className="mt-1 font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[var(--color-text)]">Quiet reminders, not a busy dashboard</h3>
            </div>
            <Link className="text-sm font-medium text-[var(--color-accent-dark)] underline-offset-4 hover:underline" to="/progress">
              Open progress
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {activeProgress.map((item) => (
              <div className={listCard} key={item.id}>
                <strong className="text-[var(--color-text)]">{item.course.title}</strong>
                <span className="text-sm text-[var(--color-text-muted)]">{item.progressPercent}% complete</span>
              </div>
            ))}
            {activeProgress.length === 0 && recentSaved.length > 0
              ? recentSaved.map((item) => (
                  <div className={listCard} key={item.id}>
                    <strong className="text-[var(--color-text)]">{item.course.title}</strong>
                    <span className="text-sm text-[var(--color-text-muted)]">Saved for later</span>
                  </div>
                ))
              : null}
            {activeProgress.length === 0 && recentSaved.length === 0 ? (
              <p className={emptyText}>Once you save or start a course, it will show up here in a much lighter way.</p>
            ) : null}
          </div>
        </article>

        <article className={cx(panel, "basis-full")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={eyebrow}>Start points</p>
              <h3 className="mt-1 font-['Fraunces',_'Source_Serif_4',_Georgia,_serif] text-2xl text-[var(--color-text)]">Choose a direction without overthinking it</h3>
            </div>
            <Link className="text-sm font-medium text-[var(--color-accent-dark)] underline-offset-4 hover:underline" to="/courses">
              Explore courses
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className={cx(listCard, "min-w-56 flex-1")} to="/projects">
              <strong className="text-[var(--color-text)]">Project ideas</strong>
              <span className="text-sm leading-6 text-[var(--color-text-muted)]">Describe something you want to build and get moving.</span>
            </Link>
            <Link className={cx(listCard, "min-w-56 flex-1")} to="/courses">
              <strong className="text-[var(--color-text)]">Course catalog</strong>
              <span className="text-sm leading-6 text-[var(--color-text-muted)]">Browse the full learning library when you want to explore.</span>
            </Link>
            <Link className={cx(listCard, "min-w-56 flex-1")} to="/saved-courses">
              <strong className="text-[var(--color-text)]">Saved courses</strong>
              <span className="text-sm leading-6 text-[var(--color-text-muted)]">Come back to the courses you marked for later.</span>
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
